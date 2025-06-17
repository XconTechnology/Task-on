import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { userId } = params

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Get current workspace ID from header or user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")
    const projectsCollection = db.collection("projects")

    // Verify the target user exists and is in the current workspace
    const workspacesCollection = db.collection("workspaces")
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 })
    }

    // Check if the target user is a member of the current workspace
    const isUserInWorkspace = workspace.members?.some((member) => member.memberId === userId)

    if (!isUserInWorkspace) {
      return NextResponse.json({ success: false, error: "User not found in current workspace" }, { status: 404 })
    }

    // Build query to get tasks for the specific user in the current workspace
    const query = {
      workspaceId: currentWorkspaceId,
      $or: [
        { createdBy: userId }, // Tasks created by the user
        { assignedTo: userId }, // Tasks assigned to the user
      ],
    }

    // Get tasks with proper sorting (newest first)
    const tasks = await tasksCollection.find(query).sort({ createdAt: -1 }).toArray()

    // Get user details for author and assignee information
    const userIds = [
      ...new Set([...tasks.map((task) => task.createdBy), ...tasks.map((task) => task.assignedTo).filter(Boolean)]),
    ]

    const users = await usersCollection.find({ id: { $in: userIds } }).toArray()

    // Get project details
    const projectIds = [...new Set(tasks.map((task) => task.projectId))]
    const projects = await projectsCollection.find({ id: { $in: projectIds } }).toArray()

    // Create lookup maps
    const userMap = new Map(users.map((user) => [user.id, user]))
    const projectMap = new Map(projects.map((project) => [project.id, project]))

    // Enrich tasks with user and project information
    const enrichedTasks = tasks.map((task) => ({
      ...task,
      author: task.createdBy
        ? {
            id: task.createdBy,
            username: userMap.get(task.createdBy)?.username || "Unknown",
            email: userMap.get(task.createdBy)?.email || "",
            profilePictureUrl: userMap.get(task.createdBy)?.profilePictureUrl || "",
          }
        : undefined,
      assignee: task.assignedTo
        ? {
            id: task.assignedTo,
            username: userMap.get(task.assignedTo)?.username || "Unknown",
            email: userMap.get(task.assignedTo)?.email || "",
            profilePictureUrl: userMap.get(task.assignedTo)?.profilePictureUrl || "",
          }
        : undefined,
      project: projectMap.get(task.projectId)
        ? {
            id: task.projectId,
            name: projectMap.get(task.projectId)?.name || "Unknown Project",
          }
        : undefined,
    }))

    return NextResponse.json({
      success: true,
      data: enrichedTasks,
      message: `Found ${enrichedTasks.length} tasks for user`,
    })
  } catch (error) {
    console.error("Get tasks by user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
