"use client"

import { useEffect, useState } from "react"
import { useAppStore } from "@/lib/store"
import { taskApi } from "@/lib/api"
import { Status, Priority } from "@/lib/types"
import { Search, MoreHorizontal, Plus, ArrowUpDown, Calendar } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

type TableViewProps = {
  projectId: string
  setIsModalNewTaskOpen: (isOpen: boolean) => void
}

export default function TableView({ projectId, setIsModalNewTaskOpen }: TableViewProps) {
  const { tasks, setTasks, isLoading, setLoading, setError } = useAppStore()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
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
        setError("Network error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId, setTasks, setLoading, setError])

  // Filter and sort tasks
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch =
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilter === "all" || task.status === statusFilter
      const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter

      return matchesSearch && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
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
        case "points":
          comparison = (a.points || 0) - (b.points || 0)
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
          <p className="text-gray-600 mt-1">{filteredTasks.length} tasks found</p>
        </div>
        <Button onClick={() => setIsModalNewTaskOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus size={16} className="mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={Status.ToDo}>To Do</SelectItem>
                <SelectItem value={Status.WorkInProgress}>In Progress</SelectItem>
                <SelectItem value={Status.UnderReview}>Under Review</SelectItem>
                <SelectItem value={Status.Completed}>Completed</SelectItem>
              </SelectContent>
            </Select>

            {/* Priority Filter */}
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value={Priority.Urgent}>Urgent</SelectItem>
                <SelectItem value={Priority.High}>High</SelectItem>
                <SelectItem value={Priority.Medium}>Medium</SelectItem>
                <SelectItem value={Priority.Low}>Low</SelectItem>
                <SelectItem value={Priority.Backlog}>Backlog</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

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
              {filteredTasks.map((task) => (
                <TableRow key={task.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900 mb-1">{task.title}</div>
                      {task.description && <div className="text-sm text-gray-600 line-clamp-2">{task.description}</div>}
                      {task.tags && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags
                            .split(",")
                            .slice(0, 2)
                            .map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag.trim()}
                              </Badge>
                            ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusConfig[task.status].color}>{statusConfig[task.status].label}</Badge>
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
                          <AvatarImage src={task.assignee.profilePictureUrl || "/placeholder.svg"} />
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
                    {task.points ? (
                      <Badge variant="outline">{task.points} pts</Badge>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
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

          {filteredTasks.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Search size={48} className="mx-auto mb-4" />
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
