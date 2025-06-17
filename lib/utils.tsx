import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Priority, Status, type Task } from "./types"
import { Activity, CheckCircle2, Play, Target, Timer } from "lucide-react"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getArray<T>(data: unknown): T[] {
  return Array.isArray(data) ? data : []
}

// Generate monthly activity data
export const generateMonthlyActivity = (tasks: Task[]) => {
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthData = []

  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(now.getFullYear(), now.getMonth(), i)
    date.setHours(0, 0, 0, 0)
    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)

    const dayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.updatedAt)
      return task.status === Status.Completed && taskDate >= date && taskDate < nextDay
    }).length

    monthData.push({
      date: `${i}`,
      tasks: dayTasks,
    })
  }

  return monthData
}

// Generate weekly activity data
export const generateWeeklyActivity = (tasks: any[]) => {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const now = new Date()
  const weekData = days.map((day, index) => {
    const date = new Date(now)
    date.setDate(now.getDate() - now.getDay() + index)
    date.setHours(0, 0, 0, 0)

    const nextDay = new Date(date)
    nextDay.setDate(date.getDate() + 1)

    const dayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.updatedAt)
      return task.status === Status.Completed && taskDate >= date && taskDate < nextDay
    }).length

    return {
      day,
      date: date.toISOString().split("T")[0],
      tasks: dayTasks,
    }
  })

  return weekData
}

// Helper functions
export function calculateDailyProductivity(tasks: any[], startDate: Date, endDate: Date) {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const dailyData = []

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const dateStr = date.toISOString().split("T")[0]

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    const completed = tasks.filter((task) => {
      const updatedAt = new Date(task.updatedAt)
      return task.status === Status.Completed && updatedAt >= dayStart && updatedAt <= dayEnd
    }).length

    const created = tasks.filter((task) => {
      const createdAt = new Date(task.createdAt)
      return createdAt >= dayStart && createdAt <= dayEnd
    }).length

    dailyData.push({
      date: dateStr,
      completed,
      created,
    })
  }

  return dailyData
}

export function calculateWeeklyProductivity(tasks: any[], startDate: Date) {
  const weeks = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7))
  const weeklyData = []

  for (let i = 0; i < Math.min(weeks, 12); i++) {
    const weekStart = new Date(startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000)
    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000)

    const weekTasks = tasks.filter((task) => {
      const createdAt = new Date(task.createdAt)
      return createdAt >= weekStart && createdAt < weekEnd
    })

    const completedTasks = weekTasks.filter((task) => task.status === Status.Completed).length
    const productivity = weekTasks.length > 0 ? Math.round((completedTasks / weekTasks.length) * 100) : 0

    weeklyData.push({
      week: `Week ${i + 1}`,
      productivity,
    })
  }

  return weeklyData
}

export function calculateMonthlyProductivity(tasks: any[], startDate: Date) {
  const months = Math.ceil((Date.now() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30))
  const monthlyData = []

  for (let i = 0; i < Math.min(months, 6); i++) {
    const monthStart = new Date(startDate.getTime() + i * 30 * 24 * 60 * 60 * 1000)
    const monthEnd = new Date(monthStart.getTime() + 30 * 24 * 60 * 60 * 1000)

    const monthTasks = tasks.filter((task) => {
      const createdAt = new Date(task.createdAt)
      return createdAt >= monthStart && createdAt < monthEnd
    })

    const monthName = monthStart.toLocaleDateString("en-US", {
      month: "short",
    })

    monthlyData.push({
      month: monthName,
      tasks: monthTasks.length,
      hours: Math.floor(monthTasks.length * 2.5), // Estimate 2.5 hours per task
    })
  }

  return monthlyData
}

