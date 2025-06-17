"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { ActiveTimer, TimeEntry, TimeTrackingStats } from "@/lib/types"
import { timeTrackingApi } from "@/lib/api"
import { useUser } from "@/lib/user-context"

interface TimeTrackingContextType {
  activeTimer: ActiveTimer | null
  isLoading: boolean
  elapsedTime: number
  startTimer: (taskId: string, description?: string) => Promise<void>
  stopTimer: () => Promise<void>
  refreshActiveTimer: () => Promise<void>
  timeEntries: TimeEntry[]
  stats: TimeTrackingStats | null
  refreshTimeEntries: () => Promise<void>
  refreshStats: () => Promise<void>
  deleteTimeEntry: (entryId: string) => Promise<void>
}

const TimeTrackingContext = createContext<TimeTrackingContextType | undefined>(undefined)

export function TimeTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser()
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [stats, setStats] = useState<TimeTrackingStats | null>(null)

  // Update elapsed time every second when timer is active
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (activeTimer) {
      const updateElapsedTime = () => {
        const now = new Date().getTime()
        const startTime = new Date(activeTimer.startTime).getTime()
        const elapsed = Math.floor((now - startTime) / 1000)
        setElapsedTime(elapsed)
      }

      // Update immediately
      updateElapsedTime()

      // Then update every second
      interval = setInterval(updateElapsedTime, 1000)
    } else {
      setElapsedTime(0)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [activeTimer])

  // Load active timer on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshActiveTimer()
      refreshTimeEntries()
      refreshStats()
    }
  }, [user])

  const refreshActiveTimer = useCallback(async () => {
    if (!user) return

    try {
      const response = await timeTrackingApi.getActiveTimer()
      if (response.success) {
        setActiveTimer(response.data || null)
      }
    } catch (error) {
      console.error("Failed to fetch active timer:", error)
    }
  }, [user])

  const refreshTimeEntries = useCallback(async () => {
    if (!user) return

    try {
      const response = await timeTrackingApi.getTimeEntries({ limit: 50 })
      if (response.success) {
        setTimeEntries(response.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch time entries:", error)
    }
  }, [user])

  const refreshStats = useCallback(async () => {
    if (!user) return

    try {
      const response = await timeTrackingApi.getStats()
      if (response.success) {
        setStats(response.data || null)
      }
    } catch (error) {
      console.error("Failed to fetch time tracking stats:", error)
    }
  }, [user])

  const startTimer = useCallback(
    async (taskId: string, description?: string) => {
      if (!user) return

      setIsLoading(true)
      try {
        // Stop any existing timer first
        if (activeTimer) {
          await timeTrackingApi.stopTimer(activeTimer.id)
        }

        const response = await timeTrackingApi.startTimer(taskId, description)
        if (response.success && response.data) {
          setActiveTimer(response.data)
          // Refresh data
          await Promise.all([refreshTimeEntries(), refreshStats()])
        }
      } catch (error) {
        console.error("Failed to start timer:", error)
        throw error
      } finally {
        setIsLoading(false)
      }
    },
    [user, activeTimer, refreshTimeEntries, refreshStats],
  )

  const stopTimer = useCallback(async () => {
    if (!activeTimer || !user) return

    setIsLoading(true)
    try {
      const response = await timeTrackingApi.stopTimer(activeTimer.id)
      if (response.success) {
        setActiveTimer(null)
        setElapsedTime(0)
        // Refresh data
        await Promise.all([refreshTimeEntries(), refreshStats()])
      }
    } catch (error) {
      console.error("Failed to stop timer:", error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [activeTimer, user, refreshTimeEntries, refreshStats])

  const deleteTimeEntry = useCallback(
    async (entryId: string) => {
      if (!user) return

      try {
        const response = await timeTrackingApi.deleteTimeEntry(entryId)
        if (response.success) {
          // Remove from local state
          setTimeEntries((prev) => prev.filter((entry) => entry.id !== entryId))
          // Refresh stats
          await refreshStats()
        }
      } catch (error) {
        console.error("Failed to delete time entry:", error)
        throw error
      }
    },
    [user, refreshStats],
  )

  return (
    <TimeTrackingContext.Provider
      value={{
        activeTimer,
        isLoading,
        elapsedTime,
        startTimer,
        stopTimer,
        refreshActiveTimer,
        timeEntries,
        stats,
        refreshTimeEntries,
        refreshStats,
        deleteTimeEntry,
      }}
    >
      {children}
    </TimeTrackingContext.Provider>
  )
}

export function useTimeTracking() {
  const context = useContext(TimeTrackingContext)
  if (context === undefined) {
    throw new Error("useTimeTracking must be used within a TimeTrackingProvider")
  }
  return context
}
