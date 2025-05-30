import { type NextRequest, NextResponse } from "next/server"
import { MOCK_TEAMS } from "@/lib/constants"
import type { Team } from "@/lib/types"

// GET /api/teams - Get all teams
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: MOCK_TEAMS,
      message: "Teams retrieved successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch teams",
      },
      { status: 500 },
    )
  }
}

// POST /api/teams - Create new team
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.teamName) {
      return NextResponse.json(
        {
          success: false,
          error: "Team name is required",
        },
        { status: 400 },
      )
    }

    // Create new team with generated ID
    const newTeam: Team = {
      id: `team_${Date.now()}`,
      teamName: body.teamName,
      productOwnerUserId: body.productOwnerUserId,
      projectManagerUserId: body.projectManagerUserId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // In real app, save to MongoDB here
    MOCK_TEAMS.push(newTeam)

    return NextResponse.json({
      success: true,
      data: newTeam,
      message: "Team created successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create team",
      },
      { status: 500 },
    )
  }
}
