import { type NextRequest, NextResponse } from "next/server"
import { MOCK_TASKS, MOCK_USERS } from "@/lib/constants"
import { Status } from "@/lib/types"

// PATCH /api/tasks/[id]/status - Update task status
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { status } = body

    if (!status || !Object.values(Status).includes(status)) {
      return NextResponse.json(
        {
          success: false,
          error: "Valid status is required",
        },
        { status: 400 },
      )
    }

    const taskIndex = MOCK_TASKS.findIndex((t) => t.id === params.id)

    if (taskIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 },
      )
    }

    // Update task status
    MOCK_TASKS[taskIndex] = {
      ...MOCK_TASKS[taskIndex],
      status,
      updatedAt: new Date().toISOString(),
    }

    // Populate author and assignee data
    const populatedTask = {
      ...MOCK_TASKS[taskIndex],
      author: MOCK_USERS.find((user) => user.id === MOCK_TASKS[taskIndex].authorUserId),
      assignee: MOCK_USERS.find((user) => user.id === MOCK_TASKS[taskIndex].assignedUserId),
    }

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: "Task status updated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update task status",
      },
      { status: 500 },
    )
  }
}
