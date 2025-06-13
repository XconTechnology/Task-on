import {  NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

function getIdFromRequest(request) {
  const segments = request.nextUrl.pathname.split("/")
  return segments[segments.length - 2] // because the last one is "status"
}

// PATCH /api/tasks/[id]/status
export async function PATCH(request) {
  try {
    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const id = getIdFromRequest(request)
    const body = await request.json()
    const { status } = body

    const validStatuses = ["todo", "in-progress", "done"]
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Valid status is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const userRole = getUserRole(userData.role)
    if (!canUserPerformAction(userRole, "task", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const updatedTask = await tasksCollection.findOneAndUpdate(
      { id, workspaceId: userData.workspaceId },
      {
        $set: {
          status,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    )

    if (!updatedTask?.value) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

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

    return NextResponse.json({ success: true, data: populatedTask, message: "Task status updated successfully" })
  } catch (error) {
    console.error("Update task status error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
