import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

// PATCH /api/tasks/[id]/status - Update task status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    const validStatuses = ["todo", "in-progress", "done"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Valid status is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    // Get user's workspace and role
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const userRole = getUserRole(userData.role)
    if (!canUserPerformAction(userRole, "task", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Update task status
    const updatedTask = await tasksCollection.findOneAndUpdate(
      {
        id: params.id,
        workspaceId: userData.workspaceId,
      },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" },
    )

    if (!updatedTask?.value) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Populate author and assignee data
    const author = updatedTask.value.createdBy
      ? await usersCollection.findOne({ id: updatedTask.value.createdBy })
      : null
    const assignee = updatedTask.value.assignedTo
      ? await usersCollection.findOne({ id: updatedTask.value.assignedTo })
      : null

    const populatedTask = {
      ...updatedTask.value,
      author: author ? { id: author.id, username: author.username, email: author.email } : null,
      assignee: assignee ? { id: assignee.id, username: assignee.username, email: assignee.email } : null,
    }

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: "Task status updated successfully",
    })
  } catch (error) {
    console.error("Update task status error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
