import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { calculateTargetStatus, validateCurrentValue } from "@/lib/target-utils"

// Utility function to extract userId and targetId from URL
function getIdsFromRequest(request: NextRequest): { userId: string | null; targetId: string | null } {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const userIndex = pathParts.indexOf("user")
  const userId = userIndex !== -1 && pathParts.length > userIndex + 1 ? pathParts[userIndex + 1] : null
  const targetId = userIndex !== -1 && pathParts.length > userIndex + 2 ? pathParts[userIndex + 2] : null
  return { userId, targetId }
}

// PUT /api/targets/user/[userId]/[targetId] - Update target progress (users can only update their own targets)
export async function PUT(request: NextRequest) {
  try {
    const { userId: targetUserId, targetId } = getIdsFromRequest(request)

    if (!targetUserId || !targetId) {
      return NextResponse.json({ success: false, error: "Invalid user ID or target ID" }, { status: 400 })
    }

    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Users can only update their own targets
    if (user.userId !== targetUserId) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    const body = await request.json()
    const { currentValue } = body

    if (currentValue === undefined) {
      return NextResponse.json({ success: false, error: "Current value is required" }, { status: 400 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const targetsCollection = db.collection("targets")

    // Get current target
    const currentTarget = await targetsCollection.findOne({
      id: targetId,
      workspaceId: currentWorkspaceId,
      assignedTo: targetUserId,
    })

    if (!currentTarget) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 })
    }

    // Validate current value
    const validation = validateCurrentValue(Number(currentValue), currentTarget.targetValue)
    if (!validation.isValid) {
      return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
    }

    // Calculate new status based on the updated current value
    const statusUpdate = calculateTargetStatus(
      Number(currentValue),
      currentTarget.targetValue,
      currentTarget.deadline,
      currentTarget.status,
    )

    // Build update object
    const updateData: any = {
      currentValue: Number(currentValue),
      updatedAt: new Date().toISOString(),
    }

    // Update status if needed
    if (statusUpdate.shouldUpdate) {
      updateData.status = statusUpdate.status

      // Set completion date if target is being marked as completed
      if (statusUpdate.status === "completed" && currentTarget.status !== "completed") {
        updateData.completedAt = new Date().toISOString()
      }
    }

    const updatedTarget = await targetsCollection.findOneAndUpdate(
      {
        id: targetId,
        workspaceId: currentWorkspaceId,
        assignedTo: targetUserId,
      },
      {
        $set: updateData,
      },
      { returnDocument: "after" },
    )

    if (!updatedTarget?.id) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 })
    }

    // Return success with status update info
    const responseMessage = statusUpdate.shouldUpdate
      ? `Progress updated and status changed to ${statusUpdate.status}`
      : "Progress updated successfully"

    return NextResponse.json({
      success: true,
      data: updatedTarget,
      message: responseMessage,
      statusChanged: statusUpdate.shouldUpdate,
      newStatus: statusUpdate.status,
      reason: statusUpdate.reason,
    })
  } catch (error) {
    console.error("Update user target error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
