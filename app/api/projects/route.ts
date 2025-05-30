import { type NextRequest, NextResponse } from "next/server"
import { MOCK_PROJECTS } from "@/lib/constants"
import type { Project } from "@/lib/types"

// GET /api/projects - Get all projects
export async function GET() {
  try {
    // Simulate database delay for realism
    await new Promise((resolve) => setTimeout(resolve, 100))

    return NextResponse.json({
      success: true,
      data: MOCK_PROJECTS,
      message: "Projects retrieved successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch projects",
      },
      { status: 500 },
    )
  }
}

// POST /api/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        {
          success: false,
          error: "Project name is required",
        },
        { status: 400 },
      )
    }

    // Create new project with generated ID
    const newProject: Project = {
      id: `project_${Date.now()}`,
      name: body.name,
      description: body.description || "",
      startDate: body.startDate,
      endDate: body.endDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // In real app, save to MongoDB here
    MOCK_PROJECTS.push(newProject)

    return NextResponse.json({
      success: true,
      data: newProject,
      message: "Project created successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create project",
      },
      { status: 500 },
    )
  }
}
