import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"
import { calculateTargetStatus, validateCurrentValue } from "@/lib/target-utils"

// Utility function to extract targetId from URL
function getTargetIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const index = pathParts.indexOf("targets")
  return index !== -1 && pathParts.length > index + 1 ? pathParts[index + 1] : null
}

// GET /api/targets/[id]
export async function GET(request: NextRequest) {
  try {
    const targetId = getTargetIdFromRequest(request)
    if (!targetId) {
      return NextResponse.json({ success: false, error: "Invalid target ID" }, { status: 400 })
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const targetsCollection = db.collection("targets")
    const usersCollection = db.collection("users")
    const projectsCollection = db.collection("projects")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    // Only Admins and Owners can access targets
    if (userRole === "Member") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const target = await targetsCollection.findOne({
      id: targetId,
      workspaceId: currentWorkspaceId,
    })

    if (!target) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 })
    }

    // Populate target data
    const populatedTarget = { ...target }

    // Populate assignee
    if (target.assignedTo) {
      const assignee = await usersCollection.findOne({ id: target.assignedTo })
      if (assignee) {
        populatedTarget.assignee = {
          id: assignee.id,
          username: assignee.username,
          email: assignee.email,
          profilePictureUrl: assignee.profilePictureUrl,
        }
      }
    }

    // Populate project
    if (target.projectId) {
      const project = await projectsCollection.findOne({ id: target.projectId })
      if (project) {
        populatedTarget.project = {
          id: project.id,
          name: project.name,
        }
      }
    }

    // Populate creator
    if (target.createdBy) {
      const creator = await usersCollection.findOne({ id: target.createdBy })
      if (creator) {
        populatedTarget.creator = {
          id: creator.id,
          username: creator.username,
          email: creator.email,
        }
      }
    }

    return NextResponse.json({ success: true, data: populatedTarget })
  } catch (error) {
    console.error("Get target error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/targets/[id]
export async function PUT(request: NextRequest) {
  try {
    const targetId = getTargetIdFromRequest(request)
    if (!targetId) {
      return NextResponse.json({ success: false, error: "Invalid target ID" }, { status: 400 })
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, assignedTo, projectId, targetValue, currentValue, unit, deadline, status } = body

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Target title is required" }, { status: 400 })
    }

    if (!description?.trim()) {
      return NextResponse.json({ success: false, error: "Target description is required" }, { status: 400 })
    }

    if (!assignedTo) {
      return NextResponse.json({ success: false, error: "Assigned user is required" }, { status: 400 })
    }

    if (!targetValue || targetValue <= 0) {
      return NextResponse.json({ success: false, error: "Target value must be greater than 0" }, { status: 400 })
    }

    if (!unit?.trim()) {
      return NextResponse.json({ success: false, error: "Unit is required" }, { status: 400 })
    }

    if (!deadline) {
      return NextResponse.json({ success: false, error: "Deadline is required" }, { status: 400 })
    }

    // Validate current value if provided
    if (currentValue !== undefined) {
      const validation = validateCurrentValue(Number(currentValue), Number(targetValue))
      if (!validation.isValid) {
        return NextResponse.json({ success: false, error: validation.error }, { status: 400 })
      }
    }

    // Validate status if provided
    if (status && !["active", "completed", "failed", "cancelled"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid target status" }, { status: 400 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const targetsCollection = db.collection("targets")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    // Only Admins and Owners can update targets
    if (userRole === "Member") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get current target to check for status changes
    const currentTarget = await targetsCollection.findOne({
      id: targetId,
      workspaceId: currentWorkspaceId,
    })

    if (!currentTarget) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 })
    }

    // Build update object
    const updateData: any = {
      title: title.trim(),
      description: description.trim(),
      assignedTo,
      projectId: projectId || undefined,
      targetValue: Number(targetValue),
      currentValue: currentValue !== undefined ? Number(currentValue) : currentTarget.currentValue,
      unit: unit.trim(),
      deadline,
      updatedAt: new Date().toISOString(),
    }

    // Determine final status - prioritize auto-calculation over manual status
    let finalStatus = status || currentTarget.status
    let statusChanged = false
    let statusReason = ""

    // If current value is being updated or admin is updating, recalculate status
    if (currentValue !== undefined || !status) {
      const statusUpdate = calculateTargetStatus(
        updateData.currentValue,
        updateData.targetValue,
        deadline,
        currentTarget.status,
      )

      if (statusUpdate.shouldUpdate || !status) {
        finalStatus = statusUpdate.status
        statusChanged = finalStatus !== currentTarget.status
        statusReason = statusUpdate.reason
      }
    }

    updateData.status = finalStatus

    // Set completion date if target is being marked as completed
    if (finalStatus === "completed" && currentTarget.status !== "completed") {
      updateData.completedAt = new Date().toISOString()
    }

    const updatedTarget = await targetsCollection.findOneAndUpdate(
      {
        id: targetId,
        workspaceId: currentWorkspaceId,
      },
      {
        $set: updateData,
      },
      { returnDocument: "after" },
    )

    if (!updatedTarget?.id) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 })
    }

    const responseMessage = statusChanged
      ? `Target updated and status changed to ${finalStatus}`
      : "Target updated successfully"

    return NextResponse.json({
      success: true,
      data: updatedTarget,
      message: responseMessage,
      statusChanged,
      newStatus: finalStatus,
      reason: statusReason,
    })
  } catch (error) {
    console.error("Update target error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/targets/[id]
export async function DELETE(request: NextRequest) {
  try {
    const targetId = getTargetIdFromRequest(request)
    if (!targetId) {
      return NextResponse.json({ success: false, error: "Invalid target ID" }, { status: 400 })
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const targetsCollection = db.collection("targets")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    // Only Admins and Owners can delete targets
    if (userRole === "Member") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const target = await targetsCollection.findOne({
      id: targetId,
      workspaceId: currentWorkspaceId,
    })

    if (!target) {
      return NextResponse.json({ success: false, error: "Target not found" }, { status: 404 })
    }

    await targetsCollection.deleteOne({ id: targetId })

    return NextResponse.json({
      success: true,
      message: "Target deleted successfully",
    })
  } catch (error) {
    console.error("Delete target error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
