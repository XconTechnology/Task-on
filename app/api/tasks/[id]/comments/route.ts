import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { commentService } from "@/lib/services/comment-service"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const taskId = params.taskId

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    // Get comments for the task
    const comments = await commentService.getTaskComments(taskId, currentWorkspaceId)

    return NextResponse.json({
      success: true,
      data: comments,
      message: "Comments retrieved successfully",
    })
  } catch (error) {
    console.error("Get task comments error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
