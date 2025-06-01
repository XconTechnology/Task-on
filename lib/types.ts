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
  WorkInProgress = "Work In Progress",
  UnderReview = "Under Review",
  Completed = "Completed",
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
