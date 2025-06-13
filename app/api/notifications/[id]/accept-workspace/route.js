import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getDatabase } from "@/lib/mongodb"
import { notificationService } from "@/lib/services/notification-service"

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const notificationId = params.id

    // Accept the workspace invitation
    const result = await notificationService.acceptWorkspaceInvitation(notificationId, user.userId)

    if (!result.success || !result.inviteToken) {
      return NextResponse.json({ success: false, error: "Invalid or expired invitation" }, { status: 404 })
    }

    // Process the invitation using the token
    const db = await getDatabase()
    const workspacesCollection = db.collection("workspaces")
    const usersCollection = db.collection("users")

    // Find workspace with pending invite
    const workspace = await workspacesCollection.findOne({
      "pendingInvites.token": result.inviteToken,
    })

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace invitation not found" }, { status: 404 })
    }

    // Find the specific invite
    const invite = workspace.pendingInvites.find((inv) => inv.token === result.inviteToken)

    if (!invite) {
      return NextResponse.json({ success: false, error: "Invalid invitation" }, { status: 404 })
    }

    // Check if invite is expired
    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json({ success: false, error: "Invitation has expired" }, { status: 400 })
    }

    // Get user data
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if user is already a member
    const isAlreadyMember = workspace.members.some((member) => member.memberId === user.userId)

    if (isAlreadyMember) {
      return NextResponse.json({ success: false, error: "You are already a member of this workspace" }, { status: 409 })
    }

    // Create workspace member
    const newMember = {
      memberId: user.userId,
      username: userData.username,
      email: userData.email,
      role: invite.role,
      joinedAt: new Date().toISOString(),
    }

    // Update workspace and user
    await Promise.all([
      workspacesCollection.updateOne(
        { id: workspace.id },
        {
          $push: { members: newMember } ,
          $pull: { pendingInvites: { token: result.inviteToken } } ,
          $set: { updatedAt: new Date().toISOString() },
        },
      ),
      usersCollection.updateOne(
        { id: user.userId },
        {
          $addToSet: { workspaceIds: workspace.id },
          $set: { updatedAt: new Date().toISOString() },
        },
      ),
    ])

    // Notify existing workspace members
    try {
      const existingMemberIds = workspace.members
        .filter((member) => member.memberId !== user.userId)
        .map((member) => member.memberId)

      if (existingMemberIds.length > 0) {
        await notificationService.notifyWorkspaceMemberJoined(
          existingMemberIds,
          workspace.id,
          workspace.name,
          userData.username,
          userData.email,
        )
      }
    } catch (notificationError) {
      console.error("Error creating workspace join notification:", notificationError)
      // Don't fail the operation if notification fails
    }

    return NextResponse.json({
      success: true,
      data: { workspace: { id: workspace.id, name: workspace.name } },
      message: "Successfully joined workspace",
    })
  } catch (error) {
    console.error("Accept workspace invitation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
