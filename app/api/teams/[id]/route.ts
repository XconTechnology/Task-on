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

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params

    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const teamsCollection = db.collection("teams")

    // Get user's role
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!canUserPerformAction(userData?.role || "Member", "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const updatedTeam = await teamsCollection.findOneAndUpdate(
      { id: id },
      {
        $set: {
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" },
    )

    if (!updatedTeam?.value) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedTeam.value,
      message: "Team updated successfully",
    })
  } catch (error) {
    console.error("Update team error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
        const { id } = await params

    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const teamsCollection = db.collection("teams")

    // Get user's role
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!canUserPerformAction(userData?.role || "Member", "team", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Remove team from all users
    await usersCollection.updateMany({ teamId: id }, { $unset: { teamId: "" } })

    // Delete team
    await teamsCollection.deleteOne({ id: id })

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    })
  } catch (error) {
    console.error("Delete team error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
