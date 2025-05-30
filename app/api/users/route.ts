import { type NextRequest, NextResponse } from "next/server"
import { MOCK_USERS } from "@/lib/constants"
import type { User } from "@/lib/types"

// GET /api/users - Get all users
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: MOCK_USERS,
      message: "Users retrieved successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch users",
      },
      { status: 500 },
    )
  }
}

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.username || !body.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Username and email are required",
        },
        { status: 400 },
      )
    }

    // Check if email already exists
    const existingUser = MOCK_USERS.find((user) => user.email === body.email)
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: "User with this email already exists",
        },
        { status: 409 },
      )
    }

    // Create new user with generated ID
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: body.username,
      email: body.email,
      profilePictureUrl: body.profilePictureUrl || "/placeholder.svg?height=40&width=40",
      teamId: body.teamId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // In real app, save to MongoDB here
    MOCK_USERS.push(newUser)

    return NextResponse.json({
      success: true,
      data: newUser,
      message: "User created successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
      },
      { status: 500 },
    )
  }
}
