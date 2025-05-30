import { type NextRequest, NextResponse } from "next/server"
import { MOCK_TASKS, MOCK_USERS } from "@/lib/constants"
import { type Task, Status, Priority } from "@/lib/types"

// GET /api/tasks - Get tasks with optional projectId filter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get("projectId")

    let tasks = [...MOCK_TASKS]

    // Filter by project if projectId provided
    if (projectId) {
      tasks = tasks.filter((task) => task.projectId === projectId)
    }

    // Populate author and assignee data
    const populatedTasks = tasks.map((task) => ({
      ...task,
      author: MOCK_USERS.find((user) => user.id === task.authorUserId),
      assignee: MOCK_USERS.find((user) => user.id === task.assignedUserId),
    }))

    return NextResponse.json({
      success: true,
      data: populatedTasks,
      message: "Tasks retrieved successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tasks",
      },
      { status: 500 },
    )
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.projectId || !body.authorUserId) {
      return NextResponse.json(
        {
          success: false,
          error: "Title, projectId, and authorUserId are required",
        },
        { status: 400 },
      )
    }

    // Create new task with generated ID
    const newTask: Task = {
      id: `task_${Date.now()}`,
      title: body.title,
      description: body.description || "",
      status: body.status || Status.ToDo,
      priority: body.priority || Priority.Medium,
      tags: body.tags || "",
      startDate: body.startDate,
      dueDate: body.dueDate,
      points: body.points || 0,
      projectId: body.projectId,
      authorUserId: body.authorUserId,
      assignedUserId: body.assignedUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // In real app, save to MongoDB here
    MOCK_TASKS.push(newTask)

    // Populate author and assignee data
    const populatedTask = {
      ...newTask,
      author: MOCK_USERS.find((user) => user.id === newTask.authorUserId),
      assignee: MOCK_USERS.find((user) => user.id === newTask.assignedUserId),
    }

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: "Task created successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create task",
      },
      { status: 500 },
    )
  }
}
