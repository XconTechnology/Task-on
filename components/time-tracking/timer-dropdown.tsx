"use client"
import { Square, Clock, Calendar, Tag } from "lucide-react"
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

  const recentEntries = timeEntries.slice(0, 3)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center space-x-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg px-3 py-2 transition-all duration-200"
        >
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-sm font-mono font-bold text-red-700">{formatTime(elapsedTime)}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 bg-white shadow-xl border-0 rounded-xl">
        <div className="p-0">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-semibold text-gray-900">Track Time</span>
              </div>
              <div className="text-xs text-gray-500">
                {Math.floor(elapsedTime / 60)}m/{Math.floor(elapsedTime / 3600)}h
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-2 w-full bg-gray-200 rounded-full h-1">
              <div className="bg-red-500 h-1 rounded-full transition-all duration-300" style={{ width: "100%" }} />
            </div>
          </div>

          {/* User and Timer */}
          <div className="px-4 py-4">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar className="h-8 w-8 border-2 border-purple-200">
                <AvatarImage src={user?.profilePictureUrl || "/placeholder.svg"} />
                <AvatarFallback className="bg-purple-100 text-purple-800 text-xs">
                  {user?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">{user?.username}</span>
            </div>

            {/* Large Timer Display */}
            <div className="text-center mb-4">
              <div className="text-3xl font-mono font-bold text-gray-900 mb-1">{formatTime(elapsedTime)}</div>
              <Button
                onClick={handleStopTimer}
                disabled={isLoading}
                size="sm"
                className="bg-red-500 hover:bg-red-600 text-white rounded-full w-8 h-8 p-0"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent" />
                ) : (
                  <Square size={12} />
                )}
              </Button>
            </div>

            {/* Task Info */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span
                  className="text-sm font-medium text-gray-900 cursor-pointer hover:text-blue-600 transition-colors"
                  onClick={handleTaskClick}
                >
                  {activeTimer.taskTitle}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <span>
                  {new Date(activeTimer.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} — Now
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Tag className="w-3 h-3" />
                <span>Notes</span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-gray-400">
                <Tag className="w-3 h-3" />
                <span>Add tags</span>
              </div>
            </div>
          </div>

          {/* Recent Entries */}
          {recentEntries.length > 0 && (
            <div className="border-t border-gray-100">
              <div className="px-4 py-3">
                <div className="text-xs font-medium text-gray-500 mb-3">
                  {new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </div>
                <div className="space-y-2">
                  {recentEntries.map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between py-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-gray-700">{entry.taskTitle}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-gray-500">{formatDuration(entry.duration)}</span>
                        <Button variant="ghost" size="sm" className="w-4 h-4 p-0 text-gray-400 hover:text-gray-600">
                          <Square size={8} />
                        </Button>
                        <Button variant="ghost" size="sm" className="w-4 h-4 p-0 text-gray-400 hover:text-red-500">
                          ×
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <div className="flex items-center justify-between text-xs">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                    <Clock className="w-3 h-3" />
                    <span>My Timesheet</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800">
                    <span>Dashboard</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
