import { type NextRequest, NextResponse } from "next/server"
import { MOCK_PROJECTS, MOCK_TASKS, MOCK_USERS } from "@/lib/constants"
import type { SearchResults } from "@/lib/types"

// GET /api/search - Global search across projects, tasks, and users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Search query is required",
        },
        { status: 400 },
      )
    }

    const searchTerm = query.toLowerCase().trim()

    // Search projects
    const matchingProjects = MOCK_PROJECTS.filter(
      (project) =>
        project.name.toLowerCase().includes(searchTerm) || project.description?.toLowerCase().includes(searchTerm),
    )

    // Search tasks
    const matchingTasks = MOCK_TASKS.filter(
      (task) =>
        task.title.toLowerCase().includes(searchTerm) ||
        task.description?.toLowerCase().includes(searchTerm) ||
        task.tags?.toLowerCase().includes(searchTerm),
    ).map((task) => ({
      ...task,
      author: MOCK_USERS.find((user) => user.id === task.authorUserId),
      assignee: MOCK_USERS.find((user) => user.id === task.assignedUserId),
    }))

    // Search users
    const matchingUsers = MOCK_USERS.filter(
      (user) => user.username.toLowerCase().includes(searchTerm) || user.email.toLowerCase().includes(searchTerm),
    )

    const results: SearchResults = {
      projects: matchingProjects,
      tasks: matchingTasks,
      users: matchingUsers,
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: "Search completed successfully",
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
      },
      { status: 500 },
    )
  }
}
