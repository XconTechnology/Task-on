"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/lib/user-context"
import { TrendingUp, CheckCircle, Clock, Target, Calendar, Award, Zap, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  COLORS,
} from "@/components/ui/chart"

interface DashboardStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  todayCompletedTasks: number
  weekCompletedTasks: number
  monthCompletedTasks: number
  projectsCount: number
  completionRate: number
  weeklyActivity: Array<{ date: string; tasks: number; day: string }>
  monthlyActivity: Array<{ date: string; tasks: number }>
  priorityStats: {
    urgent: number
    high: number
    medium: number
    low: number
    backlog: number
  }
}

export default function DashboardContent() {
  const { user } = useUser()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/dashboard/stats")
        const data = await response.json()

        if (data.success) {
          setStats(data.data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="header-medium mb-2">Welcome to ProjectFlow!</h2>
          <p className="text-description">Start by creating your first project to see your dashboard analytics.</p>
        </div>
      </div>
    )
  }

  // Motivational message based on today's performance
  const getMotivationalMessage = () => {
    if (stats.todayCompletedTasks >= 5) {
      return {
        type: "celebration",
        title: "Congratulations! 🎉",
        message: `Amazing work! You've completed ${stats.todayCompletedTasks} tasks today. You're on fire!`,
        icon: "🔥",
        color: "from-green-500 to-emerald-600",
      }
    } else if (stats.todayCompletedTasks >= 3) {
      return {
        type: "good",
        title: "Great Progress! 👏",
        message: `You've completed ${stats.todayCompletedTasks} tasks today. Keep up the excellent work!`,
        icon: "⭐",
        color: "from-blue-500 to-cyan-600",
      }
    } else if (stats.todayCompletedTasks >= 1) {
      return {
        type: "encouraging",
        title: "Good Start! 💪",
        message: `You've completed ${stats.todayCompletedTasks} task${stats.todayCompletedTasks > 1 ? "s" : ""} today. Every step counts!`,
        icon: "🚀",
        color: "from-purple-500 to-pink-600",
      }
    } else {
      return {
        type: "motivational",
        title: "Ready to Conquer? ⚡",
        message: "Today is full of possibilities! Start with one task and build momentum.",
        icon: "💎",
        color: "from-orange-500 to-red-600",
      }
    }
  }

  const motivationalMessage = getMotivationalMessage()

  // Prepare chart data
  const priorityChartData = [
    { name: "Urgent", value: stats.priorityStats.urgent, color: COLORS.danger },
    { name: "High", value: stats.priorityStats.high, color: COLORS.accent },
    { name: "Medium", value: stats.priorityStats.medium, color: COLORS.primary },
    { name: "Low", value: stats.priorityStats.low, color: COLORS.secondary },
    { name: "Backlog", value: stats.priorityStats.backlog, color: "#6B7280" },
  ].filter((item) => item.value > 0)

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="header-large">Dashboard</h1>
          <p className="text-description mt-1">
            Welcome back, {user?.username}! Here's what's happening with your projects.
          </p>
        </div>
        <div className="text-right">
          <p className="text-muted-small">Last updated</p>
          <p className="text-medium font-medium">{new Date().toLocaleDateString()}</p>
        </div>
      </div>

      {/* Motivational Banner */}
      <Card className={`bg-gradient-to-r ${motivationalMessage.color} text-white border-0 shadow-lg`}>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{motivationalMessage.icon}</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1">{motivationalMessage.title}</h3>
              <p className="text-white/90">{motivationalMessage.message}</p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Award className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-small uppercase tracking-wide">Total Tasks</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTasks}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-small text-green-600">All time</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-small uppercase tracking-wide">Completed</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completedTasks}</p>
                <div className="flex items-center mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-small text-green-600">{stats.completionRate}% completion rate</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-small uppercase tracking-wide">In Progress</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.inProgressTasks}</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-small text-orange-600">Active tasks</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-small uppercase tracking-wide">Projects</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.projectsCount}</p>
                <div className="flex items-center mt-2">
                  <Target className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-small text-purple-600">Active projects</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Weekly Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer>
                <BarChart data={stats.weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <ChartTooltip />
                  <Bar dataKey="tasks" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Priority Distribution */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-purple-600" />
              <span>Task Priority Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer>
                <PieChart>
                  <Pie
                    data={priorityChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {priorityChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ChartContainer>
            </div>
            <div className="flex flex-wrap gap-4 mt-4">
              {priorityChartData.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-small text-gray-600">
                    {item.name} ({item.value})
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span>30-Day Task Completion Trend</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ChartContainer>
              <LineChart data={stats.monthlyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  stroke={COLORS.secondary}
                  strokeWidth={3}
                  dot={{ fill: COLORS.secondary, strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: COLORS.secondary, strokeWidth: 2 }}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-small uppercase tracking-wide">Today</p>
                <p className="text-2xl font-bold">{stats.todayCompletedTasks} Tasks</p>
                <p className="text-blue-100 text-small">Completed today</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-small uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-bold">{stats.weekCompletedTasks} Tasks</p>
                <p className="text-green-100 text-small">Completed this week</p>
              </div>
              <Zap className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-small uppercase tracking-wide">This Month</p>
                <p className="text-2xl font-bold">{stats.monthCompletedTasks} Tasks</p>
                <p className="text-purple-100 text-small">Completed this month</p>
              </div>
              <Award className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
