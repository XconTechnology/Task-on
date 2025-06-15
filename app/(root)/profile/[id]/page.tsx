"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import {
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatTime} from "@/lib/utils"
import { taskApi, projectApi, timeTrackingApi, workspaceApi } from "@/lib/api"
import type { Task, Project, TimeEntry, User as UserType, PaginatedData, ProfileStats, RecentActivity } from "@/lib/types"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import Link from "next/link"
import ProfileContent from "@/components/profile/profile-page"


export default function ProfilePage() {
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<UserType | null>(null)
  const [stats, setStats] = useState<ProfileStats | null>(null)
  const [activeProjects, setActiveProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Paginated data states
  const [tasks, setTasks] = useState<PaginatedData<Task>>({
    data: [],
    hasMore: true,
    loading: false,
    page: 1,
  })

  const [activities, setActivities] = useState<PaginatedData<RecentActivity>>({
    data: [],
    hasMore: true,
    loading: false,
    page: 1,
  })

  const [timeEntries, setTimeEntries] = useState<PaginatedData<TimeEntry>>({
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

      // Get workspace members to find the user
      const membersRes = await workspaceApi.getMembers()
      if (!membersRes.success || !membersRes.data) {
        setError("Failed to load workspace members")
        return
      }

      // Find the user in workspace members
      const foundUser = membersRes.data.find((member: any) => member.memberId === userId)
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

      // Load initial paginated data
      await Promise.all([loadTasks(1, true), loadTimeEntries(1, true), loadProjects()])
    } catch (error) {
      console.error("Failed to load profile data:", error)
      setError("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const loadTasks = async (page: number, reset = false) => {
    if (tasks.loading) return

    setTasks((prev) => ({ ...prev, loading: true }))

    try {
      const tasksRes = await taskApi.getTasksByUser(userId)
      if (tasksRes.success && tasksRes.data) {
        // Simulate pagination (since your API doesn't have pagination yet)
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

        // Calculate stats on first load
        if (reset) {
          const completedTasks = tasksRes.data.filter((t) => t.status === "Completed").length
          const inProgressTasks = tasksRes.data.filter((t) => t.status === "In Progress").length

          setStats((prev) => ({
            ...prev,
            totalTasks: tasksRes.data.length,
            completedTasks,
            inProgressTasks,
            completionRate: tasksRes.data.length > 0 ? Math.round((completedTasks / tasksRes.data.length) * 100) : 0,
          }))

          // Generate activities from tasks
          generateActivitiesFromTasks(tasksRes.data)
        }
      }
    } catch (error) {
      console.error("Failed to load tasks:", error)
    }

    setTasks((prev) => ({ ...prev, loading: false }))
  }

  const loadTimeEntries = async (page: number, reset = false) => {
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

        // Calculate time stats on first load
        if (reset) {
          const totalTime = timeRes.data.reduce((sum, entry) => sum + entry.duration, 0)
          const thisWeekTime = timeRes.data
            .filter((entry) => {
              const entryDate = new Date(entry.startTime)
              const weekAgo = new Date()
              weekAgo.setDate(weekAgo.getDate() - 7)
              return entryDate >= weekAgo
            })
            .reduce((sum, entry) => sum + entry.duration, 0)

          setStats((prev) => ({
            ...prev,
            totalTimeTracked: totalTime,
            thisWeekTime,
          }))

          // Generate activities from time entries
          generateActivitiesFromTimeEntries(timeRes.data)
        }
      }
    } catch (error) {
      console.error("Failed to load time entries:", error)
    }

    setTimeEntries((prev) => ({ ...prev, loading: false }))
  }

  const loadProjects = async () => {
    try {
      const projectsRes = await projectApi.getProjects()
      if (projectsRes.success && projectsRes.data) {
        // Filter projects where user has involvement
        const userProjects = projectsRes.data.filter((project) => project.createdBy === userId)

        setActiveProjects(userProjects.filter((p) => p.status === "active"))

        setStats((prev) => ({
          ...prev,
          totalProjects: userProjects.length,
          activeProjects: userProjects.filter((p) => p.status === "active").length,
        }))
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    }
  }

  const generateActivitiesFromTasks = (taskList: Task[]) => {
    const taskActivities: RecentActivity[] = []

    // Add completed tasks
    const completedTasks = taskList
      .filter((task) => task.status === "Completed")
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
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

    // Add created tasks
    const createdTasks = taskList
      .filter((task) => task.createdBy === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
      data: [...prev.data, ...taskActivities].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    }))
  }

  const generateActivitiesFromTimeEntries = (entries: TimeEntry[]) => {
    const timeActivities: RecentActivity[] = entries.slice(0, 10).map((entry) => ({
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
      data: [...prev.data, ...timeActivities].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      ),
    }))
  }

  // Infinite scroll callbacks
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

  // Infinite scroll hooks
  const { targetRef: tasksTargetRef } = useInfiniteScroll(loadMoreTasks, tasks.hasMore, tasks.loading)
  const { targetRef: timeEntriesTargetRef } = useInfiniteScroll(
    loadMoreTimeEntries,
    timeEntries.hasMore,
    timeEntries.loading,
  )

 
  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.data.filter((task) => task.projectId === projectId)
    if (projectTasks.length === 0) return 0
    const completedTasks = projectTasks.filter((task) => task.status === "Completed").length
    return Math.round((completedTasks / projectTasks.length) * 100)
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
