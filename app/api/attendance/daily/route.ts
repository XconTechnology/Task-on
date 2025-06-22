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
    const date = searchParams.get("date") || new Date().toISOString().split("T")[0]

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const attendanceCollection = db.collection("attendance")
    const usersCollection = db.collection("users")

    // Get attendance records for the date and workspace
    const attendanceRecords = await attendanceCollection
      .find({
        workspaceId: currentWorkspaceId,
        date: date,
      })
      .toArray()

    // Get user details for each attendance record
    const userIds = attendanceRecords.map((record) => record.userId)
    const users = await usersCollection
      .find({
        id: { $in: userIds },
      })
      .toArray()

    // Create user lookup map
    const userMap = new Map(users.map((user) => [user.id, user]))

    // Format the response
    const attendanceData = attendanceRecords.map((record) => ({
      userId: record.userId,
      username: userMap.get(record.userId)?.username || "Unknown",
      email: userMap.get(record.userId)?.email || "",
      profilePictureUrl: userMap.get(record.userId)?.profilePictureUrl,
      isPresent: record.isPresent,
      totalTimeWorked: record.totalTimeWorked,
      timeEntries: record.timeEntries.length,
    }))

    const presentCount = attendanceData.filter((user) => user.isPresent).length
    const absentCount = attendanceData.length - presentCount

    return NextResponse.json({
      success: true,
      data: {
        date,
        users: attendanceData,
        presentCount,
        absentCount,
        totalUsers: attendanceData.length,
        attendanceRate: attendanceData.length > 0 ? (presentCount / attendanceData.length) * 100 : 0,
      },
    })
  } catch (error) {
    console.error("Get daily attendance error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
