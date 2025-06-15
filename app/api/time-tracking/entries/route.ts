import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")
    const projectId = searchParams.get("projectId")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")

    // Build query
    const query: any = {
      userId: user.userId,
      workspaceId: currentWorkspaceId,
    }

    if (taskId) query.taskId = taskId
    if (projectId) query.projectId = projectId
    if (startDate || endDate) {
      query.startTime = {}
      if (startDate) query.startTime.$gte = startDate
      if (endDate) query.startTime.$lte = endDate
    }

    // Get time entries
    const timeEntries = await timeEntriesCollection.find(query).sort({ startTime: -1 }).limit(limit).toArray()

    return NextResponse.json({
      success: true,
      data: timeEntries,
    })
  } catch (error) {
    console.error("Get time entries error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
