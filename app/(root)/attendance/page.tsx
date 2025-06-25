"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { CalendarDays, Users, TrendingUp, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { AttendanceDetailsDialog } from "@/components/attendance/attendance-details-dialog"
import { attendanceApi } from "@/lib/attendance-api"
import { cn } from "@/lib/utils"
import { DailyAttendance, MonthlyAttendance } from "@/lib/types"

export default function AttendancePage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [dailyAttendance, setDailyAttendance] = useState<DailyAttendance | null>(null)
  const [monthlyAttendance, setMonthlyAttendance] = useState<MonthlyAttendance | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("daily")
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7))

  // Load daily attendance
  const loadDailyAttendance = async (date: Date) => {
    setLoading(true)
    try {
      const dateStr = date.toISOString().split("T")[0]
      const response = await attendanceApi.getDailyAttendance(dateStr)
      if (response.success && response.data) {
        setDailyAttendance(response.data)
      }
    } catch (error) {
      console.error("Failed to load daily attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  // Load monthly attendance
  const loadMonthlyAttendance = async (month: string) => {
    setLoading(true)
    try {
      const response = await attendanceApi.getMonthlyAttendance(month)
      if (response.success && response.data) {
        setMonthlyAttendance(response.data)
      }
    } catch (error) {
      console.error("Failed to load monthly attendance:", error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate attendance for today
  const calculateTodayAttendance = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split("T")[0]
      const response = await attendanceApi.calculateDailyAttendance(today)
      if (response.success) {
        await loadDailyAttendance(new Date())
      }
    } catch (error) {
      console.error("Failed to calculate attendance:", error)
    } finally {
      setLoading(false)
    }
  }

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

  useEffect(() => {
    loadDailyAttendance(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    if (activeTab === "monthly") {
      loadMonthlyAttendance(selectedMonth)
    }
  }, [activeTab, selectedMonth])

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="header-medium  font-bold text-foreground">Attendance Management</h1>
          <p className="text-muted-foreground text-medium">Track team attendance based on time entries</p>
        </div>
        <Button onClick={calculateTodayAttendance} disabled={loading} className="shadow-sm">
          <Sparkles className="w-4 h-4 mr-2 text-large" />
          Calculate Today&apos;s Attendance
        </Button>
      </div>

      {/* Stats Cards */}
      {dailyAttendance && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border shadow-sm bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/10 dark:to-blue-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyAttendance.totalUsers}</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/10 dark:to-green-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Present</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{dailyAttendance.presentCount}</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-gradient-to-br from-red-50/50 to-red-100/50 dark:from-red-950/10 dark:to-red-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absent</CardTitle>
              <TrendingUp className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dailyAttendance.absentCount}</div>
            </CardContent>
          </Card>
          <Card className="border shadow-sm bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-950/10 dark:to-purple-900/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAttendanceRate(
                  dailyAttendance.totalUsers > 0
                    ? (dailyAttendance.presentCount / dailyAttendance.totalUsers) * 100
                    : 0,
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          <TabsTrigger value="daily" className="text-medium">
            Daily View
          </TabsTrigger>
          <TabsTrigger value="monthly" className="text-medium">
            Monthly View
          </TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 ">
            {/* Date Picker */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  <h1 className="header-small">Select Date</h1>
                </CardTitle>
                <CardDescription className="text-xs">Choose a date to view attendance details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <DatePicker
                  date={selectedDate}
                  onDateChange={(date) => date && setSelectedDate(date)}
                  placeholder="Select date"
                  className="text-sm"
                />
                <div className="text-xs text-muted-foreground">
                  Selected:{" "}
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Daily Attendance List */}
            <Card className="lg:col-span-2 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                 <h1 className="header-small">Attendance for {selectedDate.toLocaleDateString()}</h1>
                </CardTitle>
                <CardDescription className="text-xs">
                  {dailyAttendance
                    ? `${dailyAttendance.presentCount} present, ${dailyAttendance.absentCount} absent`
                    : "Loading attendance data..."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  </div>
                ) : dailyAttendance && dailyAttendance.users.length > 0 ? (
                  <div className="space-y-4">
                    {dailyAttendance.users.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-all duration-200 hover:border-primary/20 bg-card"
                      >
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} alt={user.username} />
                            <AvatarFallback className="text-sm font-medium">
                              {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDuration(user.totalTimeWorked)}</p>
                            <p className="text-xs text-muted-foreground">{user.timeEntries} entries</p>
                          </div>
                          <Badge
                            variant={user.isPresent ? "default" : "secondary"}
                            className={cn(
                              "px-4 py-2 text-sm font-medium",
                              user.isPresent
                                ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-100"
                                : "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-100",
                            )}
                          >
                            {user.isPresent ? "Present" : "Absent"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-medium">No attendance data available for this date</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monthly" className="space-y-6">
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

          {monthlyAttendance && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <Card className="border shadow-sm bg-gradient-to-br from-slate-50/50 to-slate-100/50 dark:from-slate-950/10 dark:to-slate-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{monthlyAttendance.stats.totalDays}</div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm bg-gradient-to-br from-green-50/50 to-green-100/50 dark:from-green-950/10 dark:to-green-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Present Days</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{monthlyAttendance.stats.presentDays}</div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm bg-gradient-to-br from-blue-50/50 to-blue-100/50 dark:from-blue-950/10 dark:to-blue-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatAttendanceRate(monthlyAttendance.stats.attendanceRate)}
                  </div>
                </CardContent>
              </Card>
              <Card className="border shadow-sm bg-gradient-to-br from-purple-50/50 to-purple-100/50 dark:from-purple-950/10 dark:to-purple-900/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Avg Hours/Day</CardTitle>
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
                <CardTitle className="text-2xl">
                  {monthlyAttendance.monthName} {monthlyAttendance.year}
                </CardTitle>
                <CardDescription>Click on any date to view detailed attendance information</CardDescription>
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
                    <AttendanceDetailsDialog
                      key={day.date}
                      date={day.date}
                      presentCount={day.presentCount}
                      absentCount={day.absentCount}
                      totalUsers={day.totalUsers}
                    >
                      <div
                        className={cn(
                          "p-3 border rounded-lg hover:shadow-sm cursor-pointer transition-all duration-200 min-h-[70px] bg-card",
                          day.totalUsers > 0
                            ? "hover:border-primary/30 hover:bg-muted/20"
                            : "bg-muted/10 cursor-default hover:shadow-none",
                        )}
                      >
                        <div className="text-sm font-semibold mb-1">{new Date(day.date).getDate()}</div>
                        {day.totalUsers > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-600 font-medium">{day.presentCount}P</span>
                              <span className="text-red-600 font-medium">{day.absentCount}A</span>
                            </div>
                            <div className={cn("text-xs font-semibold", getAttendanceRateColor(day.attendanceRate))}>
                              {formatAttendanceRate(day.attendanceRate)}
                            </div>
                          </div>
                        )}
                      </div>
                    </AttendanceDetailsDialog>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No monthly data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
