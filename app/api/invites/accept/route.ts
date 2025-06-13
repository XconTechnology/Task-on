import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth"
import type { User, WorkspaceMember, PendingInvite } from "@/lib/types"
import { notificationService } from "@/lib/services/notification-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, username, password } = body

    if (!token || !username || !password) {
      return NextResponse.json({ success: false, error: "Token, username, and password are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const workspacesCollection = db.collection("workspaces")
    const usersCollection = db.collection("users")

    // Find workspace with pending invite
    const workspace = await workspacesCollection.findOne({
      "pendingInvites.token": token,
    })

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Invalid or expired invitation" }, { status: 404 })
    }

    // Find the specific invite
    const invite = workspace.pendingInvites.find((inv: PendingInvite) => inv.token === token)

    if (!invite) {
      return NextResponse.json({ success: false, error: "Invalid invitation" }, { status: 404 })
    }

    // Check if invite is expired
    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json({ success: false, error: "Invitation has expired" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email: invite.email }, { username }],
    })

    if (existingUser) {
      return NextResponse.json({ success: false, error: "User already exists" }, { status: 409 })
    }

    // Create new user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const hashedPassword = await hashPassword(password)

    const newUser: User = {
      id: userId,
      username,
      email: invite.email,
      password: hashedPassword,
      workspaceIds: [workspace.id],
      profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Create workspace member
    const newMember: WorkspaceMember = {
      memberId: userId,
      username,
      email: invite.email,
      role: invite.role,
      joinedAt: new Date().toISOString(),
    }

    // Insert user and update workspace
    await usersCollection.insertOne(newUser)
    await workspacesCollection.updateOne(
      { id: workspace.id },
      {
        $push: { members: newMember } as any,
        $pull: { pendingInvites: { token } } as any,
        $set: { updatedAt: new Date().toISOString() },
      },
    )

    // After successfully adding user to workspace, add:

    // Create notifications for existing workspace members
    try {
      const existingMemberIds = workspace.members
        .filter((member:any) => member.memberId !== userId)
        .map((member:any) => member.memberId)

      if (existingMemberIds.length > 0) {
        await notificationService.notifyWorkspaceMemberJoined(
          existingMemberIds,
          workspace.id,
          workspace.name,
          username,
          invite.email,
        )
      }
    } catch (notificationError) {
      console.error("Error creating workspace join notification:", notificationError)
      // Don't fail the operation if notification fails
    }

    // Generate JWT token
    const authToken = generateToken({
      userId: newUser.id,
      email: newUser.email,
      username: newUser.username,
    })

    // Remove password from response
    const { password: _, ...userResponse } = newUser

    const response = NextResponse.json({
      success: true,
      data: { user: userResponse, workspace },
      message: "Account created and joined workspace successfully",
    })

    // Set HTTP-only cookie
    response.cookies.set("auth-token", authToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    })

    return response
  } catch (error) {
    console.error("Accept invite error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
