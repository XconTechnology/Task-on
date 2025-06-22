import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"
import type { Project } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    let projectsQuery: any = { workspaceId: currentWorkspaceId }

    // Filter projects based on user role
    if (userRole === "Member") {
      // Members can only see projects they are assigned to
      projectsQuery = {
        workspaceId: currentWorkspaceId,
        $or: [{ assignedMembers: user.userId }, { createdBy: user.userId }],
      }
    }
    // Owners and Admins can see all projects (no additional filter needed)

    const projects = await projectsCollection.find(projectsQuery).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, startDate, endDate, teamId, assignedMembers } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Project name is required" }, { status: 400 })
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ success: false, error: "End date must be after start date" }, { status: 400 })
    }

    // Validate assignedMembers if provided
    if (assignedMembers && !Array.isArray(assignedMembers)) {
      return NextResponse.json({ success: false, error: "Assigned members must be an array" }, { status: 400 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const teamsCollection = db.collection("teams")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)
    if (!canUserPerformAction(userRole, "project", "create")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Handle team assignment and auto-populate assignedMembers
    let finalAssignedMembers = assignedMembers || []

    if (teamId && teamId !== "none") {
      // Get team members from the team
      const team = await teamsCollection.findOne({
        id: teamId,
        workspaceId: currentWorkspaceId,
      })

      if (team && team.members && Array.isArray(team.members)) {
        // Extract member IDs from team members
        const teamMemberIds = team.members.map((member: any) => member.memberId || member.userId || member.id)

        // Combine existing assigned members with team members (remove duplicates)
        const combinedMembers = [...new Set([...finalAssignedMembers, ...teamMemberIds])]
        finalAssignedMembers = combinedMembers
      }
    }

    // Create project using your existing ID generation pattern
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newProject: Project = {
      id: projectId,
      name: name.trim(),
      description: description?.trim() || "",
      workspaceId: currentWorkspaceId,
      createdBy: user.userId,
      teamId: teamId && teamId !== "none" ? teamId : undefined,
      assignedMembers: finalAssignedMembers.length > 0 ? finalAssignedMembers : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: "ongoing",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await projectsCollection.insertOne(newProject)

    return NextResponse.json({
      success: true,
      data: newProject,
      message: "Project created successfully",
    })
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
