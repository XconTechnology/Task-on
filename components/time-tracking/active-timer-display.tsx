"use client"

import { useState } from "react"
import { Square, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useTimeTracking } from "@/lib/contexts/time-tracking-context"
import { formatTime } from "@/lib/utils"

interface ActiveTimerDisplayProps {
  onTaskClick?: (taskId: string) => void
  compact?: boolean
}

export default function ActiveTimerDisplay({ onTaskClick, compact = false }: ActiveTimerDisplayProps) {
  const { activeTimer, elapsedTime, stopTimer, isLoading } = useTimeTracking()
  const [isExpanded, setIsExpanded] = useState(false)

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

  if (compact) {
    return (
      <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <span className="text-sm font-mono font-bold text-red-700">{formatTime(elapsedTime)}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
        >
          <ExternalLink size={12} />
        </Button>
      </div>
    )
  }

  return (
    <Card className="bg-white border-red-200 shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <div>
              <h4
                className="text-sm font-semibold text-gray-900 cursor-pointer hover:text-blue-600"
                onClick={handleTaskClick}
              >
                {activeTimer.taskTitle}
              </h4>
              <p className="text-xs text-gray-600">{activeTimer.projectName}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-2xl font-mono font-bold text-red-600">{formatTime(elapsedTime)}</div>
              <div className="text-xs text-gray-500">
                Started at{" "}
                {new Date(activeTimer.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
            <Button
              onClick={handleStopTimer}
              disabled={isLoading}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Square size={14} />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
