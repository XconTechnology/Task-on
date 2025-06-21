import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { userId } = params
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const attendanceCollection = db.collection("attendance")
    const usersCollection = db.collection("users")

    // Build query
    const query: any = {
      userId,
      workspaceId: currentWorkspaceId,
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate }
    }

    // Get attendance records
    const attendanceRecords = await attendanceCollection.find(query).sort({ date: -1 }).toArray()

    // Get user details
    const userDetails = await usersCollection.findOne({ id: userId })

    // Calculate stats
    const totalDays = attendanceRecords.length
    const presentDays = attendanceRecords.filter((record) => record.isPresent).length
    const absentDays = totalDays - presentDays
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0
    const averageHoursPerDay =
      totalDays > 0 ? attendanceRecords.reduce((sum, record) => sum + record.totalTimeWorked, 0) / totalDays / 3600 : 0

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: userDetails?.id,
          username: userDetails?.username,
          email: userDetails?.email,
          profilePictureUrl: userDetails?.profilePictureUrl,
        },
        records: attendanceRecords,
        stats: {
          totalDays,
          presentDays,
          absentDays,
          attendanceRate,
          averageHoursPerDay,
        },
      },
    })
  } catch (error) {
    console.error("Get user attendance error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
