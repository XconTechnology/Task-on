import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

// GET /api/tasks - Get tasks with optional projectId filter
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    const projectId = searchParams.get("projectId")
console.log(projectId)
    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    // Get user's workspace
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Build query
    const query: any = { workspaceId: userData.workspaceId }
    if (projectId) {
      query.projectId = projectId
    }

    // Get tasks
    const tasks = await tasksCollection.find(query).toArray()

    // Populate author and assignee data
    const populatedTasks = await Promise.all(
      tasks.map(async (task) => {
        const author = task.createdBy ? await usersCollection.findOne({ id: task.createdBy }) : null
        const assignee = task.assignedTo ? await usersCollection.findOne({ id: task.assignedTo }) : null

        return {
          ...task,
          author: author ? { id: author.id, username: author.username, email: author.email } : null,
          assignee: assignee ? { id: assignee.id, username: assignee.username, email: assignee.email } : null,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: populatedTasks,
      message: "Tasks retrieved successfully",
    })
  } catch (error) {
    console.error("Get tasks error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks - Create new task
export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, status, priority, projectId, assignedTo, dueDate } = body

    // Validate required fields
    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Task title is required" }, { status: 400 })
    }

    if (!projectId) {
      return NextResponse.json({ success: false, error: "Project ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")
    const projectsCollection = db.collection("projects")

    // Get user's workspace and role
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const userRole = getUserRole(userData.role)
    if (!canUserPerformAction(userRole, "task", "create")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Verify project exists and belongs to user's workspace
    const project = await projectsCollection.findOne({
      id: projectId,
      workspaceId: userData.workspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Create new task
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTask = {
      id: taskId,
      title: title.trim(),
      description: description?.trim() || "",
      status: status || "todo",
      priority: priority || "medium",
      projectId,
      workspaceId: userData.workspaceId,
      createdBy: user.userId, // Auto-assign from current user
      assignedTo: assignedTo || undefined,
      dueDate: dueDate || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await tasksCollection.insertOne(newTask)

    // Get populated task data
    const author = await usersCollection.findOne({ id: user.userId })
    const assignee = assignedTo ? await usersCollection.findOne({ id: assignedTo }) : null

    const populatedTask = {
      ...newTask,
      author: author ? { id: author.id, username: author.username, email: author.email } : null,
      assignee: assignee ? { id: assignee.id, username: assignee.username, email: assignee.email } : null,
    }

    return NextResponse.json({
      success: true,
      data: populatedTask,
      message: "Task created successfully",
    })
  } catch (error) {
    console.error("Create task error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
