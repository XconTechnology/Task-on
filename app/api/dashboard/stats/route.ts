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


    return NextResponse.json({
      success: true,
      data: {
        todayCompletedTasks,
        weekCompletedTasks,
        monthCompletedTasks,
      },
    })
  } catch (error) {
    console.error("Dashboard stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
