"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"
import { taskApi, projectApi, timeTrackingApi, workspaceApi } from "@/lib/api"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import ProfileContent from "@/components/profile/profile-page"

export default function ProfilePage() {
  const params = useParams()
  const userId = params.id

  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    completionRate: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalTimeTracked: 0,
    thisWeekTime: 0,
  })
  const [activeProjects, setActiveProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [tasks, setTasks] = useState({
    data: [],
    hasMore: true,
    loading: false,
    page: 1,
  })

  const [activities, setActivities] = useState({
    data: [],
    hasMore: true,
    loading: false,
    page: 1,
  })

  const [timeEntries, setTimeEntries] = useState({
    data: [],
    hasMore: true,
    loading: false,
    page: 1,
  })

  useEffect(() => {
    if (userId) {
      loadInitialData()
    }
  }, [userId])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      const membersRes = await workspaceApi.getMembers()
      if (!membersRes.success || !membersRes.data) {
        setError("Failed to load workspace members")
        return
      }

      const foundUser = membersRes.data.find((member) => member.memberId === userId)
      if (!foundUser) {
        setError("User not found in workspace")
        return
      }

      setUser({
        id: foundUser.memberId,
        username: foundUser.username,
        email: foundUser.email,
        password: "",
        workspaceIds: [],
        createdAt: foundUser.joinedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })

      await Promise.all([
        loadTasks(1, true),
        loadTimeEntries(1, true),
        loadProjects(),
      ])
    } catch (err) {
      console.error("Failed to load profile data:", err)
      setError("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async (page, reset = false) => {
    if (tasks.loading) return
    setTasks((prev) => ({ ...prev, loading: true }))

    try {
      const tasksRes = await taskApi.getTasksByUser(userId)
      if (tasksRes.success && tasksRes.data) {
        const limit = 10
        const start = (page - 1) * limit
        const end = start + limit
        const paginatedTasks = tasksRes.data.slice(start, end)
        const hasMore = end < tasksRes.data.length

        setTasks((prev) => ({
          data: reset ? paginatedTasks : [...prev.data, ...paginatedTasks],
          hasMore,
          loading: false,
          page: hasMore ? page + 1 : page,
        }))

        if (reset) {
          const completed = tasksRes.data.filter((t) => t.status === "Completed").length
          const inProgress = tasksRes.data.filter((t) => t.status === "In Progress").length

          setStats((prev) => ({
            ...prev,
            totalTasks: tasksRes.data.length,
            completedTasks: completed,
            inProgressTasks: inProgress,
            completionRate: tasksRes.data.length > 0
              ? Math.round((completed / tasksRes.data.length) * 100)
              : 0,
          }))

          generateActivitiesFromTasks(tasksRes.data)
        }
      }
    } catch (err) {
      console.error("Failed to load tasks:", err)
    }

    setTasks((prev) => ({ ...prev, loading: false }))
  }

  const loadTimeEntries = async (page, reset = false) => {
    if (timeEntries.loading) return
    setTimeEntries((prev) => ({ ...prev, loading: true }))

    try {
      const timeRes = await timeTrackingApi.getUserTimeEntries(userId, page, 10)
      if (timeRes.success && timeRes.data) {
        setTimeEntries((prev) => ({
          data: reset ? timeRes.data : [...prev.data, ...timeRes.data],
          hasMore: timeRes.pagination?.hasMore || false,
          loading: false,
          page: timeRes.pagination?.hasMore ? page + 1 : page,
        }))

        if (reset) {
          const total = timeRes.data.reduce((sum, e) => sum + e.duration, 0)
          const thisWeek = timeRes.data
            .filter((entry) => {
              const entryDate = new Date(entry.startTime)
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return entryDate >= weekAgo
            })
            .reduce((sum, e) => sum + e.duration, 0)

          setStats((prev) => ({
            ...prev,
            totalTimeTracked: total,
            thisWeekTime: thisWeek,
          }))

          generateActivitiesFromTimeEntries(timeRes.data)
        }
      }
    } catch (err) {
      console.error("Failed to load time entries:", err)
    }

    setTimeEntries((prev) => ({ ...prev, loading: false }))
  }

  const loadProjects = async () => {
    try {
      const projectsRes = await projectApi.getProjects()
      if (projectsRes.success && projectsRes.data) {
        const userProjects = projectsRes.data.filter((p) => p.createdBy === userId)
        const active = userProjects.filter((p) => p.status === "ongoing")

        setActiveProjects(active)
        setStats((prev) => ({
          ...prev,
          totalProjects: userProjects.length,
          activeProjects: active.length,
        }))
      }
    } catch (err) {
      console.error("Failed to load projects:", err)
    }
  }

  const generateActivitiesFromTasks = (taskList) => {
    const taskActivities = []

    const completedTasks = taskList
      .filter((task) => task.status === "Completed")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)

    completedTasks.forEach((task) => {
      taskActivities.push({
        id: `task-completed-${task.id}`,
        type: "task_completed",
        title: `Completed "${task.title}"`,
        description: `Finished working on ${task.title}`,
        timestamp: task.updatedAt,
        taskId: task.id,
        projectId: task.projectId,
        taskTitle: task.title,
      })
    })

    const createdTasks = taskList
      .filter((task) => task.createdBy === userId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3)

    createdTasks.forEach((task) => {
      taskActivities.push({
        id: `task-created-${task.id}`,
        type: "task_created",
        title: `Created "${task.title}"`,
        description: `Started new task: ${task.title}`,
        timestamp: task.createdAt,
        taskId: task.id,
        projectId: task.projectId,
        taskTitle: task.title,
      })
    })

    setActivities((prev) => ({
      ...prev,
      data: [...prev.data, ...taskActivities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    }))
  }

  const generateActivitiesFromTimeEntries = (entries) => {
    const timeActivities = entries.slice(0, 10).map((entry) => ({
      id: `time-tracked-${entry.id}`,
      type: "time_tracked",
      title: `Tracked ${formatTime(entry.duration)} on "${entry.taskTitle}"`,
      description: `Worked on ${entry.taskTitle} for ${formatTime(entry.duration)}`,
      timestamp: entry.endTime || entry.startTime,
      taskId: entry.taskId,
      projectId: entry.projectId,
      duration: entry.duration,
      taskTitle: entry.taskTitle,
      projectName: entry.projectName,
    }))

    setActivities((prev) => ({
      ...prev,
      data: [...prev.data, ...timeActivities].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)),
    }))
  }

  const loadMoreTasks = useCallback(() => {
    if (!tasks.loading && tasks.hasMore) {
      loadTasks(tasks.page)
    }
  }, [tasks.loading, tasks.hasMore, tasks.page])

  const loadMoreTimeEntries = useCallback(() => {
    if (!timeEntries.loading && timeEntries.hasMore) {
      loadTimeEntries(timeEntries.page)
    }
  }, [timeEntries.loading, timeEntries.hasMore, timeEntries.page])

  const { targetRef: tasksTargetRef } = useInfiniteScroll(loadMoreTasks, tasks.hasMore, tasks.loading)
  useInfiniteScroll(loadMoreTimeEntries, timeEntries.hasMore, timeEntries.loading)

  const getProjectProgress = (projectId) => {
    const projectTasks = tasks.data.filter((task) => task.projectId === projectId)
    if (projectTasks.length === 0) return 0
    const completed = projectTasks.filter((task) => task.status === "Completed").length
    return Math.round((completed / projectTasks.length) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-4">{error || "The requested user profile could not be found."}</p>
          <Link href="/dashboard">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <ProfileContent
      user={user}
      stats={stats}
      tasks={tasks}
      activities={activities}
      activeProjects={activeProjects}
      tasksTargetRef={tasksTargetRef}
      getProjectProgress={getProjectProgress}
      formatTime={formatTime}
    />
  )
}
