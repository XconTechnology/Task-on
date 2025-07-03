"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatTime } from "@/lib/utils"
import { taskApi, projectApi, timeTrackingApi, workspaceApi } from "@/lib/api"
import { useInfiniteScroll } from "@/hooks/use-infinite-scroll"
import { useUser } from "@/lib/user-context"
import ProfileContent from "@/components/profile/profile-content"

export default function ProfilePage() {
  const params = useParams()
  const userId = params.id
  const { user: currentUser } = useUser()

  const [user, setUser] = useState(null)
  const [currentUserRole, setCurrentUserRole] = useState("Member")
  const [timeframe, setTimeframe] = useState("all")
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    completionRate: 0,
    totalProjects: 0,
    activeProjects: 0,
    totalTimeTracked: 0,
    thisWeekTime: 0,
    // New filtered stats
    filteredTasks: 0,
    filteredProjects: 0,
    filteredHours: 0,
    filteredEntries: 0,
    allTimeHours: 0,
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

  // Reload data when timeframe changes
  useEffect(() => {
    if (userId && user) {
      loadFilteredData()
    }
  }, [timeframe, userId, user])

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

      // Find current user's role
      if (currentUser && membersRes.data) {
        const currentMember = membersRes.data.find((member) => member.memberId === currentUser.id)
        if (currentMember) {
          setCurrentUserRole(currentMember.role || "Member")
        }
      }

      setUser({
        id: foundUser.memberId,
        username: foundUser.username,
        email: foundUser.email,
        password: "",
        workspaceIds: [],
        createdAt: foundUser.joinedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Include salary information if available
        salary: foundUser.salary,
      })

      await Promise.all([loadProjects(), loadFilteredData()])
    } catch (err) {
      console.error("Failed to load profile data:", err)
      setError("Failed to load profile data")
    } finally {
      setLoading(false)
    }
  }

  const loadFilteredData = async () => {
    try {
      // Load time tracking stats with timeframe
      const timeStatsRes = await timeTrackingApi.getStatsWithTimeframe(timeframe, userId)
      if (timeStatsRes.success && timeStatsRes.data) {
        const timeStats = timeStatsRes.data

        setStats((prev) => ({
          ...prev,
          totalTimeTracked: timeStats.monthHours * 3600, // Convert to seconds for compatibility
          thisWeekTime: timeStats.weekHours * 3600,
          filteredHours: timeStats.filteredHours,
          filteredProjects: timeStats.filteredProjects,
          filteredTasks: timeStats.filteredTasks,
          filteredEntries: timeStats.filteredEntries,
          allTimeHours: timeStats.allTimeHours,
        }))

        // Set initial time entries from stats
        setTimeEntries({
          data: timeStats.recentEntries || [],
          hasMore: timeStats.totalFilteredEntries > 10,
          loading: false,
          page: timeStats.totalFilteredEntries > 10 ? 2 : 1,
        })
      }

      // Load tasks (always load all tasks for user, then filter in UI)
      await loadTasks(1, true)
    } catch (err) {
      console.error("Failed to load filtered data:", err)
    }
  }

  const loadTasks = async (page, reset = false) => {
    if (tasks.loading) return
    setTasks((prev) => ({ ...prev, loading: true }))

    try {
      const tasksRes = await taskApi.getTasksByUser(userId)
      if (tasksRes.success && tasksRes.data) {
        // Filter tasks based on timeframe
        const filteredTasks = filterTasksByTimeframe(tasksRes.data, timeframe)

        const limit = 10
        const start = (page - 1) * limit
        const end = start + limit
        const paginatedTasks = filteredTasks.slice(start, end)
        const hasMore = end < filteredTasks.length

        setTasks((prev) => ({
          data: reset ? paginatedTasks : [...prev.data, ...paginatedTasks],
          hasMore,
          loading: false,
          page: hasMore ? page + 1 : page,
        }))

        if (reset) {
          const completed = filteredTasks.filter((t) => t.status === "Completed").length
          const inProgress = filteredTasks.filter((t) => t.status === "In Progress").length

          setStats((prev) => ({
            ...prev,
            totalTasks: tasksRes.data.length, // All tasks
            completedTasks: tasksRes.data.filter((t) => t.status === "Completed").length,
            inProgressTasks: tasksRes.data.filter((t) => t.status === "In Progress").length,
            completionRate:
              tasksRes.data.length > 0
                ? Math.round(
                    (tasksRes.data.filter((t) => t.status === "Completed").length / tasksRes.data.length) * 100,
                  )
                : 0,
            filteredTasks: filteredTasks.length, // Filtered tasks
          }))

          // Generate activities from both tasks and time entries
          generateCombinedActivities(filteredTasks, timeEntries.data)
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
      const timeRes = await timeTrackingApi.getFilteredUserTimeEntries(userId, timeframe, page, 10)
      if (timeRes.success && timeRes.data) {
        setTimeEntries((prev) => ({
          data: reset ? timeRes.data : [...prev.data, ...timeRes.data],
          hasMore: timeRes.pagination?.hasMore || false,
          loading: false,
          page: timeRes.pagination?.hasMore ? page + 1 : page,
        }))

        if (reset) {
          // Regenerate activities when time entries are reset
          generateCombinedActivities(tasks.data, timeRes.data)
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

  // Filter tasks by timeframe
  const filterTasksByTimeframe = (taskList, timeframe) => {
    if (timeframe === "all") return taskList

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    let startDate

    switch (timeframe) {
      case "today":
        startDate = today
        break
      case "week":
        startDate = new Date(today)
        startDate.setDate(today.getDate() - today.getDay())
        break
      case "month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        return taskList
    }

    return taskList.filter((task) => {
      const taskDate = new Date(task.updatedAt)
      return taskDate >= startDate
    })
  }

  // Generate combined activities from both tasks and time entries
  const generateCombinedActivities = (taskList, timeEntriesList) => {
    const allActivities = []

    // Generate task activities
    const completedTasks = taskList
      .filter((task) => task.status === "Completed")
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)

    completedTasks.forEach((task) => {
      allActivities.push({
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
      allActivities.push({
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

    // Generate time tracking activities
    const timeActivities = timeEntriesList.slice(0, 10).map((entry) => ({
      id: `time-tracked-${entry.id}`,
      type: "time_tracked",
      title: `Tracked ${formatTime(entry.duration)} on "${entry.taskTitle || "Unknown Task"}"`,
      description: `Worked on ${entry.taskTitle || "Unknown Task"} for ${formatTime(entry.duration)}`,
      timestamp: entry.endTime || entry.startTime,
      taskId: entry.taskId,
      projectId: entry.projectId,
      duration: entry.duration,
      taskTitle: entry.taskTitle,
      projectName: entry.projectName,
    }))

    // Combine and sort all activities
    allActivities.push(...timeActivities)
    const sortedActivities = allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

    setActivities((prev) => ({
      ...prev,
      data: sortedActivities,
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
      timeframe={timeframe}
      onTimeframeChange={setTimeframe}
      timeEntries={timeEntries}
      currentUserRole={currentUserRole}
    />
  )
}
