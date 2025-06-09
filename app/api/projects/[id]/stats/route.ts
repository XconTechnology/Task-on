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

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const projectsCollection = db.collection("projects")
    const workspacesCollection = db.collection("workspaces")

    // Get current workspace ID
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId)
    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get project
    const project = await projectsCollection.findOne({
      id: projectId,
      workspaceId: currentWorkspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Get all tasks for this project
    const tasks = await tasksCollection.find({ projectId }).toArray()

    // Calculate statistics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === "done").length
    const inProgressTasks = tasks.filter((task) => task.status === "in-progress").length
    const todoTasks = tasks.filter((task) => task.status === "todo").length

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
      const teamMembersCount = workspace.members.filter(
        (member: any) => member.teamIds && member.teamIds.includes(project.teamId),
      ).length
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
        assignedMembers,
      },
    })
  } catch (error) {
    console.error("Get project stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
