import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"

// ✅ Utility function to extract projectId from URL
function getProjectIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const index = pathParts.indexOf("projects")
  return index !== -1 && pathParts.length > index + 1 ? pathParts[index + 1] : null
}

// GET /api/projects/[id]
export async function GET(request: NextRequest) {
  try {
    const projectId = getProjectIdFromRequest(request)
    if (!projectId) {
      return NextResponse.json({ success: false, error: "Invalid project ID" }, { status: 400 })
    }

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
    const projectsCollection = db.collection("projects")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    let projectQuery: any = {
      id: projectId,
      workspaceId: currentWorkspaceId,
    }

    // Apply role-based filtering for project access
    if (userRole === "Member") {
      projectQuery = {
        id: projectId,
        workspaceId: currentWorkspaceId,
        $or: [{ assignedMembers: user.userId }, { createdBy: user.userId }],
      }
    }

    const project = await projectsCollection.findOne(projectQuery)

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found or access denied" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/projects/[id]
export async function PUT(request: NextRequest) {
  try {
    const projectId = getProjectIdFromRequest(request)
    if (!projectId) {
      return NextResponse.json({ success: false, error: "Invalid project ID" }, { status: 400 })
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, startDate, endDate, teamId, assignedMembers, status } = body

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Project name is required" }, { status: 400 })
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ success: false, error: "End date must be after start date" }, { status: 400 })
    }

    // Validate status if provided
    if (status && !["ongoing", "completed", "delayed", "archived"].includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid project status" }, { status: 400 })
    }

    // Validate assignedMembers if provided
    if (assignedMembers && !Array.isArray(assignedMembers)) {
      return NextResponse.json({ success: false, error: "Assigned members must be an array" }, { status: 400 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
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
    if (!canUserPerformAction(userRole, "project", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get the current project to compare changes
    const currentProject = await projectsCollection.findOne({
      id: projectId,
      workspaceId: currentWorkspaceId,
    })

    if (!currentProject) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Handle team assignment changes and member management
    let finalAssignedMembers = assignedMembers || []

    // Check if team is being removed (teamId is "none" or undefined, but project had a team before)
    const isRemovingTeam = currentProject.teamId && (!teamId || teamId === "none")

    // Check if team is being changed or added
    const isChangingTeam = teamId && teamId !== "none" && teamId !== currentProject.teamId

    if (isRemovingTeam) {
      // Remove team members from assignedMembers when team is removed
      const currentTeam = await teamsCollection.findOne({
        id: currentProject.teamId,
        workspaceId: currentWorkspaceId,
      })

      if (currentTeam && currentTeam.members && Array.isArray(currentTeam.members)) {
        const teamMemberIds = currentTeam.members.map((member: any) => member.memberId || member.userId || member.id)

        // Remove team members from current assigned members
        finalAssignedMembers = (currentProject.assignedMembers || []).filter(
          (memberId: string) => !teamMemberIds.includes(memberId),
        )

        // Add back any manually assigned members that were provided
        if (assignedMembers && assignedMembers.length > 0) {
          finalAssignedMembers = [...new Set([...finalAssignedMembers, ...assignedMembers])]
        }
      }
    } else if (isChangingTeam) {
      // Handle team change: remove old team members and add new team members
      let membersToKeep = assignedMembers || []

      // If there was a previous team, remove its members
      if (currentProject.teamId) {
        const oldTeam = await teamsCollection.findOne({
          id: currentProject.teamId,
          workspaceId: currentWorkspaceId,
        })

        if (oldTeam && oldTeam.members && Array.isArray(oldTeam.members)) {
          const oldTeamMemberIds = oldTeam.members.map((member: any) => member.memberId || member.userId || member.id)
          membersToKeep = (currentProject.assignedMembers || []).filter(
            (memberId: string) => !oldTeamMemberIds.includes(memberId),
          )
        }
      }

      // Add new team members
      const newTeam = await teamsCollection.findOne({
        id: teamId,
        workspaceId: currentWorkspaceId,
      })

      if (newTeam && newTeam.members && Array.isArray(newTeam.members)) {
        const newTeamMemberIds = newTeam.members.map((member: any) => member.memberId || member.userId || member.id)
        finalAssignedMembers = [...new Set([...membersToKeep, ...newTeamMemberIds, ...(assignedMembers || [])])]
      } else {
        finalAssignedMembers = [...new Set([...membersToKeep, ...(assignedMembers || [])])]
      }
    } else if (teamId && teamId !== "none" && teamId === currentProject.teamId) {
      // Team remains the same, just update assigned members normally
      finalAssignedMembers = assignedMembers || currentProject.assignedMembers || []
    }

    // Build update object
    const updateData: any = {
      name: name.trim(),
      description: description?.trim() || "",
      teamId: teamId && teamId !== "none" ? teamId : undefined,
      assignedMembers: finalAssignedMembers.length > 0 ? finalAssignedMembers : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      updatedAt: new Date().toISOString(),
    }

    // Add status to update if provided
    if (status) {
      updateData.status = status
    }

    const updatedProject = await projectsCollection.findOneAndUpdate(
      {
        id: projectId,
        workspaceId: currentWorkspaceId,
      },
      {
        $set: updateData,
      },
      { returnDocument: "after" },
    )

    if (!updatedProject?.id) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedProject,
      message: "Project updated successfully",
    })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]
export async function DELETE(request: NextRequest) {
  try {
    const projectId = getProjectIdFromRequest(request)
    if (!projectId) {
      return NextResponse.json({ success: false, error: "Invalid project ID" }, { status: 400 })
    }

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
    const projectsCollection = db.collection("projects")
    const tasksCollection = db.collection("tasks")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)
    if (!canUserPerformAction(userRole, "project", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const project = await projectsCollection.findOne({
      id: projectId,
      workspaceId: currentWorkspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Delete all tasks in this project
    await tasksCollection.deleteMany({ projectId, workspaceId: currentWorkspaceId })
    await projectsCollection.deleteOne({ id: projectId })

    return NextResponse.json({
      success: true,
      message: "Project and all associated tasks deleted successfully",
    })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
