"use client"

import type React from "react"

import {
  User,
  Calendar,
  Clock,
  Trophy,
  Target,
  Briefcase,
  Activity,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatTime, getActivityIcon, getInitials, getPriorityColor, getStatusColor } from "@/lib/utils"
import { TimeframeFilter } from "./timeframe-filter"

interface ProfileContentProps {
  user: {
    username: string
    email: string
    profilePictureUrl?: string
    createdAt: string | Date
  }
  stats: {
    totalTasks: number
    completedTasks: number
    thisWeekTime: number
    activeProjects: number
    completionRate: number
    // New filtered stats
    filteredTasks?: number
    filteredProjects?: number
    filteredHours?: number
    filteredEntries?: number
    allTimeHours?: number
  }
  tasks: {
    data: any[]
    loading: boolean
    hasMore: boolean
  }
  activities: {
    data: any[]
  }
  activeProjects: any[]
  tasksTargetRef: React.RefObject<HTMLDivElement>
  getProjectProgress: (projectId: string) => number
  timeframe: string
  onTimeframeChange: (timeframe: string) => void
  timeEntries?: {
    data: any[]
    loading: boolean
    hasMore: boolean
  }
}

const ProfileContent: React.FC<ProfileContentProps> = ({
  user,
  stats,
  tasks,
  activities,
  activeProjects,
  getProjectProgress,
  tasksTargetRef,
  timeframe,
  onTimeframeChange,
}) => {
  // Helper function to get the right time value based on timeframe
  const getTimeValue = () => {
    if (timeframe === "all") {
      return stats?.allTimeHours ? `${stats.allTimeHours.toFixed(1)}h` : "0h"
    } else {
      return stats?.filteredHours ? `${stats.filteredHours.toFixed(1)}h` : "0h"
    }
  }

  // Helper function to get the right time description
  const getTimeDescription = () => {
    switch (timeframe) {
      case "today":
        return "Today"
      case "week":
        return "This week"
      case "month":
        return "This month"
      case "year":
        return "This year"
      case "all":
        return "All time"
      default:
        return "This week"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-start space-x-6">
            {/* Avatar */}
            <div className="relative">
              <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl font-bold">
                  {getInitials(user.username)}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{user.username}</h1>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  Online
                </Badge>
              </div>

              <div className="w-full justify-between flex gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>


      {/* Timeframe Filter Section */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Activity Overview</h2>
              <p className="text-sm text-gray-600">Filter activities by time period</p>
            </div>
            <TimeframeFilter value={timeframe} onValueChange={onTimeframeChange} />
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 mb-1">
                    Total tasks
                  </p>
                  <p className="text-3xl font-bold text-blue-900">
                    {timeframe === "all" ? stats?.totalTasks || 0 : stats?.filteredTasks || 0}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stats?.completionRate || 0}% completion rate
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 mb-1">
                   Completed
                  </p>
                  <p className="text-3xl font-bold text-green-900">
                    {timeframe === "all" ? stats?.completedTasks || 0 : stats?.filteredProjects || 0}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                   Tasks finished
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 mb-1">Time Tracked</p>
                  <p className="text-3xl font-bold text-purple-900">{getTimeValue()}</p>
                  <p className="text-xs text-purple-600 mt-1">{getTimeDescription()}</p>
                </div>
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 mb-1">
                    Active Projects
                  </p>
                  <p className="text-3xl font-bold text-orange-900">
                    {timeframe === "all" ? stats?.activeProjects || 0 : stats?.filteredProjects || 0}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    Currently working on
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Tasks */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span>Recent Tasks</span>
                  </CardTitle>
                  {tasks.data.length > 4 && (
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {tasks.data.length === 0 ? (
                    <div className="text-center py-8">
                      <Target className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No tasks found</p>
                    </div>
                  ) : (
                    tasks.data.slice(0, 4).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{task.title}</p>
                          <p className="text-sm text-gray-500">
                            {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString()}` : "No due date"}
                          </p>
                        </div>
                        <Badge className={`${getStatusColor(task.status)} border`}>{task.status}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Active Projects */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Briefcase className="w-5 h-5 text-green-600" />
                    <span>Active Projects</span>
                  </CardTitle>
                  {activeProjects.length > 3 && (
                    <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                      View All <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {activeProjects.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-500">No active projects</p>
                    </div>
                  ) : (
                    activeProjects.slice(0, 3).map((project) => {
                      const progress = getProjectProgress(project.id)
                      return (
                        <div
                          key={project.id}
                          className="p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900">{project.name}</h4>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              Active
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{project.description || "No description"}</p>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>
                              Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}
                            </span>
                            <span>{progress}% Complete</span>
                          </div>
                          <Progress value={progress} className="mt-2 h-2" />
                        </div>
                      )
                    })
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activities.data.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">No recent activity</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {activities.data.slice(0, 10).map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">{activity.title}</p>
                          <p className="text-sm text-gray-600">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(activity.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks">
            <Card>
              <CardHeader>
                <CardTitle>All Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {tasks.data.length === 0 && !tasks.loading ? (
                  <div className="text-center py-12">
                    <Target className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                    <p className="text-gray-500">This user hasn&apos;t been assigned any tasks yet.</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {tasks.data.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description || "No description"}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Badge className={`${getStatusColor(task.status)} border`}>{task.status}</Badge>
                          <span className="text-xs text-gray-500">
                            {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "No due date"}
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Infinite scroll trigger */}
                    {tasks.hasMore && (
                      <div ref={tasksTargetRef} className="flex justify-center py-4">
                        {tasks.loading && <Loader2 className="w-6 h-6 animate-spin text-blue-600" />}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
              </CardHeader>
              <CardContent>
                {activeProjects.length === 0 ? (
                  <div className="text-center py-12">
                    <Briefcase className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                    <p className="text-gray-500">This user isn&apos;t working on any projects yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeProjects.map((project) => {
                      const progress = getProjectProgress(project.id)
                      const projectTasks = tasks.data.filter((task) => task.projectId === project.id)
                      const remainingTasks = projectTasks.filter((task) => task.status !== "Completed").length

                      return (
                        <div
                          key={project.id}
                          className="p-6 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              {project.status}
                            </Badge>
                          </div>
                          <p className="text-gray-600 mb-4">{project.description || "No description available"}</p>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">Progress</span>
                              <span className="font-medium">{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          <div className="flex justify-between text-xs text-gray-500 mt-4">
                            <span>
                              Started {project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}
                            </span>
                            <span>{remainingTasks} tasks remaining</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {activities.data.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
                    <p className="text-gray-500">This user hasn&apos;t performed any tracked activities.</p>
                  </div>
                ) : (
                  <div className="max-h-96 overflow-y-auto space-y-6">
                    {activities.data.map((activity, index) => (
                      <div key={activity.id} className="relative">
                        {index !== activities.data.length - 1 && (
                          <div className="absolute left-6 top-8 w-px h-16 bg-gray-200" />
                        )}
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0 pb-8">
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-gray-900">{activity.title}</h4>
                              <span className="text-xs text-gray-500">
                                {new Date(activity.timestamp).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                            {activity.duration && (
                              <Badge variant="secondary" className="mt-2">
                                {formatTime(activity.duration)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default ProfileContent
