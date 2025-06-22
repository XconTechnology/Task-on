import { NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function POST(request: NextRequest){
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || new Date().toISOString().slice(0, 7) // YYYY-MM

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const attendanceCollection = db.collection("attendance")

    // Get all attendance records for the month
    const startDate = `${month}-01`
    const year = Number.parseInt(month.split("-")[0])
    const monthNum = Number.parseInt(month.split("-")[1])
    const lastDay = new Date(year, monthNum, 0).getDate()
    const endDate = `${month}-${lastDay.toString().padStart(2, "0")}`

    const attendanceRecords = await attendanceCollection
      .find({
        workspaceId: currentWorkspaceId,
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      })
      .toArray()

    // Group by date
    const dailyAttendance = new Map()

    for (let day = 1; day <= lastDay; day++) {
      const dateStr = `${month}-${day.toString().padStart(2, "0")}`
      const dayRecords = attendanceRecords.filter((record) => record.date === dateStr)

      const presentCount = dayRecords.filter((record) => record.isPresent).length
      const absentCount = dayRecords.length - presentCount

      dailyAttendance.set(dateStr, {
        date: dateStr,
        dayName: new Date(dateStr).toLocaleDateString("en-US", { weekday: "short" }),
        presentCount,
        absentCount,
        totalUsers: dayRecords.length,
        attendanceRate: dayRecords.length > 0 ? (presentCount / dayRecords.length) * 100 : 0,
      })
    }

    // Calculate monthly stats
    const totalRecords = attendanceRecords.length
    const totalPresent = attendanceRecords.filter((record) => record.isPresent).length
    const totalAbsent = totalRecords - totalPresent
    const avgHours =
      totalRecords > 0
        ? attendanceRecords.reduce((sum, record) => sum + record.totalTimeWorked, 0) / totalRecords / 3600
        : 0

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ]

    return NextResponse.json({
      success: true,
      data: {
        month,
        year,
        monthName: monthNames[monthNum - 1],
        days: Array.from(dailyAttendance.values()),
        stats: {
          totalDays: lastDay,
          presentDays: totalPresent,
          absentDays: totalAbsent,
          attendanceRate: totalRecords > 0 ? (totalPresent / totalRecords) * 100 : 0,
          averageHoursPerDay: avgHours,
        },
      },
    })
  } catch (error) {
    console.error("Get monthly attendance error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
