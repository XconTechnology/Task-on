import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

// GET /api/tasks/[id] - Get task by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    // Get user's workspace
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get task
    const task = await tasksCollection.findOne({
      id: params.id,
      workspaceId: userData.workspaceId,
    })

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Populate author and assignee data
    const author = task.createdBy ? await usersCollection.findOne({ id: task.createdBy }) : null
    const assignee = task.assignedTo ? await usersCollection.findOne({ id: task.assignedTo }) : null

    const populatedTask = {
      ...task,
      author: author ? { id: author.id, username: author.username, email: author.email } : null,
      assignee: assignee ? { id: assignee.id, username: assignee.username, email: assignee.email } : null,
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

// PUT /api/tasks/[id] - Update task
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, priority, assignedTo, dueDate } = body

    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 })
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

    // Update task
    const updatedTask = await tasksCollection.findOneAndUpdate(
      {
        id: params.id,
        workspaceId: userData.workspaceId,
      },
      {
        $set: {
          title: title.trim(),
          description: description?.trim() || "",
          status: status || "todo",
          priority: priority || "medium",
          assignedTo: assignedTo || undefined,
          dueDate: dueDate || undefined,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" },
    )

    if (!updatedTask.value) {
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
      message: "Task updated successfully",
    })
  } catch (error) {
    console.error("Update task error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
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
    if (!canUserPerformAction(userRole, "task", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Check if task exists
    const task = await tasksCollection.findOne({
      id: params.id,
      workspaceId: userData.workspaceId,
    })

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Delete task
    await tasksCollection.deleteOne({ id: params.id })

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    console.error("Delete task error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
