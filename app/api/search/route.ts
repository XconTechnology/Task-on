import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import {
  populateTasksWithUsers,
  populateDocumentsWithRelatedData,
  getWorkspaceMembers,
  buildSearchRegex,
  searchWorkspaceContent,
  getRecentWorkspaceContent,
} from "@/lib/search-utils"
import type { SearchResults } from "@/lib/types"

// GET /api/search - Global search across projects, tasks, users, and documents within current workspace
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Get current workspace ID from headers
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")
    const db = await getDatabase()

    // If no query, return recent/popular suggestions from current workspace
    if (!query || query.trim().length === 0) {
      const {
        tasks: recentTasks,
        projects: activeProjects,
        documents: recentDocuments,
      } = await getRecentWorkspaceContent(currentWorkspaceId, db)

      const recentUsers = await getWorkspaceMembers(currentWorkspaceId, db)

      // Populate data
      const [populatedTasks, populatedDocuments] = await Promise.all([
        populateTasksWithUsers(recentTasks, db),
        populateDocumentsWithRelatedData(recentDocuments, db),
      ])

      const suggestions: SearchResults = {
        tasks: populatedTasks,
        projects: activeProjects.map((p) => ({ ...p, _id: undefined })),
        users: recentUsers.slice(0, 3).map((u) => ({ ...u, _id: undefined })),
        documents: populatedDocuments,
      }

      return NextResponse.json({
        success: true,
        data: suggestions,
        message: "Recent suggestions loaded",
        type: "suggestions",
      })
    }

    // Only search if query is at least 2 characters
    if (query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: { tasks: [], projects: [], users: [], documents: [] },
        message: "Query too short",
      })
    }

    const searchRegex = buildSearchRegex(query)

    // Search workspace content
    const { tasks, projects, documents } = await searchWorkspaceContent(currentWorkspaceId, searchRegex, db)

    // Search workspace members
    const allWorkspaceUsers = await getWorkspaceMembers(currentWorkspaceId, db)
    const matchingUsers = allWorkspaceUsers.filter(
      (user) =>
        user.username.toLowerCase().includes(query.toLowerCase()) ||
        user.email.toLowerCase().includes(query.toLowerCase()),
    )

    // Populate data
    const [populatedTasks, populatedDocuments] = await Promise.all([
      populateTasksWithUsers(tasks, db),
      populateDocumentsWithRelatedData(documents, db),
    ])

    const results: SearchResults = {
      tasks: populatedTasks,
      projects: projects.map((project) => ({ ...project, _id: undefined })),
      users: matchingUsers.slice(0, 5).map((user) => ({ ...user, _id: undefined })),
      documents: populatedDocuments,
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: "Search completed successfully",
      type: "search",
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
