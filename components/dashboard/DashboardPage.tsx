"use client"
import { Target, Clock, Activity, ArrowUp, FolderOpen, Filter, CheckCircle, Zap, Award, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts"
import { useState } from "react"
import type { DashboardPageStats, DashboardStats, User as UserType } from "@/lib/types"
import { getProgressColor, getProgressTextColor } from "../../lib/utils"

// Time-based stats data
const TIME_STATS_DATA = [
  {
    id: "today",
    label: "TODAY",
    subtitle: "Tasks completed today",
    color: "from-blue-500 to-blue-600",
    iconBg: "bg-blue-400",
    icon: Clock,
    footerIcon: Clock,
    footerText: "Updated just now",
  },
  {
    id: "week",
    label: "THIS WEEK",
    subtitle: "Tasks completed this week",
    color: "from-purple-500 to-purple-600",
    iconBg: "bg-purple-400",
    icon: Activity,
    footerIcon: Activity,
    footerText: "Weekly performance",
  },
  {
    id: "month",
    label: "THIS MONTH",
    subtitle: "Tasks completed this month",
    color: "from-emerald-500 to-emerald-600",
    iconBg: "bg-emerald-400",
    icon: Target,
    footerIcon: Target,
    footerText: "Monthly performance",
  },
]

interface DashboardPageProps {
  user: UserType
  dashboardData: DashboardStats
  taskStats: DashboardPageStats
  onLoadMoreTasks: () => void
  loadingMoreTasks: boolean
}

export default function DashboardPage({
  user,
  dashboardData,
  taskStats,
  onLoadMoreTasks,
  loadingMoreTasks,
}: DashboardPageProps) {
  const [projectStatusFilter, setProjectStatusFilter] = useState("all")
  const [taskStatusFilter, setTaskStatusFilter] = useState("all")

  // Project status distribution data
  const projectStatusData = [
    {
      name: "Completed",
      value: dashboardData.completedProjects,
      color: "#22c55e",
    },
    { name: "Ongoing", value: dashboardData.ongoingProjects, color: "#3b82f6" },
    { name: "Delayed", value: dashboardData.delayedProjects, color: "#ef4444" },
  ].filter((item) => item.value > 0)

  // Filter projects based on status
  const filteredProjects =
    projectStatusFilter === "all"
      ? dashboardData.projectsSummary
      : dashboardData.projectsSummary.filter((project) => project.status === projectStatusFilter)

  // Filter tasks based on status
  const filteredTasks =
    taskStatusFilter === "all"
      ? dashboardData.todayTasks
      : dashboardData.todayTasks.filter((task) => task.status === taskStatusFilter)

  // Time-based stats data
  const timeBasedData = [
    { name: "Jan", tasks: 65, projects: 8 },
    { name: "Feb", tasks: 78, projects: 12 },
    { name: "Mar", tasks: 90, projects: 15 },
    { name: "Apr", tasks: 81, projects: 18 },
    { name: "May", tasks: 95, projects: 22 },
    { name: "Jun", tasks: 88, projects: 20 },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200"
      case "ongoing":
        return "bg-blue-100 text-blue-800 border-blue-200"
      case "delayed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-800"
      case "In Progress":
        return "bg-blue-100 text-blue-800"
      case "Under Review":
        return "bg-yellow-100 text-yellow-800"
      case "To Do":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No due date"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  // Create stats object to match the format expected by the original design
  const stats = {
    totalTasks: dashboardData.totalTasks,
    completedTasks: dashboardData.completedTasks,
    inProgressTasks: dashboardData.inProgressTasks,
    todoTasks: dashboardData.todoTasks,
    todayCompletedTasks: taskStats.todayCompletedTasks,
    weekCompletedTasks: taskStats.weekCompletedTasks,
    monthCompletedTasks: taskStats.monthCompletedTasks,
    projectsCount: dashboardData.totalProjects,
    completionRate: dashboardData.projectsCompletionRate,
  }

  return (
    <>
      <div className="px-6 py-4 bg-white border-b border-gray-200 z-50 fixed w-full">
        <div className="flex items-center space-x-2">
          <BarChart3 size={16} />
          <h1 className="text-lg">Dashboard</h1>
        </div>
      </div>
      <div className="py-8 mt-14 px-4 space-y-8 bg-gray-50 min-h-screen">
        {/* Breadcrumb */}

        {/* Stats Cards - Original Design */}
        <div className="grid grid-cols-1 md:grid-cols-12 lg:grid-cols-12 gap-3">
          {/* Total Tasks Card - Enhanced Design */}
          <Card className="bg-white md:col-span-3 shadow-sm hover:shadow-md transition-shadow border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-5 pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">TOTAL TASKS</h3>
                    <div className="bg-blue-100 p-2 rounded-full">
                      <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <p className="text-4xl font-bold text-gray-900">{stats.totalTasks}</p>
                    <div className="ml-3 flex items-center text-xs font-medium text-green-600">
                      <ArrowUp className="w-3 h-3 mr-0.5" />
                      <span>All time</span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto p-5 pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-500">Project completion</span>
                    <span className={`text-xs font-bold ${getProgressTextColor(stats.completionRate)}`}>
                      {stats.completionRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${getProgressColor(stats.completionRate)}`}
                      style={{ width: `${stats.completionRate}%` }}
                    ></div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></div>
                      <span className="text-xs text-gray-500">Active</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5"></div>
                      <span className="text-xs text-gray-500">Completed</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Completed Tasks Card - Enhanced Design */}
          <Card className="bg-white shadow-sm md:col-span-3 hover:shadow-md transition-shadow border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col space-y-3 h-full">
                <div className="p-5 pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">COMPLETED</h3>
                    <div className="bg-green-100 p-2 rounded-full">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <p className="text-4xl font-bold text-gray-900">{stats.completedTasks}</p>
                    <div className="ml-3 flex items-center text-xs font-medium text-green-600">
                      <span className="flex items-center">
                        <CheckCircle className="w-3 h-3 mr-0.5" />
                        {stats.completionRate}% completion rate
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="px-5 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-t border-green-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="w-4 h-4 text-green-600 mr-1.5" />
                        <span className="text-xs font-medium text-green-700">completed!</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-600 mr-1">Today:</span>
                        <span className="text-xs font-bold text-green-700">+{stats.todayCompletedTasks}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center">
                      <div className="flex-1 h-1.5 bg-white rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                          style={{ width: `${stats.completionRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-xs font-medium text-green-700">{stats.completionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Projects Card - Enhanced Design */}
          <Card className="bg-white shadow-sm md:col-span-3 hover:shadow-md transition-shadow border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-5 pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">TOTAL PROJECTS</h3>
                    <div className="bg-purple-100 p-2 rounded-full">
                      <FolderOpen className="w-4 h-4 text-purple-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <p className="text-4xl font-bold text-gray-900">{stats.projectsCount}</p>
                    <div className="ml-3 flex items-center text-xs font-medium text-purple-600">
                      <span className="flex items-center">
                        <ArrowUp className="w-3 h-3 mr-0.5" />
                        Active projects
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="px-5 py-3 mt-3">
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-400 to-purple-300 flex items-center justify-center">
                          <FolderOpen className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-white"></div>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-gray-700">Project insights</p>
                        <p className="text-xs text-gray-500">View all projects</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* In Progress Tasks Card - Enhanced Design */}
          <Card className="bg-white shadow-sm md:col-span-3 hover:shadow-md transition-shadow border-none overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col h-full">
                <div className="p-5 pb-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide">IN PROGRESS</h3>
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline">
                    <p className="text-4xl font-bold text-gray-900">{stats.inProgressTasks}</p>
                    <div className="ml-3 flex items-center text-xs font-medium text-amber-600">
                      <span className="flex items-center">
                        <Zap className="w-3 h-3 mr-0.5" />
                        Active tasks
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-auto">
                  <div className="px-5 py-3 mt-3">
                    <div className="flex items-center space-x-2">
                      {stats.inProgressTasks > 0 ? (
                        <>
                          <div className="relative flex-shrink-0">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 flex items-center justify-center">
                              <Clock className="w-4 h-4 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-white"></div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">Tasks need attention</p>
                            <p className="text-xs text-gray-500">Due soon</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                            <CheckCircle className="w-4 h-4 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-700">No active tasks</p>
                            <p className="text-xs text-gray-500">All caught up!</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Project Summary - Made Scrollable */}
          <Card className="lg:col-span-2 bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
              <CardTitle className="text-xl font-bold text-gray-900">Project Summary</CardTitle>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-gray-400" />
                <Select value={projectStatusFilter} onValueChange={setProjectStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="delayed">Delayed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                <div className="p-6 space-y-4">
                  {/* Table Header */}
                  <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-600 border-b border-gray-100 pb-3">
                    <div className="col-span-3">Project Name</div>
                    <div className="col-span-2">Manager</div>
                    <div className="col-span-2">Due Date</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-3">Progress</div>
                  </div>

                  {/* Project Rows */}
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="grid grid-cols-12 gap-4 items-center py-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="col-span-3">
                        <p className="font-semibold text-gray-900 truncate">{project.name}</p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              {project.projectManager.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700 truncate">{project.projectManager.username}</span>
                        </div>
                      </div>
                      <div className="col-span-2">
                        <span className="text-sm text-gray-600">{formatDate(project.dueDate)}</span>
                      </div>
                      <div className="col-span-2">
                        <Badge className={`text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="col-span-3">
                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <Progress value={project.completionRate} className="h-2" />
                          </div>
                          <span className="text-sm font-semibold text-gray-700 min-w-[3rem]">
                            {project.completionRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredProjects.length === 0 && (
                    <div className="text-center py-8">
                      <p className="text-gray-500">No projects found for the selected status</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overall Progress */}
          <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
            <CardHeader className="border-b border-gray-100">
              <CardTitle className="text-xl font-bold text-gray-900">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Circular Progress Chart */}
                <div className="relative">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={projectStatusData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {projectStatusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-gray-900">{dashboardData.projectsCompletionRate}%</p>
                      <p className="text-sm text-gray-500">Completed</p>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="flex flex-wrap gap-4 justify-center">
                  <div className=" ">
                    <p className="text-2xl font-bold text-gray-900">{dashboardData.totalProjects}</p>
                    <p className="text-xs text-gray-600">Total Projects</p>
                  </div>
                  <div className="  ">
                    <p className="text-2xl font-bold text-green-600">{dashboardData.completedProjects}</p>
                    <p className="text-xs text-gray-600">Completed</p>
                  </div>
                  <div className="  ">
                    <p className="text-2xl font-bold text-red-600">{dashboardData.delayedProjects}</p>
                    <p className="text-xs text-gray-600">Delayed</p>
                  </div>
                  <div className=" ">
                    <p className="text-2xl font-bold text-blue-600">{dashboardData.ongoingProjects}</p>
                    <p className="text-xs text-gray-600">Ongoing</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today Tasks - Made Scrollable */}
        <Card className="bg-white shadow-lg border-0 rounded-xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-4">
            <CardTitle className="text-xl font-bold text-gray-900">Today's Tasks</CardTitle>
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-gray-400" />
              <Select value={taskStatusFilter} onValueChange={setTaskStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="To Do">To Do</SelectItem>
                  <SelectItem value="In Progress">In Progress</SelectItem>
                  <SelectItem value="Under Review">Under Review</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              <div className="p-6 space-y-4">
                {filteredTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                  >
                    {/* Completion Status Indicator */}
                    <div className="flex-shrink-0">
                      {task.status === "Completed" ? (
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white fill-current" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 bg-white"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate ${
                          task.status === "Completed" ? "text-gray-500 line-through" : "text-gray-900"
                        }`}
                      >
                        {task.title}
                      </p>
                      {task.description && (
                        <p
                          className={`text-sm truncate mt-1 ${
                            task.status === "Completed" ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {task.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {task.assignee && (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={task.assignee.profilePictureUrl || "/placeholder.svg"} />
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                              {task.assignee.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-gray-700">{task.assignee.username}</span>
                        </div>
                      )}

                      <Badge className={`text-xs font-medium ${getTaskStatusColor(task.status)}`}>{task.status}</Badge>
                    </div>
                  </div>
                ))}

                {filteredTasks.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tasks found for the selected status</p>
                  </div>
                )}

                {dashboardData.hasMoreTasks && taskStatusFilter === "all" && (
                  <div className="text-center pt-4">
                    <Button variant="outline" onClick={onLoadMoreTasks} disabled={loadingMoreTasks}>
                      {loadingMoreTasks ? "Loading..." : "Load More Tasks"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Time-based Stats - Original Design */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TIME_STATS_DATA.map((timeStat, index) => (
            <Card
              key={timeStat.id}
              className={`bg-gradient-to-r ${timeStat.color} text-white shadow-lg border-none overflow-hidden`}
            >
              <CardContent className="p-6 relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="flex items-center justify-between relative z-10">
                  <div>
                    <p className="text-white/80 text-sm uppercase tracking-wide">{timeStat.label}</p>
                    <p className="text-2xl font-bold mt-1">
                      {index === 0
                        ? stats.todayCompletedTasks
                        : index === 1
                          ? stats.weekCompletedTasks
                          : stats.monthCompletedTasks}
                    </p>
                    <p className="text-white/80 text-sm mt-1">{timeStat.subtitle}</p>
                  </div>
                  <div className={`${timeStat.iconBg} p-3 rounded-lg`}>
                    <timeStat.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center space-x-1 text-white/70 relative z-10">
                  <timeStat.footerIcon className="w-4 h-4" />
                  <span className="text-xs">{timeStat.footerText}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </>
  )
}
