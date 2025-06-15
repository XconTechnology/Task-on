import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: { timerId: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { timerId } = params

    const db = await getDatabase()
    const activeTimersCollection = db.collection("activeTimers")
    const timeEntriesCollection = db.collection("timeEntries")

    // Find the active timer
    const activeTimer = await activeTimersCollection.findOne({ id: timerId, userId: user.userId })

    if (!activeTimer) {
      return NextResponse.json({ success: false, error: "Active timer not found" }, { status: 404 })
    }

    // Calculate duration
    const endTime = new Date().toISOString()
    const startTime = new Date(activeTimer.startTime)
    const duration = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)

    // Create time entry
    const timeEntry = {
      id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId: activeTimer.taskId,
      taskTitle: activeTimer.taskTitle,
      projectId: activeTimer.projectId,
      projectName: activeTimer.projectName,
      workspaceId: activeTimer.workspaceId,
      userId: user.userId,
      startTime: activeTimer.startTime,
      endTime,
      duration,
      isRunning: false,
      description: activeTimer.description || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Insert time entry and remove active timer
    await timeEntriesCollection.insertOne(timeEntry)
    await activeTimersCollection.deleteOne({ id: timerId, userId: user.userId })

    return NextResponse.json({
      success: true,
      data: timeEntry,
      message: "Timer stopped successfully",
    })
  } catch (error) {
    console.error("Stop timer error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
