import { type NextRequest, NextResponse } from "next/server"
import { MOCK_TASKS, MOCK_USERS } from "@/lib/constants"

// GET /api/tasks/[id] - Get task by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const task = MOCK_TASKS.find((t) => t.id === params.id)

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          error: "Task not found",
        },
        { status: 404 },
      )
    }

    // Populate author and assignee data
    const populatedTask = {
      ...task,
      author: MOCK_USERS.find((user) => user.id === task.authorUserId),
      assignee: MOCK_USERS.find((user) => user.id === task.assignedUserId),
    }

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: "Task retrieved successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch task",
      },
      { status: 500 },
    )
  }
}

// PUT /api/tasks/[id] - Update task
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
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

    // Update task
    MOCK_TASKS[taskIndex] = {
      ...MOCK_TASKS[taskIndex],
      ...body,
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
      message: "Task updated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update task",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/tasks/[id] - Delete task
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    // Remove task
    MOCK_TASKS.splice(taskIndex, 1)

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete task",
      },
      { status: 500 },
    )
  }
}
