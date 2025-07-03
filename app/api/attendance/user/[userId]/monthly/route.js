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
    const url = new URL(request.url)
    const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7)

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")
    const usersCollection = db.collection("users")
    const workspacesCollection = db.collection("workspaces")

    // Get user info
    const targetUser = await usersCollection.findOne({ id: userId })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Verify user is in the workspace
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })
    const isMember = workspace?.members?.some((member) => member.memberId === userId)
    if (!isMember) {
      return NextResponse.json({ success: false, error: "User not in workspace" }, { status: 403 })
    }

    // Parse month and get date range
    const [year, monthNum] = month.split("-").map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0) // Last day of month

    // Get all time entries for the user in this month
    const timeEntries = await timeEntriesCollection
      .find({
        userId: userId,
        workspaceId: currentWorkspaceId,
        startTime: {
          $gte: startDate.toISOString(),
          $lte: endDate.toISOString(),
        },
      })
      .toArray()

    // Group time entries by date
    const entriesByDate= {}
    timeEntries.forEach((entry) => {
      const date = entry.startTime.split("T")[0]
      if (!entriesByDate[date]) {
        entriesByDate[date] = []
      }
      entriesByDate[date].push(entry)
    })

    // Generate calendar days for the month
    const days = []
    const totalDaysInMonth = endDate.getDate()

    for (let day = 1; day <= totalDaysInMonth; day++) {
      const date = new Date(year, monthNum - 1, day)
      const dateStr = date.toISOString().split("T")[0]
      const dayEntries = entriesByDate[dateStr] || []

      // Calculate total time worked for this day
      const totalTimeWorked = dayEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)

      // Consider present if worked more than 1 hour (3600 seconds)
      const isPresent = totalTimeWorked >= 3600

      days.push({
        date: dateStr,
        isPresent,
        totalTimeWorked,
        timeEntries: dayEntries.length,
        attendanceRate: isPresent ? 100 : 0,
      })
    }

    // Calculate stats
    const presentDays = days.filter((day) => day.isPresent).length
    const absentDays = totalDaysInMonth - presentDays
    const attendanceRate = totalDaysInMonth > 0 ? (presentDays / totalDaysInMonth) * 100 : 0
    const totalTimeWorked = days.reduce((sum, day) => sum + day.totalTimeWorked, 0)
    const averageHoursPerDay = totalDaysInMonth > 0 ? totalTimeWorked / 3600 / totalDaysInMonth : 0
    const totalEntries = days.reduce((sum, day) => sum + day.timeEntries, 0)

    const monthlyAttendance = {
      userId,
      username: targetUser.username,
      email: targetUser.email,
      month,
      year,
      monthName: startDate.toLocaleDateString("en-US", { month: "long" }),
      days,
      stats: {
        totalDays: totalDaysInMonth,
        presentDays,
        absentDays,
        attendanceRate,
        totalTimeWorked,
        averageHoursPerDay,
        totalEntries,
      },
    }

    return NextResponse.json({
      success: true,
      data: monthlyAttendance,
    })
  } catch (error) {
    console.error("Get user monthly attendance error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
