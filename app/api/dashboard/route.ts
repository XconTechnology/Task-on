import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import type { DashboardStats, ProjectSummary } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const tasksPage = Number.parseInt(searchParams.get("tasksPage") || "1")
    const tasksLimit = Number.parseInt(searchParams.get("tasksLimit") || "10")

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const projectsCollection = db.collection("projects")
    const usersCollection = db.collection("users")

    // Get all tasks in the workspace
    const allTasks = await tasksCollection.find({ workspaceId: currentWorkspaceId }).toArray()

    // Get all projects in the workspace
    const allProjects = await projectsCollection.find({ workspaceId: currentWorkspaceId }).toArray()

    // Calculate task stats
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter((task) => task.status === "Completed").length
    const inProgressTasks = allTasks.filter((task) => task.status === "In Progress").length
    const todoTasks = allTasks.filter((task) => task.status === "To Do").length

    // Calculate project stats
    const totalProjects = allProjects.length
    const completedProjects = allProjects.filter((project) => project.status === "completed").length
    const ongoingProjects = allProjects.filter((project) => project.status === "ongoing").length
    const delayedProjects = allProjects.filter((project) => {
      if (project.status === "delayed") return true
      // Also consider projects delayed if they have a due date that's passed and aren't completed
      if (project.endDate && project.status !== "completed") {
        return new Date(project.endDate) < new Date()
      }
      return false
    }).length

    // Calculate projects completion rate
    const projectsWithTasks = await Promise.all(
      allProjects.map(async (project) => {
        const projectTasks = allTasks.filter((task) => task.projectId === project.id)
        const projectCompletedTasks = projectTasks.filter((task) => task.status === "Completed")
        const completionRate =
          projectTasks.length > 0 ? Math.round((projectCompletedTasks.length / projectTasks.length) * 100) : 0

        return {
          ...project,
          totalTasks: projectTasks.length,
          completedTasks: projectCompletedTasks.length,
          completionRate,
        }
      }),
    )

    const totalProjectTasks = projectsWithTasks.reduce((sum, project) => sum + project.totalTasks, 0)
    const totalProjectCompletedTasks = projectsWithTasks.reduce((sum, project) => sum + project.completedTasks, 0)
    const projectsCompletionRate =
      totalProjectTasks > 0 ? Math.round((totalProjectCompletedTasks / totalProjectTasks) * 100) : 0

    // Get today's tasks for the user (assigned to them or created by them)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const userTasksQuery = {
      workspaceId: currentWorkspaceId,
      $or: [{ assignedTo: user.userId }, { createdBy: user.userId }],
    }

    const totalUserTasks = await tasksCollection.countDocuments(userTasksQuery)
    const todayUserTasks = await tasksCollection
      .find(userTasksQuery)
      .sort({ createdAt: -1, updatedAt: -1 })
      .skip((tasksPage - 1) * tasksLimit)
      .limit(tasksLimit)
      .toArray()

    // Get user details for tasks
    const userIds = [
      ...new Set([
        ...todayUserTasks.map((task) => task.createdBy).filter(Boolean),
        ...todayUserTasks.map((task) => task.assignedTo).filter(Boolean),
      ]),
    ]

    const taskUsers = await usersCollection
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
    const populatedTodayTasks = todayUserTasks.map((task) => ({
      ...task,
      _id: undefined,
      author: task.createdBy ? userMap[task.createdBy] : undefined,
      assignee: task.assignedTo ? userMap[task.assignedTo] : undefined,
    }))

    // Create projects summary with manager info
    const projectManagerIds = [...new Set(allProjects.map((project) => project.createdBy))]
    const projectManagers = await usersCollection
      .find({ id: { $in: projectManagerIds } })
      .project({ id: 1, username: 1, email: 1 })
      .toArray()

    const managerMap = projectManagers.reduce(
      (acc, manager) => {
        acc[manager.id] = manager
        return acc
      },
      {} as Record<string, any>,
    )

    const projectsSummary: ProjectSummary[] = projectsWithTasks.map((project) => ({
      id: project.id,
      name: project.name,
      projectManager: managerMap[project.createdBy] || { id: project.createdBy, username: "Unknown", email: "" },
      dueDate: project.endDate,
      status: project.status as "ongoing" | "completed" | "delayed",
      completionRate: project.completionRate,
      totalTasks: project.totalTasks,
      completedTasks: project.completedTasks,
    }))

    const hasMoreTasks = totalUserTasks > tasksPage * tasksLimit

    const dashboardStats: DashboardStats = {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      totalProjects,
      completedProjects,
      ongoingProjects,
      delayedProjects,
      projectsCompletionRate,
      todayTasks: populatedTodayTasks,
      hasMoreTasks,
      projectsSummary: projectsSummary.slice(0, 10), // Limit to 10 projects for summary
    }

    return NextResponse.json({
      success: true,
      data: dashboardStats,
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
