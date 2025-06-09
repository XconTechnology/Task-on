import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

// GET /api/projects/[id]/stats - Get project statistics
export async function GET(request: NextRequest) {
  try {
    // ✅ Manually extract the project ID from the URL
    const url = new URL(request.url)
    const pathParts = url.pathname.split("/")
    const projectId = pathParts[pathParts.indexOf("projects") + 1]

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const projectsCollection = db.collection("projects")
    const workspacesCollection = db.collection("workspaces")

    // Get project
    const project = await projectsCollection.findOne({
      id: projectId,
      workspaceId: currentWorkspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Get all tasks for this project
    const tasks = await tasksCollection.find({ projectId, workspaceId: currentWorkspaceId }).toArray()

    // Calculate statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === "Completed").length
    const inProgressTasks = tasks.filter((task) => task.status === "In Progress").length
    const todoTasks = tasks.filter((task) => task.status === "To Do").length

    // Calculate progress percentage
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Get workspace to access members
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })
    if (!workspace?.members) {
      return NextResponse.json({ success: false, error: "Workspace members not found" }, { status: 404 })
    }

    // Get unique team members assigned to tasks
    const assignedUserIds = [...new Set(tasks.map((task) => task.assignedTo).filter(Boolean))]
    const assignedMembers = workspace.members
      .filter((member: any) => assignedUserIds.includes(member.memberId))
      .map((member: any) => ({
        id: member.memberId,
        username: member.username,
        email: member.email,
      }))

    // Get team member count (if project has a team assigned)
    let totalTeamMembers = assignedMembers.length
    if (project.teamId) {
      // Get team and count its members
      const teamsCollection = db.collection("teams")
      const team = await teamsCollection.findOne({ id: project.teamId, workspaceId: currentWorkspaceId })
      if (team?.members) {
        totalTeamMembers = Math.max(totalTeamMembers, team.members.length)
      }
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
        assignedMembers,
      },
    })
  } catch (error) {
    console.error("Get project stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
