import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")
    const workspacesCollection = db.collection("workspaces")

    // Get current workspace ID
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId)
    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get teams for the workspace
    const teams = await teamsCollection.find({ workspaceId: currentWorkspaceId }).toArray()

    // Get workspace to access members
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })
    if (!workspace?.members) {
      return NextResponse.json({ success: false, error: "Workspace members not found" }, { status: 404 })
    }

    // Get member counts for each team
    const teamsWithCounts = await Promise.all(
      teams.map(async (team) => {
        // Count members who have this team in their teamIds
        const memberCount = workspace.members.filter(
          (member: any) => member.teamIds && member.teamIds.includes(team.id),
        ).length

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
    const teamsCollection = db.collection("teams")

    // Get current workspace ID
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId)
    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Create new team
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTeam: any = {
      id: teamId,
      teamName,
      description: description || "",
      workspaceId: currentWorkspaceId,
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
