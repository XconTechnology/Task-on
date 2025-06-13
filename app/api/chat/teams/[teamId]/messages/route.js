import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { chatService } from "@/lib/services/chat-service"

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { teamId } = params
    const body = await request.json()
    const { message } = body

    if (!teamId) {
      return NextResponse.json({ success: false, error: "Team ID is required" }, { status: 400 })
    }

    if (!message || !message.trim()) {
      return NextResponse.json({ success: false, error: "Message is required" }, { status: 400 })
    }

    if (message.length > 1000) {
      return NextResponse.json({ success: false, error: "Message too long (max 1000 characters)" }, { status: 400 })
    }

    // Get current workspace ID
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")
    const usersCollection = db.collection("users")

    // Verify team exists and user is a member
    const team = await teamsCollection.findOne({
      id: teamId,
      workspaceId: currentWorkspaceId,
    })

    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

    const isMember = team.members && team.members.includes(user.userId)
    if (!isMember) {
      return NextResponse.json({ success: false, error: "You are not a member of this team" }, { status: 403 })
    }

    // Get user data
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Ensure chat room exists
    await chatService.createOrUpdateChatRoom({
      teamId: team.id,
      teamName: team.teamName,
      workspaceId: team.workspaceId,
      members: team.members || [],
    })

    // Send message
    const messageId = await chatService.sendMessage({
      teamId,
      userId: user.userId,
      username: userData.username,
      userEmail: userData.email,
      profilePictureUrl: userData.profilePictureUrl,
      message: message.trim(),
    })

    return NextResponse.json({
      success: true,
      data: { messageId },
      message: "Message sent successfully",
    })
  } catch (error) {
    console.error("Send message error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { teamId } = params
    const { searchParams } = new URL(request.url)
    const limitParam = searchParams.get("limit")
    const beforeParam = searchParams.get("before")

    const limit = limitParam ? Number.parseInt(limitParam, 10) : 50
    const before = beforeParam ? Number.parseInt(beforeParam, 10) : undefined

    if (!teamId) {
      return NextResponse.json({ success: false, error: "Team ID is required" }, { status: 400 })
    }

    // Get current workspace ID
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")

    // Verify team exists and user is a member
    const team = await teamsCollection.findOne({
      id: teamId,
      workspaceId: currentWorkspaceId,
    })

    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

    const isMember = team.members && team.members.includes(user.userId)
    if (!isMember) {
      return NextResponse.json({ success: false, error: "You are not a member of this team" }, { status: 403 })
    }

    // Get messages
    const messages = await chatService.getTeamMessages(teamId, limit, before)

    return NextResponse.json({
      success: true,
      data: messages,
    })
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
