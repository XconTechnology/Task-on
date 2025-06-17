import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { Status } from "@/lib/types"
import {
  calculateDailyProductivity,
  calculateMonthlyProductivity,
  calculateProjectTimeline,
  calculateTaskTrends,
  calculateTeamEfficiency,
  calculateTeamPerformance,
  calculateTeamWorkload,
  calculateWeeklyProductivity,
  calculateRealChange,
} from "@/lib/utils"

// GET /api/analytics - Get comprehensive analytics data for current workspace
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30d"

    // Get current workspace ID
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()

    // Calculate date ranges based on timeRange
    const now = new Date()
    let startDate: Date
    let previousStartDate: Date

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        previousStartDate = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000)
    }

    // Fetch current period tasks (filtered by workspace)
    const currentTasks = await db
      .collection("tasks")
      .find({
        workspaceId: currentWorkspaceId,
        createdAt: { $gte: startDate.toISOString() },
      })
      .toArray()

    // Fetch previous period tasks for comparison (filtered by workspace)
    const previousTasks = await db
      .collection("tasks")
      .find({
        workspaceId: currentWorkspaceId,
        createdAt: {
          $gte: previousStartDate.toISOString(),
          $lt: startDate.toISOString(),
        },
      })
      .toArray()

    // Fetch all projects for current workspace
    const projects = await db.collection("projects").find({ workspaceId: currentWorkspaceId }).toArray()

    // Fetch previous period projects for comparison
    const previousProjects = await db
      .collection("projects")
      .find({
        workspaceId: currentWorkspaceId,
        createdAt: {
          $gte: previousStartDate.toISOString(),
          $lt: startDate.toISOString(),
        },
      })
      .toArray()

    // Fetch workspace users only
    const workspaceCollection = db.collection("workspaces")
    const workspace = await workspaceCollection.findOne({ id: currentWorkspaceId })
    const workspaceUserIds = workspace?.members?.map((member: any) => member.memberId) || []

    const users = await db
      .collection("users")
      .find({ id: { $in: workspaceUserIds } })
      .project({ id: 1, username: 1, email: 1 })
      .toArray()

    // Calculate productivity data
    const dailyProductivity = calculateDailyProductivity(currentTasks, startDate, now)
    const weeklyProductivity = calculateWeeklyProductivity(currentTasks, startDate)
    const monthlyProductivity = calculateMonthlyProductivity(currentTasks, startDate)

    // Calculate team performance (real values only)
    const teamPerformance = calculateTeamPerformance(currentTasks, users)
    const teamWorkload = calculateTeamWorkload(currentTasks, users)

    // Calculate task trends (real values only)
    const taskTrends = calculateTaskTrends(currentTasks)

    // Calculate project timeline (real values only)
    const projectTimeline = calculateProjectTimeline(projects, currentTasks)

    // Calculate key metrics
    const totalTasks = currentTasks.length
    const completedTasks = currentTasks.filter((task) => task.status === Status.Completed).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const activeProjects = projects.filter((project) => project.status === "active").length

    // Calculate team efficiency (real values only)
    const teamEfficiency = calculateTeamEfficiency(currentTasks, users)

    // Calculate real changes
    const tasksChange = calculateRealChange(currentTasks.length, previousTasks.length)
    const previousCompletedTasks = previousTasks.filter((task) => task.status === Status.Completed).length
    const previousCompletionRate =
      previousTasks.length > 0 ? Math.round((previousCompletedTasks / previousTasks.length) * 100) : 0
    const completionChange = calculateRealChange(completionRate, previousCompletionRate)

    const previousTeamEfficiency = calculateTeamEfficiency(previousTasks, users)
    const efficiencyChange = calculateRealChange(teamEfficiency, previousTeamEfficiency)

    const previousActiveProjects = previousProjects.filter((project) => project.status === "active").length
    const projectsChange = calculateRealChange(activeProjects, previousActiveProjects)

    const analyticsData = {
      keyMetrics: {
        totalTasks,
        completionRate,
        teamEfficiency,
        activeProjects,
        tasksChange,
        completionChange,
        efficiencyChange,
        projectsChange,
      },
      productivity: {
        daily: dailyProductivity,
        weekly: weeklyProductivity,
        monthly: monthlyProductivity,
      },
      projects: {
        timeline: projectTimeline,
      },
      team: {
        performance: teamPerformance,
        workload: teamWorkload,
      },
      trends: taskTrends,
    }

    return NextResponse.json({
      success: true,
      data: analyticsData,
      message: "Analytics data retrieved successfully",
    })
  } catch (error) {
    console.error("Analytics error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
