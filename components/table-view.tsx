"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { useSearchFilterStore } from "@/lib/search-filter-store"
import { taskApi } from "@/lib/api"
import { Status } from "@/lib/types"
import { MoreHorizontal, Plus, ArrowUpDown, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"

type TableViewProps = {
  projectId: string
  setIsModalNewTaskOpen: (isOpen: boolean) => void
}

export default function TableView({ projectId, setIsModalNewTaskOpen }: TableViewProps) {
  const { tasks, setTasks, isLoading, setLoading, setError } = useAppStore()
  const { filterTasks } = useSearchFilterStore()
  const [sortBy, setSortBy] = useState<string>("dueDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

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
        setError(`Network error occurred ${error}`)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId, setTasks, setLoading, setError])

  // Apply search and filters, then sort
  const filteredAndSortedTasks = filterTasks(tasks).sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "dueDate":
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        break
      case "priority":
        const priorityOrder = { Urgent: 0, High: 1, Medium: 2, Low: 3, Backlog: 4 }
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority]
        break
      case "title":
        comparison = a.title.localeCompare(b.title)
        break
      case "status":
        comparison = a.status.localeCompare(b.status)
        break
      default:
        return 0
    }

    return sortOrder === "asc" ? comparison : -comparison
  })

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("asc")
    }
  }

  const statusConfig = {
    [Status.ToDo]: { color: "bg-blue-100 text-blue-700", label: "To Do" },
    [Status.WorkInProgress]: { color: "bg-green-100 text-green-700", label: "In Progress" },
    [Status.UnderReview]: { color: "bg-yellow-100 text-yellow-700", label: "Under Review" },
    [Status.Completed]: { color: "bg-gray-100 text-gray-700", label: "Completed" },
  }

  const priorityConfig = {
    Urgent: "bg-red-100 text-red-700",
    High: "bg-orange-100 text-orange-700",
    Medium: "bg-yellow-100 text-yellow-700",
    Low: "bg-green-100 text-green-700",
    Backlog: "bg-gray-100 text-gray-700",
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Table</h2>
          <p className="text-gray-600 mt-1">{filteredAndSortedTasks.length} tasks found</p>
        </div>
        <Button onClick={() => setIsModalNewTaskOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" />
          Add Task
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[300px]">
                  <Button variant="ghost" onClick={() => handleSort("title")} className="h-auto p-0 font-semibold">
                    Task
                    <ArrowUpDown size={14} className="ml-2" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-semibold">
                    Status
                    <ArrowUpDown size={14} className="ml-2" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("priority")} className="h-auto p-0 font-semibold">
                    Priority
                    <ArrowUpDown size={14} className="ml-2" />
                  </Button>
                </TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("dueDate")} className="h-auto p-0 font-semibold">
                    Due Date
                    <ArrowUpDown size={14} className="ml-2" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button variant="ghost" onClick={() => handleSort("points")} className="h-auto p-0 font-semibold">
                    Points
                    <ArrowUpDown size={14} className="ml-2" />
                  </Button>
                </TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedTasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{task.title}</div>
                      {task.description && <div className="text-sm text-gray-600 line-clamp-2">{task.description}</div>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[task.status]?.color}>{statusConfig[task.status]?.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {task.priority && (
                      <Badge variant="outline" className={priorityConfig[task.priority]}>
                        {task.priority}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.assignee ? (
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={ "/placeholder.svg"} />
                          <AvatarFallback className="text-xs">
                            {task.assignee.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{task.assignee.username}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">Unassigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {task.dueDate ? (
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar size={14} />
                        <span>{format(new Date(task.dueDate), "MMM dd, yyyy")}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No due date</span>
                    )}
                  </TableCell>
                  <TableCell>
                      <span className="text-gray-400 text-sm">-</span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                      <MoreHorizontal size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredAndSortedTasks.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p>Try adjusting your search or filters, or create a new task.</p>
              </div>
              <Button onClick={() => setIsModalNewTaskOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Plus size={16} className="mr-2" />
                Create Task
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
