import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

// GET /api/projects/[id]/stats - Get project statistics
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")
    const projectsCollection = db.collection("projects")

    // Get user's workspace
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get project
    const project = await projectsCollection.findOne({
      id: params.id,
      workspaceId: userData.workspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Get all tasks for this project
    const tasks = await tasksCollection.find({ projectId: params.id }).toArray()

    // Calculate statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === "done").length
    const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length
    const todoTasks = tasks.filter((task) => task.status === "todo").length

    // Calculate progress percentage
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Get unique team members assigned to tasks
    const assignedUserIds = [...new Set(tasks.map((task) => task.assignedTo).filter(Boolean))]
    const teamMembers = await usersCollection
      .find({ id: { $in: assignedUserIds } })
      .project({ id: 1, username: 1, email: 1 })
      .toArray()

    // Get team member count (if project has a team assigned)
    let totalTeamMembers = teamMembers.length
    if (project.teamId) {
      const teamMembersCount = await usersCollection.countDocuments({
        teamIds: { $in: [project.teamId] },
        workspaceId: userData.workspaceId,
      })
      totalTeamMembers = Math.max(totalTeamMembers, teamMembersCount)
    }

    return NextResponse.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        progress,
        teamMembers: totalTeamMembers,
        assignedMembers: teamMembers,
      },
    })
  } catch (error) {
    console.error("Get project stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
