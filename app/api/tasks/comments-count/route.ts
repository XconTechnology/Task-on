import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

// POST /api/tasks/comments-count - Get comment counts for multiple tasks
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { taskIds } = body

    if (!taskIds || !Array.isArray(taskIds)) {
      return NextResponse.json({ success: false, error: "Task IDs array is required" }, { status: 400 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const commentsCollection = db.collection("comments")

    // Get comment counts for all tasks in one aggregation query
    const commentCounts = await commentsCollection
      .aggregate([
        {
          $match: {
            taskId: { $in: taskIds },
            workspaceId: currentWorkspaceId,
          },
        },
        {
          $group: {
            _id: "$taskId",
            count: { $sum: 1 },
          },
        },
      ])
      .toArray()

    // Convert to object for easy lookup
    const commentCountMap = {}
    commentCounts.forEach((item) => {
      commentCountMap[item._id] = item.count
    })

    // Ensure all requested task IDs have a count (default to 0)
    taskIds.forEach((taskId) => {
      if (!(taskId in commentCountMap)) {
        commentCountMap[taskId] = 0
      }
    })

    return NextResponse.json({
      success: true,
      data: commentCountMap,
      message: "Comment counts retrieved successfully",
    })
  } catch (error) {
    console.error("Get comment counts error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
