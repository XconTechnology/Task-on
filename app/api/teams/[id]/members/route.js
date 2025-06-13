import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"
import { notificationService } from "@/lib/services/notification-service"

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { userIds } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: "User IDs are required" }, { status: 400 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")

    // Get user's role in the current workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    if (!canUserPerformAction(userRole, "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const team = await teamsCollection.findOne({
      id: params.id,
      workspaceId: currentWorkspaceId,
    })
    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

    // Add user IDs to team members array (avoid duplicates)
    const currentMembers = team.members || []
    const newMembers = [...new Set([...currentMembers, ...userIds])]

    await teamsCollection.updateOne(
      {
        id: params.id,
        workspaceId: currentWorkspaceId,
      },
      {
        $set: {
          members: newMembers,
          memberCount: newMembers.length,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    // After successfully adding members to the team, add:

    // Create notifications for existing team members about new members
    if (userIds.length > 0) {
      try {
        const usersCollection = db.collection("users")
        const newMembers = await usersCollection.find({ id: { $in: userIds } }).toArray()

        for (const newMember of newMembers) {
          // Notify existing team members about new member
          const existingMemberIds = currentMembers.filter((id) => id !== newMember.id)
          if (existingMemberIds.length > 0) {
            await notificationService.notifyTeamMemberAdded(
              existingMemberIds,
              currentWorkspaceId,
              params.id,
              team.teamName,
              newMember.username,
              newMember.email,
            )
          }

          // Notify the new member that they were added to the team
          await notificationService.notifyAddedToTeam(
            newMember.id,
            currentWorkspaceId,
            params.id,
            team.teamName,
            user.username || "Someone",
          )
        }
      } catch (notificationError) {
        console.error("Error creating team member notifications:", notificationError)
        // Don't fail the operation if notification fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Members added to team successfully",
    })
  } catch (error) {
    console.error("Add team members error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")

    // Get user's role in the current workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    if (!canUserPerformAction(userRole, "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Remove user ID from team members array
    const team = await teamsCollection.findOne({
      id: params.id,
      workspaceId: currentWorkspaceId,
    })

    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

    const updatedMembers = (team.members || []).filter((memberId) => memberId !== userId)

    await teamsCollection.updateOne(
      {
        id: params.id,
        workspaceId: currentWorkspaceId,
      },
      {
        $set: {
          members: updatedMembers,
          memberCount: updatedMembers.length,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Member removed from team successfully",
    })
  } catch (error) {
    console.error("Remove team member error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
