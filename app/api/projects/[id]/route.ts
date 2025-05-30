import { type NextRequest, NextResponse } from "next/server"
import { MOCK_PROJECTS } from "@/lib/constants"

// GET /api/projects/[id] - Get project by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const project = MOCK_PROJECTS.find((p) => p.id === params.id)

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: project,
      message: "Project retrieved successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch project",
      },
      { status: 500 },
    )
  }
}

// PUT /api/projects/[id] - Update project
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const projectIndex = MOCK_PROJECTS.findIndex((p) => p.id === params.id)

    if (projectIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 },
      )
    }

    // Update project
    MOCK_PROJECTS[projectIndex] = {
      ...MOCK_PROJECTS[projectIndex],
      ...body,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json({
      success: true,
      data: MOCK_PROJECTS[projectIndex],
      message: "Project updated successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update project",
      },
      { status: 500 },
    )
  }
}

// DELETE /api/projects/[id] - Delete project
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectIndex = MOCK_PROJECTS.findIndex((p) => p.id === params.id)

    if (projectIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          error: "Project not found",
        },
        { status: 404 },
      )
    }

    // Remove project
    MOCK_PROJECTS.splice(projectIndex, 1)

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete project",
      },
      { status: 500 },
    )
  }
}
