"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, Clock, Users, TrendingUp, TrendingDown } from "lucide-react"
import { attendanceApi } from "@/lib/attendance-api"
import type { DailyAttendance } from "@/lib/attendance-types"

interface AttendanceDetailsDialogProps {
  date: string
  children: React.ReactNode
  presentCount?: number
  absentCount?: number
  totalUsers?: number
}

export function AttendanceDetailsDialog({
  date,
  children,
  presentCount = 0,
  absentCount = 0,
  totalUsers = 0,
}: AttendanceDetailsDialogProps) {
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const loadAttendanceDetails = async () => {
    if (!open) return

    setLoading(true)
    try {
      const response = await attendanceApi.getDailyAttendance(date)
      if (response.success && response.data) {
        setDailyAttendance(response.data)
      }
    } catch (error) {
      console.error("Failed to load attendance details:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadAttendanceDetails()
    }
  }, [open, date])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const attendanceRate = totalUsers > 0 ? (presentCount / totalUsers) * 100 : 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Details
          </DialogTitle>
          <DialogDescription>{formatDate(date)}</DialogDescription>
        </DialogHeader>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-3 py-3">
          <div className="text-center p-3 bg-muted/30 rounded-lg">
            <Users className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
            <div className="text-xl font-bold">{totalUsers}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 bg-green-50/50 dark:bg-green-950/10 rounded-lg">
            <TrendingUp className="h-4 w-4 mx-auto mb-1 text-green-600" />
            <div className="text-xl font-bold text-green-700">{presentCount}</div>
            <div className="text-xs text-muted-foreground">Present</div>
          </div>
          <div className="text-center p-3 bg-red-50/50 dark:bg-red-950/10 rounded-lg">
            <TrendingDown className="h-4 w-4 mx-auto mb-1 text-red-600" />
            <div className="text-xl font-bold text-red-700">{absentCount}</div>
            <div className="text-xs text-muted-foreground">Absent</div>
          </div>
          <div className="text-center p-3 bg-blue-50/50 dark:bg-blue-950/10 rounded-lg">
            <Clock className="h-4 w-4 mx-auto mb-1 text-blue-600" />
            <div className="text-xl font-bold text-blue-700">{attendanceRate.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">Rate</div>
          </div>
        </div>

        <Separator />

        {/* Attendance List */}
        <ScrollArea className="h-96 pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : dailyAttendance && dailyAttendance.users.length > 0 ? (
            <div className="space-y-3">
              {/* Present Users */}
              {dailyAttendance.users.filter((user) => user.isPresent).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-600 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Present ({dailyAttendance.users.filter((user) => user.isPresent).length})
                  </h4>
                  <div className="space-y-2">
                    {dailyAttendance.users
                      .filter((user) => user.isPresent)
                      .map((user) => (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between p-3 bg-green-50/30 dark:bg-green-950/5 rounded-lg border border-green-100 dark:border-green-900/20"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} alt={user.username} />
                              <AvatarFallback className="text-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-green-700 dark:text-green-400">
                              {formatDuration(user.totalTimeWorked)}
                            </div>
                            <div className="text-xs text-muted-foreground">{user.timeEntries} entries</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Absent Users */}
              {dailyAttendance.users.filter((user) => !user.isPresent).length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4" />
                    Absent ({dailyAttendance.users.filter((user) => !user.isPresent).length})
                  </h4>
                  <div className="space-y-2">
                    {dailyAttendance.users
                      .filter((user) => !user.isPresent)
                      .map((user) => (
                        <div
                          key={user.userId}
                          className="flex items-center justify-between p-3 bg-red-50/30 dark:bg-red-950/5 rounded-lg border border-red-100 dark:border-red-900/20"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} alt={user.username} />
                              <AvatarFallback className="text-xs">
                                {user.username.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{user.username}</p>
                              <p className="text-xs text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-red-700 dark:text-red-400">
                              {formatDuration(user.totalTimeWorked)}
                            </div>
                            <div className="text-xs text-muted-foreground">{user.timeEntries} entries</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No attendance data available for this date</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
