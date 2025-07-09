import { ArrowUpRight, Award, BarChart3, Calendar, CheckCircle, Circle, Clock, Pause, Play, TrendingUp, Zap } from "lucide-react"
import {  NotificationType, Priority,  Status } from "./types"


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
    label: "In Progress",
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
// Chart configurations
export const productivityChartConfig = {
  completed: {
    label: "Completed",
    color: "#22c55e",
  },
  created: {
    label: "Created",
    color: "#3b82f6",
  },
}

export const taskDistributionConfig = {
  count: {
    label: "Tasks",
  },
}

export const monthlyOverviewConfig = {
  tasks: {
    label: "Tasks",
    color: "#3b82f6",
  },
  hours: {
    label: "Hours",
    color: "#f97316",
  },
}
// Constants for metric boxes
 export const MAIN_STATS_DATA = [
  {
    id: "total",
    label: "Total Tasks",
    key: "totalTasks",
    icon: BarChart3,
    color: "blue",
    bgColor: "bg-blue-100",
    iconColor: "text-blue-600",
    subtext: "All time",
    subtextIcon: TrendingUp,
    subtextColor: "text-green-600",
  },
  {
    id: "completed",
    label: "Completed",
    key: "completedTasks",
    icon: CheckCircle,
    color: "green",
    bgColor: "bg-green-100",
    iconColor: "text-green-600",
    subtext: "completion rate",
    subtextIcon: CheckCircle,
    subtextColor: "text-green-600",
    showPercentage: true,
  },
  {
    id: "progress",
    label: "In Progress",
    key: "inProgressTasks",
    icon: Clock,
    color: "orange",
    bgColor: "bg-orange-100",
    iconColor: "text-orange-600",
    subtext: "Active tasks",
    subtextIcon: Zap,
    subtextColor: "text-orange-600",
  },
]



export const TIME_STATS_DATA = [
  {
    id: "today",
    label: "TODAY",
    key: "todayCompletedTasks",
    subtitle: "Completed today",
    icon: Calendar,
    color: "from-blue-500 to-blue-600",
    iconBg: "bg-white/20",
    footerText: "Updated in real-time",
    footerIcon: ArrowUpRight,
  },
  {
    id: "week",
    label: "THIS WEEK",
    key: "weekCompletedTasks",
    subtitle: "Completed this week",
    icon: Zap,
    color: "from-green-500 to-green-600",
    iconBg: "bg-white/20",
    footerText: "Since last Sunday",
    footerIcon: ArrowUpRight,
  },
  {
    id: "month",
    label: "THIS MONTH",
    key: "monthCompletedTasks",
    subtitle: "Completed this month",
    icon: Award,
    color: "from-purple-500 to-purple-600",
    iconBg: "bg-white/20",
    footerText: "Since the 1st",
    footerIcon: ArrowUpRight,
  },
]

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
  BASE_URL:"/api",
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


// Mock Users Data
export const MOCK_USERS = [
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
export const MOCK_TEAMS  = [
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


// Mock Tasks Data
export const MOCK_TASKS = [
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


  // Get notification icon based on type
  export const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "task_assigned":
        return "📋"
      case "team_member_added":
        return "👥"
      case "workspace_member_joined":
        return "🏢"
      case "added_to_team":
        return "✨"
      case "project_assigned":
        return "📁"
      case "workspace_invitation":
        return "📨"
      default:
        return "🔔"
    }
  }

  // Get notification color based on type
  export const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case "task_assigned":
        return "bg-blue-100 text-blue-800"
      case "team_member_added":
        return "bg-green-100 text-green-800"
      case "workspace_member_joined":
        return "bg-purple-100 text-purple-800"
      case "added_to_team":
        return "bg-yellow-100 text-yellow-800"
      case "project_assigned":
        return "bg-indigo-100 text-indigo-800"
      case "workspace_invitation":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }


  // Position-based categories for task classification
export const POSITION_CATEGORIES = {
  "Software Developer": [
    "Frontend",
    "Backend",
    "Fullstack",
    "Landing Page",
    "Web App",
    "API Development",
    "Bug Fixing",
    "Database Setup",
    "Authentication",
    "Deployment",
    "Integration",
    "Dashboard",
    "CMS Setup",
    "Code Review",
  ],
  "Mobile Developer": ["Mobile App", "Push Notification", "App Store Upload", "UI Integration", "API Integration"],
  "UI/UX Designer": ["Wireframe", "Prototype", "User Flow", "UI Design", "UX Audit", "Figma Handoff"],
  "Graphic Designer": [
    "Logo",
    "Banner",
    "Poster",
    "Business Card",
    "Social Media Graphic",
    "Brand Kit",
    "Icon Design",
    "Flyer",
    "Brochure",
  ],
  "Social Media Marketer": [
    "Post Creation",
    "Content Plan",
    "Hashtag Research",
    "Campaign Launch",
    "Engagement Boost",
    "Story Design",
    "Reel Scheduling",
  ],
  "Copywriter / Content Writer": [
    "Blog Post",
    "Landing Copy",
    "Product Description",
    "Ad Copy",
    "Email Copy",
    "Caption Writing",
  ],
  "SEO Specialist": ["Keyword Research", "On-Page SEO", "Backlinking", "Meta Tags", "Traffic Report"],
  "Email Marketer": ["Newsletter", "Campaign Setup", "Email Design", "Sequence Automation", "A/B Testing"],
  "Project Manager": ["Task Assignment", "Timeline Planning", "Progress Tracking", "Team Sync", "Report Writing"],
  "Customer Support": ["Ticket Reply", "Bug Report", "FAQ Update", "Chat Support", "Feedback Collection"],
} as const

// Helper function to get categories for a specific position
export const getCategoriesForPosition = (position: string): string[] => {
  return POSITION_CATEGORIES[position as keyof typeof POSITION_CATEGORIES] || []
}

// Helper function to get all available positions
export const getAllPositions = (): string[] => {
  return Object.keys(POSITION_CATEGORIES)
}

// Helper function to check if a position has categories
export const hasCategories = (position: string): boolean => {
  return position in POSITION_CATEGORIES && POSITION_CATEGORIES[position as keyof typeof POSITION_CATEGORIES].length > 0
}
