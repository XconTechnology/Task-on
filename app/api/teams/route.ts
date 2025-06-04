import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const teamsCollection = db.collection("teams")

    // Get user's workspace
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get teams for the workspace
    const teams = await teamsCollection.find({ workspaceId: userData.workspaceId }).toArray()

    // Get member counts for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        const memberCount = await usersCollection.countDocuments({ teamId: team.id })
        return {
          ...team,
          memberCount,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: teamsWithCounts,
      message: "Teams retrieved successfully",
    })
  } catch (error) {
    console.error("Get teams error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { teamName, description } = body

    // Validation
    if (!teamName) {
      return NextResponse.json({ success: false, error: "Team name is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const teamsCollection = db.collection("teams")

    // Get user's workspace
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Create new team
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTeam: any = {
      id: teamId,
      teamName,
      description: description || "",
      workspaceId: userData.workspaceId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await teamsCollection.insertOne(newTeam)

    return NextResponse.json({
      success: true,
      data: { ...newTeam, memberCount: 0 },
      message: "Team created successfully",
    })
  } catch (error) {
    console.error("Create team error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
