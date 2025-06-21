import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function POST(request: Request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetDate = searchParams.get("date") || new Date().toISOString().split("T")[0]

    // Get workspace ID from header
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")
    const attendanceCollection = db.collection("attendance")
    const workspacesCollection = db.collection("workspaces")

    // Get workspace and its members
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 })
    }

    // Calculate date range for the target date
    const startOfDay = new Date(targetDate + "T00:00:00.000Z")
    const endOfDay = new Date(targetDate + "T23:59:59.999Z")

    const attendanceRecords = []

    // Process each workspace member
    for (const member of workspace.members) {
      const { memberId } = member

      // Get all completed time entries for this user on this date in this workspace
      const timeEntries = await timeEntriesCollection
        .find({
          userId: memberId,
          workspaceId: currentWorkspaceId,
          isRunning: false,
          startTime: {
            $gte: startOfDay.toISOString(),
            $lte: endOfDay.toISOString(),
          },
        })
        .toArray()

      // Calculate total time worked in seconds
      const totalTimeWorked = timeEntries.reduce((total, entry) => {
        if (entry.endTime && entry.startTime) {
          const duration = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime()
          return total + Math.floor(duration / 1000)
        }
        return total
      }, 0)

      // Determine if present (more than 1 hour = 3600 seconds)
      const isPresent = totalTimeWorked >= 3600

      // Check if attendance record already exists
      const existingRecord = await attendanceCollection.findOne({
        userId: memberId,
        workspaceId: currentWorkspaceId,
        date: targetDate,
      })

      const attendanceRecord = {
        id: existingRecord?.id || `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: memberId,
        workspaceId: currentWorkspaceId,
        date: targetDate,
        isPresent,
        totalTimeWorked,
        timeEntries: timeEntries.map((entry) => entry.id),
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (existingRecord) {
        // Update existing record
        await attendanceCollection.updateOne({ _id: existingRecord._id }, { $set: attendanceRecord })
      } else {
        // Insert new record
        await attendanceCollection.insertOne(attendanceRecord)
      }

      attendanceRecords.push(attendanceRecord)
    }

    // Calculate summary stats
    const presentCount = attendanceRecords.filter((record) => record.isPresent).length
    const absentCount = attendanceRecords.length - presentCount

    return NextResponse.json({
      success: true,
      data: {
        date: targetDate,
        workspaceId: currentWorkspaceId,
        totalUsers: attendanceRecords.length,
        presentCount,
        absentCount,
        attendanceRate: attendanceRecords.length > 0 ? (presentCount / attendanceRecords.length) * 100 : 0,
        records: attendanceRecords,
      },
    })
  } catch (error) {
    console.error("Calculate attendance error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
