import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const projectsCollection = db.collection("projects")
    const usersCollection = db.collection("users")

    // Get user's workspace
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get current date ranges
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(startOfDay)
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay())
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get all tasks for the user
    const allTasks = await tasksCollection
      .find({
        $or: [{ authorUserId: user.userId }, { assignedUserId: user.userId }],
      })
      .toArray()

    // Calculate stats
    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter((task) => task.status === "Completed").length
    const inProgressTasks = allTasks.filter((task) => task.status === "In Progress").length
    const todoTasks = allTasks.filter((task) => task.status === "To Do").length

    // Today's completed tasks
    const todayCompletedTasks = allTasks.filter(
      (task) => task.status === "Completed" && new Date(task.updatedAt) >= startOfDay,
    ).length

    // This week's completed tasks
    const weekCompletedTasks = allTasks.filter(
      (task) => task.status === "Completed" && new Date(task.updatedAt) >= startOfWeek,
    ).length

    // This month's completed tasks
    const monthCompletedTasks = allTasks.filter(
      (task) => task.status === "Completed" && new Date(task.updatedAt) >= startOfMonth,
    ).length

    // Get projects count
    const projectsCount = await projectsCollection.countDocuments({ workspaceId: userData.workspaceId })

    // Calculate completion rate
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    // Generate weekly activity data (last 7 days)
    const weeklyActivity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(startOfDay)
      date.setDate(startOfDay.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      const dayTasks = allTasks.filter(
        (task) =>
          task.status === "Completed" && new Date(task.updatedAt) >= date && new Date(task.updatedAt) < nextDate,
      ).length

      weeklyActivity.push({
        date: date.toISOString().split("T")[0],
        tasks: dayTasks,
        day: date.toLocaleDateString("en-US", { weekday: "short" }),
      })
    }

    // Generate monthly activity data (last 30 days)
    const monthlyActivity = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(startOfDay)
      date.setDate(startOfDay.getDate() - i)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      const dayTasks = allTasks.filter(
        (task) =>
          task.status === "Completed" && new Date(task.updatedAt) >= date && new Date(task.updatedAt) < nextDate,
      ).length

      monthlyActivity.push({
        date: date.toISOString().split("T")[0],
        tasks: dayTasks,
      })
    }

    // Priority distribution
    const priorityStats = {
      urgent: allTasks.filter((task) => task.priority === "Urgent").length,
      high: allTasks.filter((task) => task.priority === "High").length,
      medium: allTasks.filter((task) => task.priority === "Medium").length,
      low: allTasks.filter((task) => task.priority === "Low").length,
      backlog: allTasks.filter((task) => task.priority === "Backlog").length,
    }

    return NextResponse.json({
      success: true,
      data: {
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        todayCompletedTasks,
        weekCompletedTasks,
        monthCompletedTasks,
        projectsCount,
        completionRate,
        weeklyActivity,
        monthlyActivity,
        priorityStats,
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
