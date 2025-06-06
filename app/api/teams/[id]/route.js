import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

export async function GET(request, context) {
  try {
    const { id } = context.params
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")
    const usersCollection = db.collection("users")

    const userData = await usersCollection.findOne({ id: user.userId })
    const userRole = getUserRole(userData?.role)

    if (!canUserPerformAction(userRole, "team", "read")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const team = await teamsCollection.findOne({ id })

    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

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

export async function PUT(request, context) {
  try {
    const { id } = context.params
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const teamsCollection = db.collection("teams")

    const userData = await usersCollection.findOne({ id: user.userId })
    if (!canUserPerformAction(userData?.role || "Member", "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const updatedTeam = await teamsCollection.findOneAndUpdate(
      { id },
      {
        $set: {
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
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

export async function DELETE(request, context) {
  try {
    const { id } = context.params
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const teamsCollection = db.collection("teams")

    const userData = await usersCollection.findOne({ id: user.userId })
    if (!canUserPerformAction(userData?.role || "Member", "team", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    await usersCollection.updateMany(
      { teamIds: id },
      { $pull: { teamIds: id } }
    )

    await teamsCollection.deleteOne({ id })

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    })
  } catch (error) {
    console.error("Delete team error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
