"use client"

import { useState, useEffect } from "react"
import { ChevronLeft, ChevronRight, Plus, Filter, CalendarIcon, Clock, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { taskApi } from "@/lib/api"
import type { Task } from "@/lib/types"

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export default function CalendarContent() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"month" | "week">("month")

  useEffect(() => {
    fetchTasks()
  }, [])

  const fetchTasks = async () => {
    try {
      // Fetch tasks from all projects - in a real app, you'd have a calendar-specific endpoint
      const response = await taskApi.getTasks("all")
      if (response.success) {
        setTasks(response.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getCalendarDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())

    const days = []
    const currentDay = new Date(startDate)

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay))
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      if (!task.dueDate) return false
      const taskDate = new Date(task.dueDate)
      return taskDate.toDateString() === date.toDateString()
    })
  }

  const isToday = (date: Date) => {
    return date.toDateString() === new Date().toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const calendarDays = getCalendarDays()

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="header-large">Calendar</h1>
          <p className="text-description mt-1">View and manage your tasks, deadlines, and events.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Filter size={16} className="mr-2" />
            <span className="text-medium">Filter</span>
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus size={16} className="mr-2" />
            <span className="text-medium">Add Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
            <ChevronLeft size={16} />
          </Button>
          <h2 className="text-xl font-semibold text-gray-900">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant={viewMode === "month" ? "default" : "outline"} size="sm" onClick={() => setViewMode("month")}>
            Month
          </Button>
          <Button variant={viewMode === "week" ? "default" : "outline"} size="sm" onClick={() => setViewMode("week")}>
            Week
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
            Today
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="bg-white shadow-sm">
        <CardContent className="p-0">
          {/* Days Header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {DAYS.map((day) => (
              <div
                key={day}
                className="p-4 text-center text-medium font-semibold text-gray-700 border-r border-gray-100 last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          {isLoading ? (
            <div className="grid grid-cols-7">
              {Array.from({ length: 42 }).map((_, i) => (
                <div key={i} className="h-32 border-r border-b border-gray-100 last:border-r-0 p-2">
                  <Skeleton className="h-6 w-8 mb-2" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {calendarDays.map((date, index) => {
                const dayTasks = getTasksForDate(date)
                const isCurrentDay = isToday(date)
                const isInCurrentMonth = isCurrentMonth(date)

                return (
                  <div
                    key={index}
                    className={`h-32 border-r border-b border-gray-100 last:border-r-0 p-2 ${
                      isCurrentDay ? "bg-blue-50" : ""
                    } ${!isInCurrentMonth ? "bg-gray-50" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-medium font-medium ${
                          isCurrentDay
                            ? "bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-small"
                            : !isInCurrentMonth
                              ? "text-gray-400"
                              : "text-gray-900"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <Badge variant="secondary" className="text-extra-small px-1 h-4">
                          {dayTasks.length}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-1 overflow-hidden">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={`text-extra-small p-1 rounded truncate cursor-pointer ${
                            task.status === "Completed"
                              ? "bg-green-100 text-green-700"
                              : task.status === "In Progress"
                                ? "bg-blue-100 text-blue-700"
                                : task.status === "Under Review"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-gray-100 text-gray-700"
                          }`}
                          title={task.title}
                        >
                          {task.title}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-extra-small text-gray-500 text-center">+{dayTasks.length - 3} more</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-blue-600" />
              <span>Today's Tasks</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TodaysTasks tasks={tasks} isLoading={isLoading} />
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span>Overdue</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <OverdueTasks tasks={tasks} isLoading={isLoading} />
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span>This Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <WeekTasks tasks={tasks} isLoading={isLoading} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function TodaysTasks({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  const today = new Date()
  const todayTasks = tasks.filter((task) => {
    if (!task.dueDate) return false
    const taskDate = new Date(task.dueDate)
    return taskDate.toDateString() === today.toDateString()
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (todayTasks.length === 0) {
    return (
      <div className="text-center py-4">
        <CalendarIcon size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-small text-gray-500">No tasks due today</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {todayTasks.map((task) => (
        <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-medium font-medium text-gray-900 truncate">{task.title}</h4>
          <div className="flex items-center justify-between mt-2">
            <Badge
              variant="secondary"
              className={
                task.status === "Completed"
                  ? "bg-green-100 text-green-700"
                  : task.status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
              }
            >
              {task.status}
            </Badge>
            <span className="text-small text-gray-500">{task.priority}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function OverdueTasks({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  const today = new Date()
  const overdueTasks = tasks.filter((task) => {
    if (!task.dueDate || task.status === "Completed") return false
    const taskDate = new Date(task.dueDate)
    return taskDate < today
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (overdueTasks.length === 0) {
    return (
      <div className="text-center py-4">
        <Clock size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-small text-gray-500">No overdue tasks</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {overdueTasks.slice(0, 5).map((task) => (
        <div key={task.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
          <h4 className="text-medium font-medium text-red-900 truncate">{task.title}</h4>
          <div className="flex items-center justify-between mt-2">
            <span className="text-small text-red-600">Due: {new Date(task.dueDate!).toLocaleDateString()}</span>
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              Overdue
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}

function WeekTasks({ tasks, isLoading }: { tasks: Task[]; isLoading: boolean }) {
  const today = new Date()
  const weekEnd = new Date(today)
  weekEnd.setDate(today.getDate() + 7)

  const weekTasks = tasks.filter((task) => {
    if (!task.dueDate) return false
    const taskDate = new Date(task.dueDate)
    return taskDate >= today && taskDate <= weekEnd
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    )
  }

  if (weekTasks.length === 0) {
    return (
      <div className="text-center py-4">
        <Users size={32} className="mx-auto text-gray-300 mb-2" />
        <p className="text-small text-gray-500">No tasks this week</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {weekTasks.slice(0, 5).map((task) => (
        <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
          <h4 className="text-medium font-medium text-gray-900 truncate">{task.title}</h4>
          <div className="flex items-center justify-between mt-2">
            <span className="text-small text-gray-600">{new Date(task.dueDate!).toLocaleDateString()}</span>
            <Badge
              variant="secondary"
              className={
                task.priority === "Urgent"
                  ? "bg-red-100 text-red-700"
                  : task.priority === "High"
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-700"
              }
            >
              {task.priority}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  )
}
