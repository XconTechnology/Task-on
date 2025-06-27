"use client"

import { useState } from "react"
import { Search, Filter, X, ChevronDown, Calendar, User, Flag, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useSearchFilterStore } from "@/lib/search-filter-store"
import { useAppStore } from "@/lib/store"
import { Status, Priority } from "@/lib/types"


export default function SearchFilterBar() {
  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    priorityFilter,
    assigneeFilter,
    dueDateFilter,
    setStatusFilter,
    setPriorityFilter,
    setAssigneeFilter,
    setDueDateFilter,
    clearAllFilters,
    getActiveFilterCount,
  } = useSearchFilterStore()

  const { tasks } = useAppStore()
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  const activeFilterCount = getActiveFilterCount()

  // Get unique assignees from tasks
  const uniqueAssignees = Array.from(
    new Map(tasks.filter((task) => task.assignee).map((task) => [task.assignee!.id, task.assignee!])).values(),
  )

  const statusOptions = [
    { value: Status.ToDo, label: "To Do", icon: "🔵" },
    { value: Status.WorkInProgress, label: "In Progress", icon: "🟢" },
    { value: Status.UnderReview, label: "Under Review", icon: "🟡" },
    { value: Status.Completed, label: "Completed", icon: "✅" },
  ]

  const priorityOptions = [
    { value: Priority.Urgent, label: "Urgent", color: "text-red-600" },
    { value: Priority.High, label: "High", color: "text-orange-600" },
    { value: Priority.Medium, label: "Medium", color: "text-yellow-600" },
    { value: Priority.Low, label: "Low", color: "text-green-600" },
    { value: Priority.Backlog, label: "Backlog", color: "text-gray-600" },
  ]

  const dueDateOptions = [
    { value: "overdue", label: "Overdue", icon: "🔴" },
    { value: "today", label: "Due Today", icon: "📅" },
    { value: "this-week", label: "Due This Week", icon: "📆" },
    { value: "no-date", label: "No Due Date", icon: "➖" },
  ]

  return (
    <div className="flex items-center ">
      <div className="flex items-center space-x-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-80 border-gray-300 "
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-6 w-6"
            >
              <X size={12} />
            </Button>
          )}
        </div>

        {/* Filter Dropdown */}
        <DropdownMenu open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={`relative ${activeFilterCount > 0 ? "border-blue-500 bg-blue-50" : ""}`}
            >
              <Filter size={16} className="mr-2" />
              <span>Filter</span>
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-2 bg-blue-600 text-white text-xs px-1.5 py-0.5 min-w-[18px] h-[18px] flex items-center justify-center"
                >
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown size={14} className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-80 p-0 max-h-[80vh] overflow-hidden" align="start">
            <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
              {/* Filter Header */}
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-blue-600 hover:text-blue-700 h-auto p-0"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <CheckCircle size={14} className="mr-2" />
                  Status
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={statusFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStatusFilter("all")}
                    className="justify-start text-xs"
                  >
                    All Status
                  </Button>
                  {statusOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={statusFilter === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setStatusFilter(option.value)}
                      className="justify-start text-xs"
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Flag size={14} className="mr-2" />
                  Priority
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={priorityFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPriorityFilter("all")}
                    className="justify-start text-xs"
                  >
                    All Priority
                  </Button>
                  {priorityOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={priorityFilter === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPriorityFilter(option.value)}
                      className="justify-start text-xs"
                    >
                      <span className={`mr-1 ${option.color}`}>●</span>
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Assignee Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <User size={14} className="mr-2" />
                  Assignee
                </label>
                <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar">
                  <Button
                    variant={assigneeFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssigneeFilter("all")}
                    className="w-full justify-start text-xs"
                  >
                    All Assignees
                  </Button>
                  <Button
                    variant={assigneeFilter === "unassigned" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAssigneeFilter("unassigned")}
                    className="w-full justify-start text-xs"
                  >
                    <div className="w-5 h-5 rounded-full bg-gray-200 mr-2" />
                    Unassigned
                  </Button>
                  {uniqueAssignees.map((assignee) => (
                    <Button
                      key={assignee.id}
                      variant={assigneeFilter === assignee.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAssigneeFilter(assignee.id)}
                      className="w-full justify-start text-xs"
                    >
                      <Avatar className="w-5 h-5 mr-2">
                        <AvatarImage src={assignee.profilePictureUrl || "/placeholder.svg"} />
                        <AvatarFallback className="text-xs">{assignee.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      {assignee.username}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Due Date Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 flex items-center">
                  <Calendar size={14} className="mr-2" />
                  Due Date
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={dueDateFilter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setDueDateFilter("all")}
                    className="justify-start text-xs"
                  >
                    All Dates
                  </Button>
                  {dueDateOptions.map((option) => (
                    <Button
                      key={option.value}
                      variant={dueDateFilter === option.value ? "default" : "outline"}
                      size="sm"
                      onClick={() => setDueDateFilter(option.value as any)}
                      className="justify-start text-xs"
                    >
                      <span className="mr-1">{option.icon}</span>
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
   
    </div>
  )
}