// FIXED: Real values only, no mockup data
export function calculateTeamPerformance(tasks: any[], users: any[]) {
  if (!users || users.length === 0) {
    return [] // Return empty array instead of mockup data
  }

  const teamData = users.map((user) => {
    const userTasks = tasks.filter((task) => task.assignedTo === user.id || task.createdBy === user.id)
    const completedTasks = userTasks.filter((task) => task.status === Status.Completed).length
    const efficiency = userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0

    return {
      member: user.username || `User ${user.id.substring(0, 5)}`,
      tasks: completedTasks, // Real value, no fallback
      efficiency: efficiency, // Real value, no fallback
    }
  })

  return teamData
}

// FIXED: Real values only, no mockup data
export function calculateTeamWorkload(tasks: any[], users: any[]) {
  if (!users || users.length === 0) {
    return [] // Return empty array instead of mockup data
  }

  const workloadData = users.map((user) => {
    const assignedTasks = tasks.filter((task) => task.assignedTo === user.id)
    const completedTasks = assignedTasks.filter((task) => task.status === Status.Completed)

    return {
      member: user.username || `User ${user.id.substring(0, 5)}`,
      assigned: assignedTasks.length, // Real value, no fallback
      completed: completedTasks.length, // Real value, no fallback
    }
  })

  return workloadData
}

// FIXED: Real values only, no mockup data
export function calculateTaskTrends(tasks: any[]) {
  if (!tasks || tasks.length === 0) {
    return {
      taskTypes: [],
      priorities: [],
      statuses: [],
    }
  }

  // Task types based on actual task titles
  const taskTypes = [
    {
      type: "Feature",
      count: tasks.filter((t) => t.title?.toLowerCase().includes("feature")).length,
      color: "#4f46e5",
    },
    {
      type: "Bug Fix",
      count: tasks.filter((t) => t.title?.toLowerCase().includes("bug")).length,
      color: "#ef4444",
    },
    {
      type: "Enhancement",
      count: tasks.filter((t) => t.title?.toLowerCase().includes("enhance")).length,
      color: "#0ea5e9",
    },
    {
      type: "Documentation",
      count: tasks.filter((t) => t.title?.toLowerCase().includes("doc")).length,
      color: "#f97316",
    },
  ].filter((t) => t.count > 0) // Only include types with actual tasks

  // Priority distribution - real values only
  const priorities = [
    {
      priority: "Urgent",
      count: tasks.filter((t) => t.priority === Priority.Urgent).length,
      color: "#ef4444",
    },
    {
      priority: "High",
      count: tasks.filter((t) => t.priority === Priority.High).length,
      color: "#f97316",
    },
    {
      priority: "Medium",
      count: tasks.filter((t) => t.priority === Priority.Medium).length,
      color: "#eab308",
    },
    {
      priority: "Low",
      count: tasks.filter((t) => t.priority === Priority.Low).length,
      color: "#22c55e",
    },
    {
      priority: "Backlog",
      count: tasks.filter((t) => t.priority === Priority.Backlog).length,
      color: "#6b7280",
    },
  ].filter((p) => p.count > 0) // Only include priorities with actual tasks

  // Status distribution - real values only
  const statuses = [
    {
      status: "Completed",
      count: tasks.filter((t) => t.status === Status.Completed).length,
      color: "#22c55e",
    },
    {
      status: "In Progress",
      count: tasks.filter((t) => t.status === Status.WorkInProgress).length,
      color: "#3b82f6",
    },
    {
      status: "To Do",
      count: tasks.filter((t) => t.status === Status.ToDo).length,
      color: "#6b7280",
    },
    {
      status: "Under Review",
      count: tasks.filter((t) => t.status === Status.UnderReview).length,
      color: "#f59e0b",
    },
  ].filter((s) => s.count > 0) // Only include statuses with actual tasks

  return {
    taskTypes,
    priorities,
    statuses,
  }
}

// FIXED: Real project timeline calculation
export function calculateProjectTimeline(projects: any[], tasks: any[]) {
  if (!projects || projects.length === 0) {
    return [] // Return empty array instead of mockup data
  }

  return projects.slice(0, 4).map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id)
    const completedTasks = projectTasks.filter((task) => task.status === Status.Completed)
    const actual = projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0

    return {
      project: project.name?.substring(0, 10) || `Project ${project.id.substring(0, 5)}`,
      planned: 100, // Assuming 100% is the target
      actual: actual, // Real completion percentage
    }
  })
}

