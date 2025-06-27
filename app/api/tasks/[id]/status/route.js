import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId} from "@/lib/workspace-utils"
import { Status } from "@/lib/types"

// Utility function to extract taskId from URL
function getTaskIdFromRequest(request) {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const tasksIndex = pathParts.indexOf("tasks")
  return tasksIndex !== -1 && pathParts.length > tasksIndex + 1 ? pathParts[tasksIndex + 1] : null
}

// Validate status value
function isValidStatus(status){
  const validStatuses = Object.values(Status)
  return validStatuses.includes(status)
}

// PATCH /api/tasks/[id]/status - Fast status update only
export async function PATCH(request) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const taskId = getTaskIdFromRequest(request)
    if (!taskId) {
      return NextResponse.json({ success: false, error: "Invalid task ID" }, { status: 400 })
    }

    const body = await request.json()
    const { status } = body

    // Quick validation
    if (!status || !isValidStatus(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    // Get workspace ID
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")

    // Fast update - just status and timestamp
    const updateData = {
      status: status,
      updatedAt: new Date().toISOString(),
      ...(status === Status.Completed ? { completedAt: new Date().toISOString() } : {}),
    }

    const result = await tasksCollection.updateOne(
      {
        id: taskId,
        workspaceId: currentWorkspaceId,
      },
      {
        $set: updateData,
        ...(status !== Status.Completed ? { $unset: { completedAt: "" } } : {}),
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: { id: taskId, status, updatedAt: updateData.updatedAt },
    })
  } catch (error) {
    console.error("Update task status error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}