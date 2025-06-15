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
    const timeframe = searchParams.get("timeframe") || "week"

        const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")
    const projectsCollection = db.collection("projects")

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get time entries for different periods
    const [todayEntries, weekEntries, monthEntries, allEntries] = await Promise.all([
      timeEntriesCollection
        .find({
          userId: user.userId,
          workspaceId: currentWorkspaceId,
          startTime: { $gte: today.toISOString() },
        })
        .toArray(),
      timeEntriesCollection
        .find({
          userId: user.userId,
          workspaceId: currentWorkspaceId,
          startTime: { $gte: weekStart.toISOString() },
        })
        .toArray(),
      timeEntriesCollection
        .find({
          userId: user.userId,
          workspaceId: currentWorkspaceId,
          startTime: { $gte: monthStart.toISOString() },
        })
        .toArray(),
      timeEntriesCollection
        .find({
          userId: user.userId,
          workspaceId: currentWorkspaceId,
        })
        .sort({ startTime: -1 })
        .limit(20)
        .toArray(),
    ])

    // Calculate hours
    const todayHours = todayEntries.reduce((total, entry) => total + entry.duration / 3600, 0)
    const weekHours = weekEntries.reduce((total, entry) => total + entry.duration / 3600, 0)
    const monthHours = monthEntries.reduce((total, entry) => total + entry.duration / 3600, 0)

    // Calculate average daily hours (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const last30DaysEntries = await timeEntriesCollection
      .find({
        userId: user.userId,
        workspaceId: currentWorkspaceId,
        startTime: { $gte: thirtyDaysAgo.toISOString() },
      })
      .toArray()

    const avgDailyHours = last30DaysEntries.reduce((total, entry) => total + entry.duration / 3600, 0) / 30

    // Weekly data for chart
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayStart.getDate() + 1)

      const dayEntries = weekEntries.filter((entry) => {
        const entryDate = new Date(entry.startTime)
        return entryDate >= dayStart && entryDate < dayEnd
      })

      const dayHours = dayEntries.reduce((total, entry) => total + entry.duration / 3600, 0)

      weeklyData.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        hours: Math.round(dayHours * 10) / 10,
      })
    }

    // Project data
    const projectHours: { [key: string]: { hours: number; projectName: string } } = {}
    monthEntries.forEach((entry) => {
      if (!projectHours[entry.projectId]) {
        projectHours[entry.projectId] = {
          hours: 0,
          projectName: entry.projectName,
        }
      }
      projectHours[entry.projectId].hours += entry.duration / 3600
    })

    const projectData = Object.entries(projectHours)
      .map(([projectId, data]) => ({
        project: data.projectName,
        projectId,
        hours: Math.round(data.hours * 10) / 10,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)

    // Calculate productivity (mock calculation - you can implement your own logic)
    const productivity = Math.min(100, Math.round((weekHours / 40) * 100))

    const stats = {
      todayHours: Math.round(todayHours * 10) / 10,
      weekHours: Math.round(weekHours * 10) / 10,
      monthHours: Math.round(monthHours * 10) / 10,
      avgDailyHours: Math.round(avgDailyHours * 10) / 10,
      productivity,
      weeklyData,
      projectData,
      recentEntries: allEntries,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Get time tracking stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
