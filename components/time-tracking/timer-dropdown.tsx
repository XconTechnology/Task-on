"use client"
import { Square, Clock, Calendar, Tag, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useTimeTracking } from "@/lib/contexts/time-tracking-context"
import { useUser } from "@/lib/user-context"
import { formatTime, formatDuration } from "@/lib/utils"

interface TimerDropdownProps {
  onTaskClick?: (taskId: string) => void
}

export default function TimerDropdown({ onTaskClick }: TimerDropdownProps) {
  const { activeTimer, elapsedTime, stopTimer, isLoading, timeEntries } = useTimeTracking()
  const { user } = useUser()

  if (!activeTimer) {
    return null
  }

  const handleStopTimer = async () => {
    try {
      await stopTimer()
    } catch (error) {
      console.error("Failed to stop timer:", error)
    }
  }

  const handleTaskClick = () => {
    if (onTaskClick) {
      onTaskClick(activeTimer.taskId)
    }
  }

  // Calculate total time including previous sessions
  const totalElapsed = (activeTimer.previousDuration || 0) + elapsedTime
  const recentEntries = timeEntries.slice(0, 5) // Show more entries

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-3 bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border border-red-200/50 rounded-xl px-4 py-2.5 transition-all duration-300 shadow-sm hover:shadow-md group"
        >
          <div className="relative">
            <div className="w-2.5 h-2.5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full animate-pulse shadow-sm" />
            <div className="absolute inset-0 w-2.5 h-2.5 bg-red-400 rounded-full animate-ping opacity-75" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-mono font-bold text-red-700 leading-none">{formatTime(totalElapsed)}</span>
            <span className="text-xs text-red-600/80 leading-none mt-0.5 truncate max-w-32">
              {activeTimer.taskTitle}
            </span>
          </div>
          <div className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors group-hover:scale-105">
            <Square size={10} className="text-white" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-96 p-0 bg-white shadow-2xl border-0 rounded-2xl overflow-hidden max-h-[80vh]"
      >
        <div className="flex flex-col max-h-[80vh]">
          {/* Header with gradient - Fixed */}
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-sm">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Active Timer</h3>
                  <p className="text-sm text-gray-600">
                    {Math.floor(totalElapsed / 60)}m {totalElapsed % 60}s tracked
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Status</div>
                <div className="flex items-center space-x-1 mt-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-700">Recording</span>
                </div>
              </div>
            </div>

            {/* Progress visualization */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-500 to-pink-500 h-2 rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: "100%" }}
                />
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* User and Timer Display */}
            <div className="px-6 py-5">
              <div className="flex items-center space-x-4 mb-6">
                <Avatar className="h-12 w-12 border-3 border-purple-200 shadow-sm">
                  <AvatarImage src={user?.profilePictureUrl || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 text-sm font-semibold">
                    {user?.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">{user?.username}</h4>
                  <p className="text-sm text-gray-600">Currently tracking time</p>
                </div>
              </div>

              {/* Large Timer Display */}
              <div className="text-center mb-6 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                <div className="text-4xl font-mono font-bold text-gray-900 mb-3 tracking-tight">
                  {formatTime(totalElapsed)}
                </div>
                <div className="flex items-center justify-center space-x-4">
                  <Button
                    onClick={handleStopTimer}
                    disabled={isLoading}
                    className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-xl px-6 py-2.5 font-medium shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <Square size={14} className="mr-2" />
                        Stop Timer
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Task Info Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full mt-1 shadow-sm" />
                  <div className="flex-1">
                    <h4
                      className="text-base font-semibold text-gray-900 cursor-pointer hover:text-blue-600 transition-colors mb-2"
                      onClick={handleTaskClick}
                    >
                      {activeTimer.taskTitle}
                    </h4>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>
                          Started at{" "}
                          {new Date(activeTimer.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {activeTimer.previousDuration > 0 && (
                        <div className="flex items-center space-x-2 text-sm text-blue-600">
                          <Tag className="w-4 h-4" />
                          <span>Previous sessions: {formatDuration(activeTimer.previousDuration)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Entries - Scrollable */}
            {recentEntries.length > 0 && (
              <div className="border-t border-gray-100 bg-gray-50">
                <div className="px-6 py-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Recent Entries
                  </h5>
                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                    {recentEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-gray-400 rounded-full" />
                          <div>
                            <span className="text-sm font-medium text-gray-900">{entry.taskTitle}</span>
                            <p className="text-xs text-gray-500">{entry.projectName}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium text-gray-700">{formatDuration(entry.duration)}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-6 h-6 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                          >
                            <Play size={10} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Fixed */}
          <div className="px-6 py-3 border-t border-gray-200 bg-white flex-shrink-0">
            <div className="flex items-center justify-between text-sm">
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
                <Clock className="w-4 h-4" />
                <span>View Timesheet</span>
              </button>
              <button className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 font-medium transition-colors">
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
