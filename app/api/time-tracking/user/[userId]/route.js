import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { userId } = params
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")
    const workspacesCollection = db.collection("workspaces")

    // Verify the target user is in the current workspace
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 })
    }

    const isUserInWorkspace = workspace.members?.some((member) => member.memberId === userId)
    if (!isUserInWorkspace) {
      return NextResponse.json({ success: false, error: "User not found in workspace" }, { status: 404 })
    }

    // Build query for time entries
    const query = {
      userId: userId,
      workspaceId: currentWorkspaceId,
      isRunning: false, // Only completed time entries
    }

    // Get time entries with pagination
    const timeEntries = await timeEntriesCollection
      .find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalCount = await timeEntriesCollection.countDocuments(query)
    const totalPages = Math.ceil(totalCount / limit)
    const hasMore = page < totalPages

    return NextResponse.json({
      success: true,
      data: timeEntries,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
        hasMore,
      },
    })
  } catch (error) {
    console.error("Get user time entries error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
