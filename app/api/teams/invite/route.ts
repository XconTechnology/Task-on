import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { PendingInvite, WorkspaceMember } from "@/lib/types"
import crypto from "crypto"
import { sendInvitationEmail, sendWorkspaceInvitationEmail } from "@/lib/email-service"
import { notificationService } from "@/lib/services/notification-service"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { emails, role = "Member", workspaceId } = body

    // Validation
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ success: false, error: "Email addresses are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const workspacesCollection = db.collection("workspaces")

    // Get user's current workspace if workspaceId not provided
    let targetWorkspaceId = workspaceId

    if (!targetWorkspaceId) {
      // Get user's first workspace as default
      const userData = await usersCollection.findOne({ id: user.userId })
      if (!userData?.workspaceIds || userData.workspaceIds.length === 0) {
        return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
      }
      targetWorkspaceId = userData.workspaceIds[0]
    }

    // Get workspace and check if user has permission to invite
    const workspace = await workspacesCollection.findOne({ id: targetWorkspaceId })
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 })
    }

    // Get inviter's name for email
    const inviterData = await usersCollection.findOne({ id: user.userId })
    const inviterName = inviterData?.username || "Someone"

    // Initialize members array if it doesn't exist
    if (!workspace.members) {
      await workspacesCollection.updateOne({ id: targetWorkspaceId }, { $set: { members: [], pendingInvites: [] } })
      workspace.members = []
      workspace.pendingInvites = []
    }

    // Check if user is member of workspace and has permission to invite
    const userMember = workspace.members.find((member: WorkspaceMember) => member.memberId === user.userId)

    if (!userMember) {
      return NextResponse.json({ success: false, error: "You are not a member of this workspace" }, { status: 403 })
    }

    // Check permissions (Owner and Admin can invite, Members only if allowed)
    const canInvite =
      userMember.role === "Owner" ||
      userMember.role === "Admin" ||
      (userMember.role === "Member" && workspace.allowMemberInvites)

    if (!canInvite) {
      return NextResponse.json({ success: false, error: "You don't have permission to invite users" }, { status: 403 })
    }

    const results = []
    const baseUrl =
      process.env.APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    for (const email of emails) {
      try {
        // Check if user already exists
        const existingUser = await usersCollection.findOne({
          email: email.toLowerCase(),
        })

        if (existingUser) {
          // Check if user is already a member of this workspace
          const isAlreadyMember = workspace.members.some(
            (member: WorkspaceMember) => member.memberId === existingUser.id,
          )

          if (isAlreadyMember) {
            results.push({
              email,
              status: "already_member",
              message: "User is already a member",
            })
          } else {
            // CHANGED: Don't auto-add existing users, send invitation notification instead
            const inviteToken = crypto.randomBytes(32).toString("hex")

            // Create notification for existing user
            await notificationService.notifyWorkspaceInvitation(
              existingUser.id,
              targetWorkspaceId,
              workspace.name,
              inviterName,
              inviteToken,
            )

            // Create pending invite
            const expiresAt = new Date()
            expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

            const pendingInvite: PendingInvite = {
              id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              email: email.toLowerCase(),
              role,
              invitedBy: user.userId,
              invitedAt: new Date().toISOString(),
              token: inviteToken,
              expiresAt: expiresAt.toISOString(),
            }

            // Add pending invite to workspace
            await workspacesCollection.updateOne(
              { id: targetWorkspaceId },
              {
                $push: { pendingInvites: pendingInvite } as any,
                $set: { updatedAt: new Date().toISOString() },
              },
            )

            // Send email invitation to existing user
            const inviteUrl = `${baseUrl}/invite?token=${inviteToken}`
            const emailResult = await sendWorkspaceInvitationEmail(
              email,
              workspace.name,
              inviteUrl,
              inviterName,
              true, // isExistingUser
            )

            results.push({
              email,
              status: "invitation_sent",
              message: "Invitation sent to existing user",
              emailSent: emailResult.success,
              emailError: emailResult.error,
            })
          }
        } else {
          // Create pending invite for new user
          const inviteToken = crypto.randomBytes(32).toString("hex")
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 7) // 7 days expiry

          const pendingInvite: PendingInvite = {
            id: `invite_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            email: email.toLowerCase(),
            role,
            invitedBy: user.userId,
            invitedAt: new Date().toISOString(),
            token: inviteToken,
            expiresAt: expiresAt.toISOString(),
          }

          // Add pending invite to workspace
          await workspacesCollection.updateOne(
            { id: targetWorkspaceId },
            {
              $push: { pendingInvites: pendingInvite } as any,
              $set: { updatedAt: new Date().toISOString() },
            },
          )

          // Send email invitation
          const inviteUrl = `${baseUrl}/invite?token=${inviteToken}`
          const emailResult = await sendInvitationEmail(email, workspace.name, inviteUrl, inviterName)

          results.push({
            email,
            status: "invited",
            message: "Invitation sent via email",
            emailSent: emailResult.success,
            emailError: emailResult.error,
            // Include these for development/testing only
            ...(process.env.NODE_ENV === "development" && {
              inviteToken,
              inviteUrl,
            }),
          })
        }
      } catch (error) {
        console.error(`Error processing invite for ${email}:`, error)
        results.push({
          email,
          status: "error",
          message: "Failed to process invitation",
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: "Invitations processed successfully",
    })
  } catch (error) {
    console.error("Invite users error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
