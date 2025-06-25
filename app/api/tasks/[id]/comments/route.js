import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

// Utility function to extract taskId from URL
function getTaskIdFromRequest(request) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const tasksIndex = pathParts.indexOf("tasks")
  return tasksIndex !== -1 && pathParts.length > tasksIndex + 1 ? pathParts[tasksIndex + 1] : null
}

// GET /api/tasks/[id]/comments - Get comments for a task
export async function GET(request) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const taskId = getTaskIdFromRequest(request)
    if (!taskId) {
      return NextResponse.json({ success: false, error: "Invalid task ID" }, { status: 400 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const commentsCollection = db.collection("comments")
    const tasksCollection = db.collection("tasks")

    // Verify task exists and user has access
    const task = await tasksCollection.findOne({
      id: taskId,
      workspaceId: currentWorkspaceId,
    })

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    // Get comments for the task
    const comments = await commentsCollection
      .find({
        taskId: taskId,
        workspaceId: currentWorkspaceId,
      })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: comments,
      count: comments.length,
      message: "Comments retrieved successfully",
    })
  } catch (error) {
    console.error("Get task comments error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// GET /api/tasks/[id]/comments/count - Get just the comment count for a task
export async function HEAD(request) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const taskId = getTaskIdFromRequest(request)
    if (!taskId) {
      return NextResponse.json({ success: false, error: "Invalid task ID" }, { status: 400 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const commentsCollection = db.collection("comments")

    // Get comment count for the task
    const commentCount = await commentsCollection.countDocuments({
      taskId: taskId,
      workspaceId: currentWorkspaceId,
    })

    return NextResponse.json({
      success: true,
      count: commentCount,
    })
  } catch (error) {
    console.error("Get task comment count error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
