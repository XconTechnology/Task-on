import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"

function getIdFromRequest(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/")
  return segments[segments.length - 1]
}

// GET /api/tasks/[id]
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const id = getIdFromRequest(request)

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    const task = await tasksCollection.findOne({
      id,
      workspaceId: currentWorkspaceId,
    })

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    const author = task.createdBy ? await usersCollection.findOne({ id: task.createdBy }) : null

    const assignee = task.assignedTo ? await usersCollection.findOne({ id: task.assignedTo }) : null

    const populatedTask = {
      ...task,
      author: author ? { id: author.id, username: author.username, email: author.email } : null,
      assignee: assignee
        ? {
            id: assignee.id,
            username: assignee.username,
            email: assignee.email,
            profilePictureUrl: assignee.profilePictureUrl,
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: "Task retrieved successfully",
    })
  } catch (error) {
    console.error("Get task error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const id = getIdFromRequest(request)
    const body = await request.json()

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)

    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    if (!canUserPerformAction(userRole, "task", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Build dynamic update object - only include fields that are actually provided
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    // Only update fields that are explicitly provided in the request
    if (body.hasOwnProperty("title") && body.title !== undefined) {
      if (!body.title?.trim()) {
        return NextResponse.json({ success: false, error: "Title cannot be empty" }, { status: 400 })
      }
      updateData.title = body.title.trim()
    }

    if (body.hasOwnProperty("description")) {
      updateData.description = body.description?.trim() || ""
    }

    if (body.hasOwnProperty("status") && body.status !== undefined) {
      updateData.status = body.status
    }

    if (body.hasOwnProperty("priority")) {
      updateData.priority = body.priority
    }

    if (body.hasOwnProperty("assignedTo")) {
      updateData.assignedTo = body.assignedTo || undefined
    }

    if (body.hasOwnProperty("dueDate")) {
      updateData.dueDate = body.dueDate || undefined
    }

    if (body.hasOwnProperty("startDate")) {
      updateData.startDate = body.startDate || undefined
    }

    // NEW: Handle category field
    if (body.hasOwnProperty("category")) {
      updateData.category = body.category || undefined
    }

    // Handle completion timestamp for status changes
    if (body.hasOwnProperty("status")) {
      if (body.status === "Completed") {
        updateData.completedAt = new Date().toISOString()
      } else {
        // Remove completedAt if status is changed from Completed to something else
        updateData.completedAt = null
      }
    }

    console.log("Updating task:", id, "with data:", updateData)

    const updatedTask = await tasksCollection.findOneAndUpdate(
      { id: id, workspaceId: currentWorkspaceId },
      {
        $set: updateData,
        ...(updateData.completedAt === null ? { $unset: { completedAt: "" } } : {}),
      },
      { returnDocument: "after" },
    )

    if (!updatedTask?.id) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Populate author and assignee information
    const author = updatedTask.createdBy ? await usersCollection.findOne({ id: updatedTask.createdBy }) : null

    const assignee = updatedTask.assignedTo ? await usersCollection.findOne({ id: updatedTask.assignedTo }) : null

    const populatedTask = {
      ...updatedTask,
      author: author ? { id: author.id, username: author.username, email: author.email } : null,
      assignee: assignee
        ? {
            id: assignee.id,
            username: assignee.username,
            email: assignee.email,
            profilePictureUrl: assignee.profilePictureUrl,
          }
        : null,
    }

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: "Task updated successfully",
    })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id]
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const id = getIdFromRequest(request)

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)

    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    if (!canUserPerformAction(userRole, "task", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const task = await tasksCollection.findOne({
      id,
      workspaceId: currentWorkspaceId,
    })

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    await tasksCollection.deleteOne({ id })

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
