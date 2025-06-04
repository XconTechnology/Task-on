import { create } from "zustand"
import type { Status, Priority, Task } from "@/lib/types"

interface SearchFilterState {
  // Search
  searchQuery: string
  setSearchQuery: (query: string) => void

  // Filters
  statusFilter: Status | "all"
  priorityFilter: Priority | "all"
  assigneeFilter: string | "all"
  dueDateFilter: "all" | "overdue" | "today" | "this-week" | "no-date"

  setStatusFilter: (status: Status | "all") => void
  setPriorityFilter: (priority: Priority | "all") => void
  setAssigneeFilter: (assignee: string | "all") => void
  setDueDateFilter: (filter: "all" | "overdue" | "today" | "this-week" | "no-date") => void

  // Clear all filters
  clearAllFilters: () => void

  // Filter tasks
  filterTasks: (tasks: Task[]) => Task[]

  // Get active filter count
  getActiveFilterCount: () => number
}

export const useSearchFilterStore = create<SearchFilterState>((set, get) => ({
  // Initial state
  searchQuery: "",
  statusFilter: "all",
  priorityFilter: "all",
  assigneeFilter: "all",
  dueDateFilter: "all",

  // Setters
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (status) => set({ statusFilter: status }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setAssigneeFilter: (assignee) => set({ assigneeFilter: assignee }),
  setDueDateFilter: (filter) => set({ dueDateFilter: filter }),

  // Clear all filters
  clearAllFilters: () =>
    set({
      searchQuery: "",
      statusFilter: "all",
      priorityFilter: "all",
      assigneeFilter: "all",
      dueDateFilter: "all",
    }),

  // Filter tasks based on current filters
  filterTasks: (tasks: Task[]) => {
    const state = get()

    return tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        !state.searchQuery ||
        task.title.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(state.searchQuery.toLowerCase())

      // Status filter
      const matchesStatus = state.statusFilter === "all" || task.status === state.statusFilter

      // Priority filter
      const matchesPriority = state.priorityFilter === "all" || task.priority === state.priorityFilter

      // Assignee filter
      const matchesAssignee =
        state.assigneeFilter === "all" ||
        task.assignee?.id === state.assigneeFilter ||
        (state.assigneeFilter === "unassigned" && !task.assignee)

      // Due date filter
      let matchesDueDate = true
      if (state.dueDateFilter !== "all") {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const taskDueDate = task.dueDate ? new Date(task.dueDate) : null

        switch (state.dueDateFilter) {
          case "overdue":
            matchesDueDate = taskDueDate ? taskDueDate < today : false
            break
          case "today":
            matchesDueDate = taskDueDate ? taskDueDate.toDateString() === today.toDateString() : false
            break
          case "this-week":
            if (taskDueDate) {
              const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
              matchesDueDate = taskDueDate >= today && taskDueDate <= weekFromNow
            } else {
              matchesDueDate = false
            }
            break
          case "no-date":
            matchesDueDate = !taskDueDate
            break
        }
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesAssignee && matchesDueDate
    })
  },

  // Get count of active filters
  getActiveFilterCount: () => {
    const state = get()
    let count = 0

    if (state.searchQuery) count++
    if (state.statusFilter !== "all") count++
    if (state.priorityFilter !== "all") count++
    if (state.assigneeFilter !== "all") count++
    if (state.dueDateFilter !== "all") count++

    return count
  },
}))
