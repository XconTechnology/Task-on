import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId, validateUserWorkspaceAccess } from "@/lib/workspace-utils"
import type { Team } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    // If header was provided, validate access
    if (headerWorkspaceId && headerWorkspaceId !== currentWorkspaceId) {
      const hasAccess = await validateUserWorkspaceAccess(user.userId, headerWorkspaceId)
      if (!hasAccess) {
        return NextResponse.json(
          { success: false, error: "Access denied. You don't have permission to access this workspace." },
          { status: 403 },
        )
      }
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")

    // Get teams for the workspace
    const teams = await teamsCollection.find({ workspaceId: currentWorkspaceId }).toArray()

    // Calculate member counts for each team
    const teamsWithCounts = teams.map((team) => ({
      ...team,
      memberCount: team.members ? team.members.length : 0,
    }))

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

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")

    // Create new team with proper Team interface
    const teamId = `team_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTeam: Team = {
      id: teamId,
      teamName,
      description: description || "",
      workspaceId: currentWorkspaceId,
      createdBy: user.userId,
      memberCount: 0,
      members: [], // Initialize empty members array
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await teamsCollection.insertOne(newTeam)

    return NextResponse.json({
      success: true,
      data: newTeam,
      message: "Team created successfully",
    })
  } catch (error) {
    console.error("Create team error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
