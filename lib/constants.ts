import { type Project, type Task, type User, type Team, Priority, Status } from "./types"

// Mock Users Data
export const MOCK_USERS: User[] = [
  {
    id: "user_1",
    username: "john_doe",
    email: "john@example.com",
    profilePictureUrl: "/placeholder.svg?height=40&width=40",
    teamId: "team_1",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "user_2",
    username: "jane_smith",
    email: "jane@example.com",
    profilePictureUrl: "/placeholder.svg?height=40&width=40",
    teamId: "team_1",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "user_3",
    username: "mike_wilson",
    email: "mike@example.com",
    profilePictureUrl: "/placeholder.svg?height=40&width=40",
    teamId: "team_2",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
  },
  {
    id: "user_4",
    username: "sarah_johnson",
    email: "sarah@example.com",
    profilePictureUrl: "/placeholder.svg?height=40&width=40",
    teamId: "team_1",
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z",
  },
]

// Mock Teams Data
export const MOCK_TEAMS: Team[] = [
  {
    id: "team_1",
    teamName: "Frontend Development",
    productOwnerUserId: "user_1",
    projectManagerUserId: "user_2",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "team_2",
    teamName: "Backend Development",
    productOwnerUserId: "user_3",
    projectManagerUserId: "user_4",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
]

// Mock Projects Data
export const MOCK_PROJECTS: Project[] = [
  {
    id: "project_1",
    name: "E-commerce Platform",
    description: "Building a modern e-commerce platform with React and Node.js",
    startDate: "2024-01-01",
    endDate: "2024-06-01",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "project_2",
    name: "Mobile App Development",
    description: "Cross-platform mobile app using React Native",
    startDate: "2024-02-01",
    endDate: "2024-08-01",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
  {
    id: "project_3",
    name: "Data Analytics Dashboard",
    description: "Real-time analytics dashboard for business intelligence",
    startDate: "2024-03-01",
    endDate: "2024-09-01",
    createdAt: "2024-03-01T00:00:00Z",
    updatedAt: "2024-03-01T00:00:00Z",
  },
]

// Mock Tasks Data
export const MOCK_TASKS: Task[] = [
  {
    id: "task_1",
    title: "Setup Project Structure",
    description: "Initialize the project with proper folder structure and dependencies",
    status: Status.Completed,
    priority: Priority.High,
    tags: "setup,initialization",
    startDate: "2024-01-01",
    dueDate: "2024-01-05",
    points: 5,
    projectId: "project_1",
    authorUserId: "user_1",
    assignedUserId: "user_2",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-05T00:00:00Z",
  },
  {
    id: "task_2",
    title: "Design User Authentication",
    description: "Create login and registration forms with validation",
    status: Status.WorkInProgress,
    priority: Priority.High,
    tags: "auth,frontend",
    startDate: "2024-01-06",
    dueDate: "2024-01-15",
    points: 8,
    projectId: "project_1",
    authorUserId: "user_1",
    assignedUserId: "user_2",
    createdAt: "2024-01-06T00:00:00Z",
    updatedAt: "2024-01-10T00:00:00Z",
  },
  {
    id: "task_3",
    title: "API Development",
    description: "Build REST API endpoints for user management",
    status: Status.ToDo,
    priority: Priority.Medium,
    tags: "api,backend",
    startDate: "2024-01-16",
    dueDate: "2024-01-25",
    points: 13,
    projectId: "project_1",
    authorUserId: "user_3",
    assignedUserId: "user_4",
    createdAt: "2024-01-16T00:00:00Z",
    updatedAt: "2024-01-16T00:00:00Z",
  },
  {
    id: "task_4",
    title: "Database Schema Design",
    description: "Design and implement MongoDB schema for the application",
    status: Status.UnderReview,
    priority: Priority.High,
    tags: "database,schema",
    startDate: "2024-01-10",
    dueDate: "2024-01-20",
    points: 8,
    projectId: "project_2",
    authorUserId: "user_3",
    assignedUserId: "user_1",
    createdAt: "2024-01-10T00:00:00Z",
    updatedAt: "2024-01-18T00:00:00Z",
  },
  {
    id: "task_5",
    title: "Mobile UI Components",
    description: "Create reusable UI components for mobile app",
    status: Status.ToDo,
    priority: Priority.Medium,
    tags: "mobile,ui,components",
    startDate: "2024-02-01",
    dueDate: "2024-02-15",
    points: 10,
    projectId: "project_2",
    authorUserId: "user_2",
    assignedUserId: "user_4",
    createdAt: "2024-02-01T00:00:00Z",
    updatedAt: "2024-02-01T00:00:00Z",
  },
]

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
