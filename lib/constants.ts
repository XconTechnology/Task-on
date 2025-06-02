import { CheckCircle, Circle, Pause, Play } from "lucide-react"
import { type Project, type Task, type User, type Team, Priority, Status } from "./types"


export const taskStatus = [Status?.ToDo, Status?.WorkInProgress, Status?.UnderReview, Status?.Completed]

export const statusConfig = {
  [Status?.ToDo]: {
    color: "#3B82F6",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-300",
    label: "To Do",
  },
  [Status?.WorkInProgress]: {
    color: "#10B981",
    bgColor: "bg-green-50",
    borderColor: "border-green-300",
    label: "Work In Progress",
  },
  [Status?.UnderReview]: {
    color: "#F59E0B",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-300",
    label: "Under Review",
  },
  [Status?.Completed]: {
    color: "#6B7280",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-300",
    label: "Completed",
  },
}


export const ListStatusConfig = {
  [Status?.Completed]: {
    label: "COMPLETE",
    icon: CheckCircle,
    color: "bg-green-600",
    textColor: "text-white",
    count: 0,
  },
  [Status?.WorkInProgress]: {
    label: "IN PROGRESS",
    icon: Play,
    color: "bg-blue-600",
    textColor: "text-white",
    count: 0,
  },
  [Status?.ToDo]: {
    label: "TO DO",
    icon: Circle,
    color: "bg-gray-600",
    textColor: "text-white",
    count: 0,
  },
  [Status?.UnderReview]: {
    label: "UNDER REVIEW",
    icon: Pause,
    color: "bg-orange-600",
    textColor: "text-white",
    count: 0,
  },
}

export const ListPriorityConfig = {
  [Priority.Urgent]: { color: "bg-red-100 text-red-700", label: "Urgent" },
  [Priority.High]: { color: "bg-orange-100 text-orange-700", label: "High" },
  [Priority.Medium]: { color: "bg-yellow-100 text-yellow-700", label: "Medium" },
  [Priority.Low]: { color: "bg-green-100 text-green-700", label: "Low" },
  [Priority.Backlog]: { color: "bg-gray-100 text-gray-700", label: "Backlog" },
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
}

// Pagination Defaults
export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
}

// Cache Keys for React Query (if we use it later)
export const CACHE_KEYS = {
  PROJECTS: "projects",
  TASKS: "tasks",
  USERS: "users",
  TEAMS: "teams",
  SEARCH: "search",
} as const
