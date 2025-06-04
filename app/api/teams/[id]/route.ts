import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")
    const usersCollection = db.collection("users")

    // Get user's role
    const userData = await usersCollection.findOne({ id: user.userId })
    const userRole = getUserRole(userData?.role)

    if (!canUserPerformAction(userRole, "team", "read")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get team details
    const team = await teamsCollection.findOne({ id })

    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

    // Get team members
    const teamMembers = await usersCollection
      .find({
        workspaceId: userData?.workspaceId,
        teamIds: { $in: [id] },
      })
      .toArray()

    const teamWithMembers = {
      ...team,
      members: teamMembers.map((member) => ({
        id: member.id,
        username: member.username,
        email: member.email,
        role: member.role,
        profilePictureUrl: member.profilePictureUrl,
        createdAt: member.createdAt,
      })),
    }

    return NextResponse.json({
      success: true,
      data: teamWithMembers,
    })
  } catch (error) {
    console.error("Get team error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
