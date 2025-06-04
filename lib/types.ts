export interface User {
  id: string
  username: string
  email: string
  password: string
  role?: "Owner" | "Admin" | "Member"
  workspaceId?: string
  teamIds?: string[]
  profilePictureUrl?: string
  isInvited?: boolean
  tempPassword?: string
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  ownerId: string
  defaultRole: "Admin" | "Member"
  allowMemberInvites: boolean
  createdAt: string
  updatedAt: string
}

export interface Team {
  id: string
  teamName: string
  description?: string
  workspaceId: string
  createdBy: string
  memberCount?: number
  createdAt: string
  updatedAt: string
}

export interface Project {
  id: string
  name: string
  description?: string
  workspaceId: string
  createdBy: string
  teamId?: string
  startDate?: string
  endDate?: string
  status: "active" | "completed" | "archived"
  createdAt: string
  updatedAt: string
}
export enum Priority {
  Urgent = "Urgent",
  High = "High",
  Medium = "Medium",
  Low = "Low",
  Backlog = "Backlog",
}

export enum Status {
  ToDo = "To Do",
  WorkInProgress = "In Progress",
  UnderReview = "Under Review",
  Completed = "Completed",
}
export interface DashboardPageStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  todayCompletedTasks: number
  weekCompletedTasks: number
  monthCompletedTasks: number
  projectsCount: number
  completionRate: number
  weeklyActivity: Array<{ date: string; tasks: number; day: string }>
  monthlyActivity: Array<{ date: string; tasks: number }>
  priorityStats: {
    urgent: number
    high: number
    medium: number
    low: number
    backlog: number
  }
}

export interface SearchResults {
  tasks?: any[]
  projects?: any[]
  users?: any[]
}

export interface Task {
  id: string
  title: string
  description?: string
  status: Status
  priority: Priority
  projectId: string
  workspaceId: string
  createdBy: string // Auto-assigned from current user
  assignedTo?: string
  dueDate?: string
  createdAt: string
  updatedAt: string

  // Populated fields
  author?: {
    id: string
    username: string
    email: string
  }
  assignee?: {
    id: string
    username: string
    email: string
    profilePictureUrl: string
  }
}

export interface ProjectStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  progress: number
  teamMembers: number
  assignedMembers: User[]
}

export interface OnboardingData {
  usageType: string
  managementType: string[]
  features: string[]
  workspaceName: string
  teamInvites: string[]
  referralSource: string
}

export interface DashboardStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  totalProjects: number
  activeProjects: number
  completedProjects: number
  teamMembers: number
  recentActivity: any[]
}

export type WorkspaceMember = {
  id: string;
  username: string;
  email: string;
  role?: string;
};
export interface AnalyticsData {
  keyMetrics: {
    totalTasks: number
    completionRate: number
    teamEfficiency: number
    activeProjects: number
    tasksChange: string
    completionChange: string
    efficiencyChange: string
    projectsChange: string
  }
  productivity: {
    daily: Array<{ date: string; completed: number; created: number }>
    weekly: Array<{ week: string; productivity: number }>
    monthly: Array<{ month: string; tasks: number; hours: number }>
  }
  projects: {
    timeline: Array<{ project: string; planned: number; actual: number }>
  }
  team: {
    performance: Array<{ member: string; tasks: number; efficiency: number }>
    workload: Array<{ member: string; assigned: number; completed: number }>
  }
  trends: {
    taskTypes: Array<{ type: string; count: number; color: string }>
    priorities: Array<{ priority: string; count: number; color: string }>
    statuses: Array<{ status: string; count: number; color: string }>
  }
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}