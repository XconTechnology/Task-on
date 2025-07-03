import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { calculateTargetStatus } from "@/lib/target-utils"

// Utility function to extract userId from URL
// Utility function to extract userId from URL
function getUserIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const index = pathParts.indexOf("user")
  return index !== -1 && pathParts.length > index + 1 ? pathParts[index + 1] : null
}

// GET /api/targets/user/[userId] - Get targets assigned to a specific user
export async function GET(request: NextRequest) {
  try {
    const targetUserId = getUserIdFromRequest(request)
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Users can only view their own targets (unless they're admin/owner, but that's handled in main targets page)
    if (user.userId !== targetUserId) {
      return NextResponse.json({ success: false, error: "Access denied" }, { status: 403 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const targetsCollection = db.collection("targets")
    const usersCollection = db.collection("users")
    const projectsCollection = db.collection("projects")

    // Get query parameters for filtering
    const url = new URL(request.url)
    const timeframe = url.searchParams.get("timeframe") || "all"
    const status = url.searchParams.get("status") || "all"

    // Build query for targets assigned to this user
    const query: any = {
      workspaceId: currentWorkspaceId,
      assignedTo: targetUserId,
    }

    // Filter by status if specified
    if (status !== "all") {
      query.status = status
    }

    // Filter by timeframe if specified
    if (timeframe !== "all") {
      const now = new Date()
      let startDate: Date

      switch (timeframe) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          startDate = new Date(now)
          startDate.setDate(now.getDate() - now.getDay())
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case "year":
          startDate = new Date(now.getFullYear(), 0, 1)
          break
        default:
          startDate = new Date(0) // Beginning of time
      }

      query.createdAt = { $gte: startDate.toISOString() }
    }

    const targets = await targetsCollection.find(query).sort({ createdAt: -1 }).toArray()

    // CRITICAL: Check and update target statuses automatically
    const updatedTargets : any = []

    for (const target of targets) {
      const statusCheck = calculateTargetStatus(target.currentValue, target.targetValue, target.deadline, target.status)

      if (statusCheck.shouldUpdate) {
        // Update the target status in database
        const updateData = {
          status: statusCheck.status,
          updatedAt: new Date().toISOString(),
          ...(statusCheck.status === "completed" && target.status !== "completed"
            ? { completedAt: new Date().toISOString() }
            : {}),
        }

        await targetsCollection.updateOne({ id: target.id }, { $set: updateData })

        // Update the target object for response
        const updatedTarget = { ...target, ...updateData }
        updatedTargets.push(updatedTarget)

        console.log(
          `User target ${target.id} status updated from ${target.status} to ${statusCheck.status}: ${statusCheck.reason}`,
        )
      } else {
        updatedTargets.push(target)
      }
    }

    // Populate target data
    const populatedTargets = await Promise.all(
      updatedTargets.map(async (target: any) => {
        const populatedTarget = { ...target }

        // Populate assignee (should be the same user, but let's be consistent)
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

        return populatedTarget
      }),
    )

    // Calculate stats based on updated targets
    const totalTargets = populatedTargets.length
    const activeTargets = populatedTargets.filter((t) => t.status === "active").length
    const completedTargets = populatedTargets.filter((t) => t.status === "completed").length
    const failedTargets = populatedTargets.filter((t) => t.status === "failed").length
    const completionRate = totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 100) : 0

    return NextResponse.json({
      success: true,
      data: {
        targets: populatedTargets,
        stats: {
          totalTargets,
          activeTargets,
          completedTargets,
          failedTargets,
          completionRate,
        },
      },
    })
  } catch (error) {
    console.error("Get user targets error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/targets/user/[userId]/[targetId] - Update target progress (users can only update their own targets)
export async function PUT(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    const userIndex = pathParts.indexOf("user")
    const targetUserId = userIndex !== -1 && pathParts.length > userIndex + 1 ? pathParts[userIndex + 1] : null
    const targetId = userIndex !== -1 && pathParts.length > userIndex + 2 ? pathParts[userIndex + 2] : null

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

    if (currentValue === undefined || currentValue < 0) {
      return NextResponse.json({ success: false, error: "Invalid current value" }, { status: 400 })
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

    // Build update object
    const updateData: any = {
      currentValue: Number(currentValue),
      updatedAt: new Date().toISOString(),
    }

    // Auto-update status based on current value and deadline
    const now = new Date()
    const deadlineDate = new Date(currentTarget.deadline)

    if (Number(currentValue) >= Number(currentTarget.targetValue)) {
      updateData.status = "completed"
      if (!currentTarget.completedAt) {
        updateData.completedAt = new Date().toISOString()
      }
    } else if (now > deadlineDate && currentTarget.status === "active") {
      updateData.status = "failed"
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

    return NextResponse.json({
      success: true,
      data: updatedTarget,
      message: "Target progress updated successfully",
    })
  } catch (error) {
    console.error("Update user target error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
