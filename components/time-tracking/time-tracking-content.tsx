"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import {
  Clock,
  Calendar,
  BarChart3,
  Filter,
  Download,
  Trash2,
  Play,
  Square,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTimeTracking } from "@/lib/contexts/time-tracking-context";
import { formatDuration } from "@/lib/utils";
import { timeTrackingApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/lib/user-context";
import type { TimeEntry, PaginatedData } from "@/lib/types";
import {
  ChartContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "@/components/ui/chart";
export default function TimeTrackingContent() {
  const { user } = useUser();
  const { activeTimer, elapsedTime, stats, refreshStats, refreshActiveTimer } =
    useTimeTracking();
  const { toast } = useToast();

  // Use the EXACT same pattern as profile page
  const [timeEntries, setTimeEntries] = useState<PaginatedData<TimeEntry>>({
    data: [],
    hasMore: true,
    loading: false,
    page: 1,
  });

  const [initialLoading, setInitialLoading] = useState(true);
  const [resumingEntryId, setResumingEntryId] = useState<string | null>(null);

  // Use the EXACT same loadTimeEntries function as profile page
  const loadTimeEntries = async (page: number, reset = false) => {
    if (timeEntries.loading || !user?.id) return;

    setTimeEntries((prev) => ({ ...prev, loading: true }));

    try {
      console.log(
        `Loading time entries for user ${user.id} - Page: ${page}, Reset: ${reset}`
      );

      // Use the SAME API call that works in profile page
      const timeRes = await timeTrackingApi.getUserTimeEntries(
        user.id,
        page,
        10
      );

      console.log("API Response:", timeRes);

      if (timeRes.success && timeRes.data) {
        console.log("Time entries data:", timeRes.data);

        setTimeEntries((prev) => ({
          data: reset
            ? (timeRes.data ?? [])
            : [...prev.data, ...(timeRes.data ?? [])],
          hasMore: timeRes.data?.length === 10,
          loading: false,
          page: timeRes.data?.length === 10 ? page + 1 : page,
        }));
      } else {
        console.error("Failed to load time entries:", timeRes.error);
        setTimeEntries((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error("Failed to load time entries:", error);
      setTimeEntries((prev) => ({ ...prev, loading: false }));
      toast({
        title: "Error",
        description: "Failed to load time entries",
        variant: "destructive",
      });
    }
  };

  // Load more entries callback - SAME as profile page
  const loadMoreTimeEntries = useCallback(() => {
    if (!timeEntries.loading && timeEntries.hasMore) {
      loadTimeEntries(timeEntries.page);
    }
  }, [timeEntries.loading, timeEntries.hasMore, timeEntries.page]);

  // Infinite scroll handler
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      if (scrollHeight - scrollTop <= clientHeight + 100) {
        loadMoreTimeEntries();
      }
    },
    [loadMoreTimeEntries]
  );

  // Resume time entry - UPDATED to refresh active timer
  const handleResumeEntry = async (entry: TimeEntry) => {
    try {
      setResumingEntryId(entry.id);

      const response = await timeTrackingApi.resumeTimeEntry(entry.id);

      if (response.success) {
        toast({
          title: "Timer Resumed",
          description: `Resumed timer for ${entry.taskTitle || "task"}`,
        });

        // IMPORTANT: Refresh the active timer to show in top bar immediately
        await refreshActiveTimer();

        // Update the local state to show the entry is now running
        setTimeEntries((prev) => ({
          ...prev,
          data: prev.data.map(
            (e) =>
              e.id === entry.id
                ? { ...e, isRunning: true }
                : { ...e, isRunning: false } // Stop other running entries
          ),
        }));

        // Refresh stats
        refreshStats();
      } else {
        throw new Error(response.error || "Failed to resume timer");
      }
    } catch (error) {
      console.error("Failed to resume timer:", error);
      toast({
        title: "Error",
        description: "Failed to resume timer",
        variant: "destructive",
      });
    } finally {
      setResumingEntryId(null);
    }
  };

  // Stop timer for a specific entry
  const handleStopEntry = async (entry: TimeEntry) => {
    if (!activeTimer) return;

    try {
      setResumingEntryId(entry.id);

      const response = await timeTrackingApi.stopTimer(activeTimer.id);

      if (response.success) {
        toast({
          title: "Timer Stopped",
          description: `Stopped timer for ${entry.taskTitle || "task"}`,
        });

        // Refresh the active timer
        await refreshActiveTimer();

        // Update local state
        setTimeEntries((prev) => ({
          ...prev,
          data: prev.data.map((e) =>
            e.id === entry.id ? { ...e, isRunning: false } : e
          ),
        }));

        // Refresh entries and stats
        loadTimeEntries(1, true);
        refreshStats();
      } else {
        throw new Error(response.error || "Failed to stop timer");
      }
    } catch (error) {
      console.error("Failed to stop timer:", error);
      toast({
        title: "Error",
        description: "Failed to stop timer",
        variant: "destructive",
      });
    } finally {
      setResumingEntryId(null);
    }
  };

  // Delete time entry
  const handleDeleteEntry = async (entryId: string) => {
    if (!window.confirm("Are you sure you want to delete this time entry?"))
      return;

    try {
      const response = await timeTrackingApi.deleteTimeEntry(entryId);

      if (response.success) {
        setTimeEntries((prev) => ({
          ...prev,
          data: prev.data.filter((entry) => entry.id !== entryId),
        }));
        toast({
          title: "Entry Deleted",
          description: "Time entry deleted successfully",
        });
        // Refresh stats
        refreshStats();
      } else {
        throw new Error(response.error || "Failed to delete entry");
      }
    } catch (error) {
      console.error("Failed to delete entry:", error);
      toast({
        title: "Error",
        description: "Failed to delete time entry",
        variant: "destructive",
      });
    }
  };

  // Check if an entry is currently running
  const isEntryRunning = (entry: TimeEntry) => {
    return (
      activeTimer &&
      (activeTimer.id === entry.id || activeTimer.taskId === entry.taskId)
    );
  };

  // Load initial data - SAME as profile page
  useEffect(() => {
    if (user?.id) {
      console.log("User found, loading initial time entries for:", user.id);
      loadTimeEntries(1, true);
      refreshStats();
      setInitialLoading(false);
    }
  }, [user?.id]);

  console.log("Current state:", {
    timeEntries: timeEntries.data,
    loading: timeEntries.loading,
    hasMore: timeEntries.hasMore,
    page: timeEntries.page,
    userId: user?.id,
    activeTimer,
  });

  if (initialLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600 mt-1">
            Track time spent on tasks and monitor your productivity.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            <Filter size={16} className="mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Today
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.todayHours?.toFixed(1) || "0.0"}h
                </p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  This Week
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.weekHours?.toFixed(1) || "0.0"}h
                </p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Avg/Day
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.avgDailyHours?.toFixed(1) || "0.0"}h
                </p>
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
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Productivity
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {stats?.productivity || 94}%
                </p>
                <div className="flex items-center mt-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                  <span className="text-sm text-orange-600">
                    Efficiency score
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Weekly Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats?.weeklyData && (
                <ChartContainer config={stats.weeklyData}>
                  <BarChart data={stats.weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Bar dataKey="hours" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Clock className="w-5 h-5 text-green-600" />
              <span>Time by Project</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {stats?.projectData && (
                <ChartContainer config={""}>
                  <BarChart data={stats.projectData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey="project"
                      type="category"
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Bar dataKey="hours" fill="#10B981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ChartContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Time Entries */}
      <Card className="bg-white shadow-sm border-0 rounded-xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Recent Time Entries
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.data.length === 0 && !timeEntries.loading ? (
            <div className="text-center py-12">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No time entries yet
              </h3>
              <p className="text-gray-600">
                Start tracking time on your tasks to see entries here.
              </p>
            </div>
          ) : (
            <div
              className="space-y-1 max-h-96 overflow-y-auto"
              onScroll={handleScroll}
            >
              {timeEntries.data.map((entry) => {
                const entryIsRunning = isEntryRunning(entry);
                const isResuming = resumingEntryId === entry.id;

                return (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          entryIsRunning
                            ? "bg-red-500 animate-pulse"
                            : "bg-green-500"
                        }`}
                      />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {entry.taskTitle || "Unknown Task"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {entry.projectName || "Unknown Project"} •{" "}
                          {new Date(entry.startTime).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                            }
                          )}
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
                            : entryIsRunning
                              ? "Now"
                              : "Stopped"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-medium text-gray-900">
                        {formatDuration(
                          entryIsRunning && activeTimer?.id === entry.id
                            ? (entry.duration || 0) + elapsedTime
                            : entry.duration || 0
                        )}
                      </span>
                      <div className="flex items-center space-x-1">
                        {entryIsRunning && activeTimer?.id === entry.id ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStopEntry(entry)}
                            disabled={isResuming}
                            className="w-8 h-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            {isResuming ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                            ) : (
                              <Square size={12} />
                            )}
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResumeEntry(entry)}
                            disabled={isResuming}
                            className="w-8 h-8 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                          >
                            {isResuming ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400"></div>
                            ) : (
                              <Play size={12} />
                            )}
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
                );
              })}

              {timeEntries.loading && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}

              {!timeEntries.hasMore && timeEntries.data.length > 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No more entries to load
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
