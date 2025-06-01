"use client"

import { useState, useEffect } from "react"
import { Play, Pause, Square, Clock, Calendar, BarChart3, Filter, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChartContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, COLORS } from "@/components/ui/chart"

interface TimeEntry {
  id: string
  taskName: string
  projectName: string
  startTime: Date
  endTime?: Date
  duration: number // in seconds
  isRunning: boolean
}

export default function TimeTrackingContent() {
  const [currentTask, setCurrentTask] = useState("")
  const [isTracking, setIsTracking] = useState(false)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])

  // Mock data for charts
  const weeklyData = [
    { day: "Mon", hours: 6.5 },
    { day: "Tue", hours: 8.2 },
    { day: "Wed", hours: 7.1 },
    { day: "Thu", hours: 9.3 },
    { day: "Fri", hours: 5.8 },
    { day: "Sat", hours: 2.5 },
    { day: "Sun", hours: 1.2 },
  ]

  const projectData = [
    { project: "E-commerce", hours: 25.5 },
    { project: "Mobile App", hours: 18.3 },
    { project: "Dashboard", hours: 12.7 },
    { project: "Marketing", hours: 8.9 },
  ]

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isTracking && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime.getTime()) / 1000))
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isTracking, startTime])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const handleStartTracking = () => {
    if (!currentTask.trim()) return
    setIsTracking(true)
    setStartTime(new Date())
    setElapsedTime(0)
  }

  const handlePauseTracking = () => {
    setIsTracking(false)
  }

  const handleStopTracking = () => {
    if (startTime && currentTask.trim()) {
      const newEntry: TimeEntry = {
        id: Date.now().toString(),
        taskName: currentTask,
        projectName: "Current Project",
        startTime,
        endTime: new Date(),
        duration: elapsedTime,
        isRunning: false,
      }
      setTimeEntries([newEntry, ...timeEntries])
    }
    setIsTracking(false)
    setStartTime(null)
    setElapsedTime(0)
    setCurrentTask("")
  }

  const totalHoursToday = timeEntries
    .filter((entry) => {
      const today = new Date()
      const entryDate = new Date(entry.startTime)
      return entryDate.toDateString() === today.toDateString()
    })
    .reduce((total, entry) => total + entry.duration / 3600, 0)

  const totalHoursWeek = timeEntries.reduce((total, entry) => total + entry.duration / 3600, 0)

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="header-large">Time Tracking</h1>
          <p className="text-description mt-1">Track time spent on tasks and monitor your productivity.</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Filter size={16} className="mr-2" />
            <span className="text-medium">Filter</span>
          </Button>
          <Button variant="outline">
            <Download size={16} className="mr-2" />
            <span className="text-medium">Export</span>
          </Button>
        </div>
      </div>

      {/* Timer Section */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span>Current Timer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="What are you working on?"
                value={currentTask}
                onChange={(e) => setCurrentTask(e.target.value)}
                disabled={isTracking}
              />
            </div>
            <div className="text-3xl font-mono font-bold text-gray-900 min-w-[120px]">{formatTime(elapsedTime)}</div>
            <div className="flex items-center space-x-2">
              {!isTracking ? (
                <Button
                  onClick={handleStartTracking}
                  disabled={!currentTask.trim()}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Play size={16} className="mr-2" />
                  <span className="text-medium">Start</span>
                </Button>
              ) : (
                <>
                  <Button onClick={handlePauseTracking} variant="outline">
                    <Pause size={16} className="mr-2" />
                    <span className="text-medium">Pause</span>
                  </Button>
                  <Button onClick={handleStopTracking} className="bg-red-600 hover:bg-red-700 text-white">
                    <Square size={16} className="mr-2" />
                    <span className="text-medium">Stop</span>
                  </Button>
                </>
              )}
            </div>
          </div>
          {isTracking && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-medium text-green-700">Tracking: {currentTask}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-small uppercase tracking-wide">Today</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalHoursToday.toFixed(1)}h</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-blue-500 mr-1" />
                  <span className="text-small text-blue-600">Hours tracked</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-small uppercase tracking-wide">This Week</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalHoursWeek.toFixed(1)}h</p>
                <div className="flex items-center mt-2">
                  <BarChart3 className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-small text-green-600">Total hours</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-small uppercase tracking-wide">Avg/Day</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">6.8h</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-purple-500 mr-1" />
                  <span className="text-small text-purple-600">Daily average</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-small uppercase tracking-wide">Productivity</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">94%</p>
                <div className="flex items-center mt-2">
                  <BarChart3 className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-small text-orange-600">Efficiency score</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Hours Chart */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <span>Weekly Hours</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Bar dataKey="hours" fill={COLORS.primary} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        {/* Project Time Distribution */}
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span>Time by Project</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ChartContainer>
                <BarChart data={projectData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="project" type="category" tick={{ fontSize: 12 }} width={80} />
                  <Bar dataKey="hours" fill={COLORS.secondary} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Time Entries */}
      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Recent Time Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {timeEntries.length === 0 ? (
            <div className="text-center py-8">
              <Clock size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="header-small mb-2">No time entries yet</h3>
              <p className="text-description">Start tracking time on your tasks to see entries here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {timeEntries.slice(0, 10).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="text-medium font-semibold text-gray-900">{entry.taskName}</h4>
                    <p className="text-small text-gray-600">{entry.projectName}</p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-medium font-semibold text-gray-900">{formatTime(entry.duration)}</p>
                      <p className="text-small text-gray-600">
                        {entry.startTime.toLocaleDateString()}{" "}
                        {entry.startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      Completed
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