// FIXED: Real team efficiency calculation
export function calculateTeamEfficiency(tasks: any[], users: any[]) {
  if (!users || users.length === 0 || !tasks || tasks.length === 0) {
    return 0 // Return 0 instead of default value
  }

  const efficiencies = users.map((user) => {
    const userTasks = tasks.filter((task) => task.assignedTo === user.id)
    const completedTasks = userTasks.filter((task) => task.status === Status.Completed)
    return userTasks.length > 0 ? (completedTasks.length / userTasks.length) * 100 : 0
  })

  return efficiencies.length > 0 ? Math.round(efficiencies.reduce((a, b) => a + b, 0) / efficiencies.length) : 0
}

// NEW: Calculate real percentage change between current and previous periods
export function calculateRealChange(currentValue: number, previousValue: number): string {
  if (previousValue === 0) {
    return currentValue > 0 ? "+100%" : "0%"
  }

  const change = ((currentValue - previousValue) / previousValue) * 100
  const roundedChange = Math.round(change)

  if (roundedChange > 0) {
    return `+${roundedChange}%`
  } else if (roundedChange < 0) {
    return `${roundedChange}%`
  } else {
    return "0%"
  }
}

// Keep all your existing utility functions below...
export const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

  if (diffInMinutes < 1) return "Just now"
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
  if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
  return date.toLocaleDateString()
}

export function getProgressColor(progress: number): string {
  if (progress < 25) {
    return "from-red-500 to-red-400"
  } else if (progress < 50) {
    return "from-amber-500 to-amber-400"
  } else if (progress < 75) {
    return "from-blue-500 to-blue-400"
  } else if (progress < 90) {
    return "from-emerald-500 to-emerald-400"
  } else {
    return "from-green-500 to-green-400"
  }
}

export function getProgressTextColor(progress: number): string {
  if (progress < 25) {
    return "text-red-600"
  } else if (progress < 50) {
    return "text-amber-600"
  } else if (progress < 75) {
    return "text-blue-600"
  } else if (progress < 90) {
    return "text-emerald-600"
  } else {
    return "text-green-600"
  }
}

export function getProgressBgColor(progress: number): string {
  if (progress < 25) {
    return "bg-red-50"
  } else if (progress < 50) {
    return "bg-amber-50"
  } else if (progress < 75) {
    return "bg-blue-50"
  } else if (progress < 90) {
    return "bg-emerald-50"
  } else {
    return "bg-green-50"
  }
}

export function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  } else {
    return `${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }
}

export function formatHours(seconds: number): string {
  const hours = seconds / 3600
  return `${hours.toFixed(1)}h`
}

export const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export const getActivityIcon = (type: string) => {
  switch (type) {
    case "task_completed":
      return <CheckCircle2 className="w-4 h-4 text-green-500" />
    case "task_created":
      return <Target className="w-4 h-4 text-blue-500" />
    case "time_tracked":
      return <Timer className="w-4 h-4 text-purple-500" />
    case "task_started":
      return <Play className="w-4 h-4 text-orange-500" />
    default:
      return <Activity className="w-4 h-4 text-gray-500" />
  }
}

export const getStatusColor = (status: string) => {
  switch (status) {
    case "Completed":
      return "bg-green-100 text-green-700 border-green-200"
    case "In Progress":
      return "bg-blue-100 text-blue-700 border-blue-200"
    case "Under Review":
      return "bg-yellow-100 text-yellow-700 border-yellow-200"
    default:
      return "bg-gray-100 text-gray-700 border-gray-200"
  }
}

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "Urgent":
      return "bg-red-500"
    case "High":
      return "bg-orange-500"
    case "Medium":
      return "bg-yellow-500"
    case "Low":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}
