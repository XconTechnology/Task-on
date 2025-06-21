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
    const timeframe = searchParams.get("timeframe") || "all"
    const targetUserId = searchParams.get("userId") || user.userId

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const yearStart = new Date(now.getFullYear(), 0, 1)

    // Get ALL time entries for this user in this workspace (for base stats)
    const allTimeEntries = await timeEntriesCollection
      .find({
        userId: targetUserId,
        workspaceId: currentWorkspaceId,
        isRunning: false, // Only completed entries
      })
      .sort({ startTime: -1 })
      .toArray()

    // Calculate base stats (always from all time entries)
    const todayEntries = allTimeEntries.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= today && entryDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
    })

    const weekEntries = allTimeEntries.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= weekStart
    })

    const monthEntries = allTimeEntries.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= monthStart
    })

    const yearEntries = allTimeEntries.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= yearStart
    })

    // Calculate hours for base stats
    const todayHours = todayEntries.reduce((total, entry) => total + (entry.duration || 0) / 3600, 0)
    const weekHours = weekEntries.reduce((total, entry) => total + (entry.duration || 0) / 3600, 0)
    const monthHours = monthEntries.reduce((total, entry) => total + (entry.duration || 0) / 3600, 0)
    const yearHours = yearEntries.reduce((total, entry) => total + (entry.duration || 0) / 3600, 0)
    const allTimeHours = allTimeEntries.reduce((total, entry) => total + (entry.duration || 0) / 3600, 0)

    // Filter entries based on selected timeframe
    let filteredEntries = allTimeEntries
    let filteredHours = allTimeHours

    switch (timeframe) {
      case "today":
        filteredEntries = todayEntries
        filteredHours = todayHours
        break
      case "week":
        filteredEntries = weekEntries
        filteredHours = weekHours
        break
      case "month":
        filteredEntries = monthEntries
        filteredHours = monthHours
        break
      case "year":
        filteredEntries = yearEntries
        filteredHours = yearHours
        break
      case "all":
      default:
        filteredEntries = allTimeEntries
        filteredHours = allTimeHours
        break
    }

    // Get unique projects and tasks from filtered entries
    const uniqueProjects = new Set(filteredEntries.map((entry) => entry.projectId).filter(Boolean))
    const uniqueTasks = new Set(filteredEntries.map((entry) => entry.taskId).filter(Boolean))

    // Calculate average daily hours (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const last30DaysEntries = allTimeEntries.filter((entry) => {
      const entryDate = new Date(entry.startTime)
      return entryDate >= thirtyDaysAgo
    })

    const avgDailyHours = last30DaysEntries.reduce((total, entry) => total + (entry.duration || 0) / 3600, 0) / 30

    // Weekly data for chart (always from current week)
    const weeklyData = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart)
      dayEnd.setDate(dayStart.getDate() + 1)

      const dayEntries = allTimeEntries.filter((entry) => {
        const entryDate = new Date(entry.startTime)
        return entryDate >= dayStart && entryDate < dayEnd
      })

      const dayHours = dayEntries.reduce((total, entry) => total + (entry.duration || 0) / 3600, 0)

      weeklyData.push({
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
        hours: Math.round(dayHours * 10) / 10,
      })
    }

    // Project data from filtered entries
    const projectHours: { [key: string]: { hours: number; projectName: string } } = {}
    filteredEntries.forEach((entry) => {
      if (entry.projectId && entry.projectName) {
        if (!projectHours[entry.projectId]) {
          projectHours[entry.projectId] = {
            hours: 0,
            projectName: entry.projectName,
          }
        }
        projectHours[entry.projectId].hours += (entry.duration || 0) / 3600
      }
    })

    const projectData = Object.entries(projectHours)
      .map(([projectId, data]) => ({
        project: data.projectName,
        projectId,
        hours: Math.round(data.hours * 10) / 10,
      }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 10)

    // Calculate productivity (mock calculation)
    const productivity = Math.min(100, Math.round((weekHours / 40) * 100))

    const stats = {
      // Base stats (always all-time for the cards)
      todayHours: Math.round(todayHours * 10) / 10,
      weekHours: Math.round(weekHours * 10) / 10,
      monthHours: Math.round(monthHours * 10) / 10,
      yearHours: Math.round(yearHours * 10) / 10,
      allTimeHours: Math.round(allTimeHours * 10) / 10,
      avgDailyHours: Math.round(avgDailyHours * 10) / 10,
      productivity,

      // Filtered data for the selected timeframe
      filteredHours: Math.round(filteredHours * 10) / 10,
      filteredProjects: uniqueProjects.size,
      filteredTasks: uniqueTasks.size,
      filteredEntries: filteredEntries.length,

      // Chart and project data
      weeklyData,
      projectData,

      // Recent entries (limited for initial load)
      recentEntries: filteredEntries.slice(0, 10),

      // Metadata
      timeframe,
      totalFilteredEntries: filteredEntries.length,
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
