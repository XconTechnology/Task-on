import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken } from "@/lib/auth"
import type { User, WorkspaceMember } from "@/lib/types"

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
    const invite = workspace.pendingInvites.find((inv: any) => inv.token === token)

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
      // If user exists with same email but different username
      if (existingUser.email === invite.email && existingUser.username !== username) {
        return NextResponse.json(
          {
            success: false,
            error: "An account with this email already exists",
          },
          { status: 409 },
        )
      }

      // If username is taken by another user
      if (existingUser.username === username && existingUser.email !== invite.email) {
        return NextResponse.json(
          {
            success: false,
            error: "This username is already taken",
          },
          { status: 409 },
        )
      }

      // If user exists with both same email and username, add to workspace
      const newMember: WorkspaceMember = {
        memberId: existingUser.id,
        username: existingUser.username,
        email: existingUser.email,
        role: invite.role,
        joinedAt: new Date().toISOString(),
      }

      // Update workspace and user
      await workspacesCollection.updateOne(
        { id: workspace.id },
        {
          $push: { members: newMember }  as any,
          $pull: { pendingInvites: { token } } as any,
          $set: { updatedAt: new Date().toISOString() },
        },
      )

      await usersCollection.updateOne(
        { id: existingUser.id },
        {
          $addToSet: { workspaceIds: workspace.id },
          $set: { updatedAt: new Date().toISOString() },
        },
      )

      // Generate JWT token
      const authToken = generateToken({
        userId: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
      })

      const response = NextResponse.json({
        success: true,
        data: { user: { ...existingUser, password: undefined }, workspace },
        message: "Joined workspace successfully",
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
        $push: { members: newMember }  as any,
        $pull: { pendingInvites: { token } } as any,
        $set: { updatedAt: new Date().toISOString() },
      },
    )

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
