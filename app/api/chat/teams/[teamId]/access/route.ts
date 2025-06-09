import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { teamId } = params

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
    const usersCollection = db.collection("users")

    // Get team data
    const team = await teamsCollection.findOne({
      id: teamId,
      workspaceId: currentWorkspaceId,
    })

    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

    // Check if user is a member of this team
    const isMember = team.members && team.members.includes(user.userId)

    if (!isMember) {
      return NextResponse.json({ success: false, error: "You are not a member of this team" }, { status: 403 })
    }

    // Get user data for chat
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get all team members data for chat
    const teamMembers = await usersCollection.find({ id: { $in: team.members || [] } }).toArray()

    const membersData = teamMembers.map((member) => ({
      id: member.id,
      username: member.username,
      email: member.email,
      profilePictureUrl: member.profilePictureUrl,
    }))

    return NextResponse.json({
      success: true,
      data: {
        team: {
          id: team.id,
          teamName: team.teamName,
          description: team.description,
          workspaceId: team.workspaceId,
          members: team.members || [],
        },
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          profilePictureUrl: userData.profilePictureUrl,
        },
        teamMembers: membersData,
      },
    })
  } catch (error) {
    console.error("Chat access validation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
