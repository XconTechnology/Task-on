"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CalendarDays, TrendingUp, ChevronLeft, ChevronRight, Clock, CheckCircle } from "lucide-react"
import { attendanceApi  } from "@/lib/attendance-api"
import { cn } from "@/lib/utils"
import { UserMonthlyAttendance } from "@/lib/types"

interface UserAttendanceProps {
  userId: string
  timeframe: string
}

export default function UserAttendance({ userId }: UserAttendanceProps) {
  const [monthlyAttendance, setMonthlyAttendance] = useState<UserMonthlyAttendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load monthly attendance
  const loadMonthlyAttendance = async (month: string) => {
    setLoading(true)
    try {
      const response = await attendanceApi.getUserMonthlyAttendance(userId, month)
      if (response.success && response.data) {
        setMonthlyAttendance(response.data)
      }
    } catch (error) {
      console.error("Failed to load monthly attendance:", error)
    } finally {
      setLoading(false)
      setHasLoaded(true)
    }
  }

  // Load attendance when component mounts or month changes
  useEffect(() => {
    if (hasLoaded) {
      loadMonthlyAttendance(selectedMonth)
    }
  }, [selectedMonth, hasLoaded])

  // Initial load when component becomes visible
  useEffect(() => {
    if (!hasLoaded) {
      loadMonthlyAttendance(selectedMonth)
    }
  }, [])

  // Format time duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  // Format attendance rate
  const formatAttendanceRate = (rate: number) => {
    return `${rate.toFixed(1)}%`
  }

  // Get attendance rate color
  const getAttendanceRateColor = (rate: number) => {
    if (rate >= 90) return "text-green-600"
    if (rate >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading && !monthlyAttendance) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const date = new Date(selectedMonth + "-01")
              date.setMonth(date.getMonth() - 1)
              setSelectedMonth(date.toISOString().slice(0, 7))
            }}
            className="shadow-sm"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-64 shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date()
                date.setMonth(date.getMonth() - i)
                const monthStr = date.toISOString().slice(0, 7)
                return (
                  <SelectItem key={monthStr} value={monthStr}>
                    {date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const date = new Date(selectedMonth + "-01")
              date.setMonth(date.getMonth() + 1)
              if (date <= new Date()) {
                setSelectedMonth(date.toISOString().slice(0, 7))
              }
            }}
            disabled={new Date(selectedMonth + "-01").getMonth() >= new Date().getMonth()}
            className="shadow-sm"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {monthlyAttendance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border shadow-sm bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/10 dark:to-slate-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Total Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{monthlyAttendance.stats.totalDays}</div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/10 dark:to-green-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Present Days
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{monthlyAttendance.stats.presentDays}</div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/10 dark:to-blue-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                Attendance Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold", getAttendanceRateColor(monthlyAttendance.stats.attendanceRate))}>
                {formatAttendanceRate(monthlyAttendance.stats.attendanceRate)}
              </div>
            </CardContent>
          </Card>

          <Card className="border shadow-sm bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-950/10 dark:to-purple-900/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Avg Hours/Day
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {monthlyAttendance.stats.averageHoursPerDay.toFixed(1)}h
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Monthly Calendar Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : monthlyAttendance ? (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {monthlyAttendance.monthName} {monthlyAttendance.year} - Attendance Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="p-3 text-center font-semibold text-sm text-muted-foreground bg-muted/30 rounded-lg"
                >
                  {day}
                </div>
              ))}
              {monthlyAttendance.days.map((day) => (
                <div
                  key={day.date}
                  className={cn(
                    "p-3 border rounded-lg min-h-[80px] bg-card transition-all duration-200",
                    day.isPresent
                      ? "border-green-200 bg-green-50/50 hover:bg-green-100/50"
                      : day.totalTimeWorked > 0
                        ? "border-yellow-200 bg-yellow-50/50 hover:bg-yellow-100/50"
                        : "border-red-200 bg-red-50/50 hover:bg-red-100/50",
                  )}
                >
                  <div className="text-sm font-semibold mb-2">{new Date(day.date).getDate()}</div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      {day.isPresent ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs px-2 py-1">
                          Present
                        </Badge>
                      ) : day.totalTimeWorked > 0 ? (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1">
                          Partial
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs px-2 py-1">
                          Absent
                        </Badge>
                      )}
                    </div>
                    {day.totalTimeWorked > 0 && (
                      <div className="text-xs text-center text-muted-foreground">
                        {formatDuration(day.totalTimeWorked)}
                      </div>
                    )}
                    {day.timeEntries > 0 && (
                      <div className="text-xs text-center text-muted-foreground">{day.timeEntries} entries</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg">No attendance data available</p>
        </div>
      )}
    </div>
  )
}
