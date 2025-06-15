import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request: NextRequest, { params }: { params: { taskId: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { taskId } = params

        const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")
    const activeTimersCollection = db.collection("activeTimers")

    // Get all time entries for this task
    const timeEntries = await timeEntriesCollection
      .find({
        taskId,
        workspaceId: currentWorkspaceId,
      })
      .toArray()

    // Check if there's an active timer for this task
    const activeTimer = await activeTimersCollection.findOne({
      taskId,
      workspaceId: currentWorkspaceId,
    })

    // Calculate total time
    const totalTime = timeEntries.reduce((total, entry) => total + entry.duration, 0)

    return NextResponse.json({
      success: true,
      data: {
        totalTime,
        isRunning: !!activeTimer,
      },
    })
  } catch (error) {
    console.error("Get task total time error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
