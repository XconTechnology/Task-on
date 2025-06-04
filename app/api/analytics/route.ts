import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { Status } from "@/lib/types"
import { calculateChange, calculateDailyProductivity, calculateMonthlyProductivity, calculateProjectTimeline, calculateTaskTrends, calculateTeamEfficiency, calculateTeamPerformance, calculateTeamWorkload, calculateWeeklyProductivity } from "@/lib/utils"

// GET /api/analytics - Get comprehensive analytics data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get("timeRange") || "30d"

    const db = await getDatabase()

    // Calculate date ranges based on timeRange
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "30d":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    // Fetch all tasks within the time range
    const tasks = await db
      .collection("tasks")
      .find({
        createdAt: { $gte: startDate.toISOString() },
      })
      .toArray()

    // Fetch all projects
    const projects = await db.collection("projects").find({}).toArray()

    // Fetch all users for team analytics
    const users = await db.collection("users").find({}).project({ id: 1, username: 1, email: 1 }).toArray()

    // Calculate productivity data (daily)
    const dailyProductivity = calculateDailyProductivity(tasks, startDate, now)

    // Calculate weekly productivity
    const weeklyProductivity = calculateWeeklyProductivity(tasks, startDate)

    // Calculate monthly productivity
    const monthlyProductivity = calculateMonthlyProductivity(tasks, startDate)

    // Calculate team performance
    const teamPerformance = calculateTeamPerformance(tasks, users)

    // Calculate task trends
    const taskTrends = calculateTaskTrends(tasks)

    // Calculate key metrics
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === Status.Completed).length
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const activeProjects = projects.filter((project) => project.status === "active").length

    // Calculate team efficiency (average completion rate per user)
    const teamEfficiency = calculateTeamEfficiency(tasks, users)

    const analyticsData = {
      keyMetrics: {
        totalTasks,
        completionRate,
        teamEfficiency,
        activeProjects,
        tasksChange: calculateChange(tasks, "tasks", timeRange),
        completionChange: calculateChange(tasks, "completion", timeRange),
        efficiencyChange: "+3%", // This would need historical data to calculate properly
        projectsChange: `+${Math.max(0, activeProjects - 6)}`,
      },
      productivity: {
        daily: dailyProductivity,
        weekly: weeklyProductivity,
        monthly: monthlyProductivity,
      },
      projects: {
        timeline: calculateProjectTimeline(projects),
      },
      team: {
        performance: teamPerformance,
        workload: calculateTeamWorkload(tasks, users),
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
