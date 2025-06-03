"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { taskApi } from "@/lib/api"
import { Status } from "@/lib/types"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type TimelineViewProps = {
  projectId: string
  setIsModalNewTaskOpen: (isOpen: boolean) => void
}

export default function TimelineView({ projectId, setIsModalNewTaskOpen }: TimelineViewProps) {
  const { tasks, setTasks, isLoading, setLoading, setError } = useAppStore()
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [statusFilter, setStatusFilter] = useState<string>("all")

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true)
      try {
        const response = await taskApi.getTasks(projectId)
        if (response.success && response.data) {
          setTasks(response.data)
        } else {
          setError(response.error || "Failed to fetch tasks")
        }
      } catch (error) {
        setError("Network error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId, setTasks, setLoading, setError])

  const months = [
    "December",
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
  ]

  const filteredTasks = tasks.filter((task) => {
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const hasDate = task.dueDate || task.startDate
    return matchesStatus && hasDate
  })

  const getTaskPosition = (task: any) => {
    if (!task.startDate || !task.dueDate) return null

    const startDate = new Date(task.startDate)
    const endDate = new Date(task.dueDate)
    const startMonth = startDate.getMonth()
    const endMonth = endDate.getMonth()

    // Calculate position and width based on months
    const startPos = (startMonth / 12) * 100
    const width = ((endMonth - startMonth + 1) / 12) * 100

    return { left: `${startPos}%`, width: `${width}%` }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Project Tasks Timeline</h2>
          <div className="flex items-center space-x-4 mt-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentYear(currentYear - 1)}>
              <ChevronLeft size={16} />
            </Button>
            <span className="font-medium text-gray-700">{currentYear}</span>
            <Button variant="outline" size="sm" onClick={() => setCurrentYear(currentYear + 1)}>
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value={Status.ToDo}>To Do</SelectItem>
              <SelectItem value={Status.WorkInProgress}>In Progress</SelectItem>
              <SelectItem value={Status.UnderReview}>Under Review</SelectItem>
              <SelectItem value={Status.Completed}>Completed</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-600">Month</span>
        </div>
      </div>

      {/* Timeline */}
      <Card className="bg-white">
        <CardContent className="p-0">
          {/* Timeline Header */}
          <div className="border-b border-gray-200">
            <div className="grid grid-cols-12 text-center text-sm font-medium text-gray-700 py-4">
              {months.map((month, index) => (
                <div key={index} className="border-r border-gray-100 last:border-r-0">
                  {month}
                </div>
              ))}
            </div>
          </div>

          {/* Timeline Content */}
          <div className="divide-y divide-gray-100">
            {/* Header Row */}
            <div className="grid grid-cols-12 bg-gray-50 text-sm font-medium text-gray-700 py-3">
              <div className="col-span-3 px-4">Name</div>
              <div className="col-span-2 px-4">From</div>
              <div className="col-span-2 px-4">To</div>
              <div className="col-span-5 px-4 relative">
                <div className="grid grid-cols-12 h-full">
                  {months.map((month, index) => (
                    <div key={index} className="border-r border-gray-200 last:border-r-0 h-full"></div>
                  ))}
                </div>
              </div>
            </div>

            {/* Task Rows */}
            {filteredTasks.map((task) => {
              const position = getTaskPosition(task)
              const taskId = task.id.split("_")[1] || task.id

              return (
                <div key={task.id} className="grid grid-cols-12 py-4 hover:bg-gray-50">
                  <div className="col-span-3 px-4">
                    <div className="font-medium text-gray-900">Task {taskId}</div>
                  </div>
                  <div className="col-span-2 px-4 text-sm text-gray-600">
                    {task.startDate
                      ? new Date(task.startDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </div>
                  <div className="col-span-2 px-4 text-sm text-gray-600">
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </div>
                  <div className="col-span-5 px-4 relative">
                    <div className="grid grid-cols-12 h-8 relative">
                      {months.map((month, index) => (
                        <div key={index} className="border-r border-gray-200 last:border-r-0 h-full"></div>
                      ))}

                      {/* Task Bar */}
                      {position && (
                        <div
                          className="absolute top-1 h-6 bg-gray-800 rounded text-white text-xs flex items-center justify-center font-medium"
                          style={position}
                        >
                          Task {taskId}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add New Task Button */}
          <div className="p-4 border-t border-gray-200">
            <Button onClick={() => setIsModalNewTaskOpen(true)} className="bg-blue-600 hover:bg-blue-700" size="sm">
              Add New Task
            </Button>
          </div>
        </CardContent>
      </Card>

      {filteredTasks.length === 0 && (
        <Card className="bg-white">
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks with dates found</h3>
              <p>Add start and due dates to your tasks to see them in the timeline.</p>
            </div>
            <Button onClick={() => setIsModalNewTaskOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              Create Task
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
