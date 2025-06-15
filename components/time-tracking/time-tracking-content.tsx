"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { Clock, Calendar, BarChart3, Filter, Download, Trash2, Play, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDuration } from "@/lib/utils"
import { timeTrackingApi } from "@/lib/api"
import { useTimeTracking } from "@/lib/contexts/time-tracking-context"
import type { TimeEntry, TimeTrackingStats } from "@/lib/types"

export default function TimeTrackingContent() {
  const { elapsedTime } = useTimeTracking()

  // Simple state management
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [stats, setStats] = useState<TimeTrackingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load stats and first page of entries in parallel
      const [statsRes, entriesRes] = await Promise.all([
        timeTrackingApi.getStats(),
        timeTrackingApi.getTimeEntriesPaginated(1, 10),
      ])

      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data)
      }

      if (entriesRes.success && entriesRes.data) {
        setTimeEntries(entriesRes.data.entries || [])
        setHasMore(entriesRes.data.hasMore || false)
        setPage(2) // Next page to load
      }
    } catch (err) {
      console.error("Failed to load time tracking data:", err)
      setError("Failed to load data")
    } finally {
      setLoading(false)
    }
  }

  // Load more entries
  const loadMoreEntries = useCallback(async () => {
    if (loadingMore || !hasMore) return

    try {
      setLoadingMore(true)
      const res = await timeTrackingApi.getTimeEntriesPaginated(page, 10)

      if (res.success && res.data) {
        setTimeEntries((prev) => [...prev, ...(res.data?.entries || [])])
        setHasMore(res.data.hasMore || false)
        setPage((prev) => prev + 1)
      }
    } catch (err) {
      console.error("Failed to load more entries:", err)
    } finally {
      setLoadingMore(false)
    }
  }, [page, hasMore, loadingMore])

  // Handle scroll for infinite loading
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget

      if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loadingMore) {
        loadMoreEntries()
      }
    },
    [hasMore, loadingMore, loadMoreEntries],
  )

  // Resume time entry
  const handleResumeEntry = async (entryId: string) => {
    try {
      const res = await timeTrackingApi.resumeTimeEntry(entryId)
      if (res.success) {
        // Refresh the entries to show updated state
        loadInitialData()
      }
    } catch (err) {
      console.error("Failed to resume entry:", err)
    }
  }

  // Delete time entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm("Are you sure you want to delete this time entry?")) return

    try {
      const res = await timeTrackingApi.deleteTimeEntry(entryId)
      if (res.success) {
        // Remove from local state
        setTimeEntries((prev) => prev.filter((entry) => entry.id !== entryId))
        // Refresh stats
        const statsRes = await timeTrackingApi.getStats()
        if (statsRes.success && statsRes.data) {
          setStats(statsRes.data)
        }
      }
    } catch (err) {
      console.error("Failed to delete entry:", err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error loading time entries</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadInitialData}>Try Again</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-1">Track time spent on tasks and monitor your productivity.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
            <Download size={16} className="mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.todayHours?.toFixed(1) || "0.0"}h</p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  <span className="text-sm text-blue-600">Hours tracked</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.weekHours?.toFixed(1) || "0.0"}h</p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                  <span className="text-sm text-green-600">Total hours</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Avg/Day</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.avgDailyHours?.toFixed(1) || "0.0"}h</p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2" />
                  <span className="text-sm text-purple-600">Daily average</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Productivity</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.productivity || 94}%</p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                  <span className="text-sm text-orange-600">Efficiency score</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Time Entries */}
      <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No time entries yet</h3>
              <p className="text-gray-600">Start tracking time on your tasks to see entries here.</p>
            </div>
          ) : (
            <div className="space-y-1 max-h-96 overflow-y-auto" onScroll={handleScroll}>
              {timeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        entry.isRunning ? "bg-red-500 animate-pulse" : "bg-green-500"
                      }`}
                    />
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{entry.taskTitle}</h4>
                      <p className="text-xs text-gray-500">
                        {entry.projectName} •{" "}
                        {new Date(entry.startTime).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        ,{" "}
                        {new Date(entry.startTime).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {entry.endTime
                          ? new Date(entry.endTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Now"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {formatDuration(entry.isRunning ? entry.duration + elapsedTime : entry.duration)}
                    </span>
                    <div className="flex items-center space-x-1">
                      {!entry.isRunning && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleResumeEntry(entry.id)}
                          className="w-8 h-8 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                        >
                          <Play size={12} />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteEntry(entry.id)}
                        className="w-8 h-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Loading more indicator */}
              {loadingMore && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}

              {/* End of data indicator */}
              {!hasMore && timeEntries.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">No more entries to load</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
