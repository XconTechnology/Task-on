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
    const timeframe = searchParams.get("timeframe") || "all"
    const skip = (page - 1) * limit

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")

    // Calculate date range based on timeframe
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let startDate = null
    let endDate = null

    switch (timeframe) {
      case "today":
        startDate = today
        endDate = new Date(today)
        endDate.setDate(endDate.getDate() + 1)
        break
      case "week":
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - today.getDay())
        startDate = weekStart
        endDate = new Date()
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date()
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date()
        break
      default:
        // "all" - no date filtering
        break
    }

    // Build query
    const query = {
      userId: userId,
      workspaceId: currentWorkspaceId,
      isRunning: false, // Only completed time entries
    }

    if (startDate && endDate) {
      query.startTime = {
        $gte: startDate.toISOString(),
        $lt: endDate.toISOString(),
      }
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
      timeframe,
    })
  } catch (error) {
    console.error("Get filtered user time entries error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
