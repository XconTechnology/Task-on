import { type NextRequest, NextResponse } from "next/server"
import { MOCK_TASKS, MOCK_USERS } from "@/lib/constants"

// GET /api/tasks/user/[userId] - Get tasks by user ID
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  try {
    // Filter tasks by assigned user or author
    const userTasks = MOCK_TASKS.filter(
      (task) => task.assignedUserId === params.userId || task.authorUserId === params.userId,
    )

    // Populate author and assignee data
    const populatedTasks = userTasks.map((task) => ({
      ...task,
      author: MOCK_USERS.find((user) => user.id === task.authorUserId),
      assignee: MOCK_USERS.find((user) => user.id === task.assignedUserId),
    }))

    return NextResponse.json({
      success: true,
      data: populatedTasks,
      message: "User tasks retrieved successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch user tasks",
      },
      { status: 500 },
    )
  }
}
