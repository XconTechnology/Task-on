import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import type { SearchResults } from "@/lib/types"

// GET /api/search - Global search across projects, tasks, and users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("query")

    const db = await getDatabase()

    // If no query, return recent/popular suggestions
    if (!query || query.trim().length === 0) {
      // Get recent tasks (last 10 created)
      const recentTasks = await db.collection("tasks").find({}).sort({ createdAt: -1 }).limit(5).toArray()

      // Get active projects
      const activeProjects = await db
        .collection("projects")
        .find({ status: "active" })
        .sort({ updatedAt: -1 })
        .limit(3)
        .toArray()

      // Get recent users (excluding current user if possible)
      const recentUsers = await db
        .collection("users")
        .find({})
        .project({ id: 1, username: 1, email: 1, profilePictureUrl: 1, role: 1 })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray()

      // Get user details for recent tasks
      const taskUserIds = [
        ...new Set([
          ...recentTasks.map((task) => task.createdBy).filter(Boolean),
          ...recentTasks.map((task) => task.assignedTo).filter(Boolean),
        ]),
      ]

      const taskUsers = await db
        .collection("users")
        .find({ id: { $in: taskUserIds } })
        .project({ id: 1, username: 1, email: 1, profilePictureUrl: 1 })
        .toArray()

      const userMap = taskUsers.reduce(
        (acc, user) => {
          acc[user.id] = user
          return acc
        },
        {} as Record<string, any>,
      )

      // Populate tasks with user data
      const populatedTasks = recentTasks.map((task) => ({
        ...task,
        _id: undefined,
        author: task.createdBy ? userMap[task.createdBy] : undefined,
        assignee: task.assignedTo ? userMap[task.assignedTo] : undefined,
      }))

      const suggestions: SearchResults = {
        tasks: populatedTasks,
        projects: activeProjects.map((p) => ({ ...p, _id: undefined })),
        users: recentUsers.map((u) => ({ ...u, _id: undefined })),
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
        data: { tasks: [], projects: [], users: [] },
        message: "Query too short",
      })
    }

    const searchTerm = query.toLowerCase().trim()
    const searchRegex = new RegExp(searchTerm, "i")

    // Search tasks
    const matchingTasks = await db
      .collection("tasks")
      .find({
        $or: [
          { title: { $regex: searchRegex } },
          { description: { $regex: searchRegex } },
          { tags: { $regex: searchRegex } },
        ],
      })
      .sort({ updatedAt: -1 })
      .limit(8)
      .toArray()

    // Get user details for tasks
    const userIds = [
      ...new Set([
        ...matchingTasks.map((task) => task.createdBy).filter(Boolean),
        ...matchingTasks.map((task) => task.assignedTo).filter(Boolean),
      ]),
    ]

    const taskUsers = await db
      .collection("users")
      .find({ id: { $in: userIds } })
      .project({ id: 1, username: 1, email: 1, profilePictureUrl: 1 })
      .toArray()

    const userMap = taskUsers.reduce(
      (acc, user) => {
        acc[user.id] = user
        return acc
      },
      {} as Record<string, any>,
    )

    // Populate tasks with user data
    const populatedTasks = matchingTasks.map((task) => ({
      ...task,
      _id: undefined,
      author: task.createdBy ? userMap[task.createdBy] : undefined,
      assignee: task.assignedTo ? userMap[task.assignedTo] : undefined,
    }))

    // Search projects
    const matchingProjects = await db
      .collection("projects")
      .find({
        $or: [{ name: { $regex: searchRegex } }, { description: { $regex: searchRegex } }],
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .toArray()

    // Search users
    const matchingUsers = await db
      .collection("users")
      .find({
        $or: [{ username: { $regex: searchRegex } }, { email: { $regex: searchRegex } }],
      })
      .project({ id: 1, username: 1, email: 1, profilePictureUrl: 1, role: 1 })
      .limit(5)
      .toArray()

    const results: SearchResults = {
      tasks: populatedTasks,
      projects: matchingProjects.map((project) => ({ ...project, _id: undefined })),
      users: matchingUsers.map((user) => ({ ...user, _id: undefined })),
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
