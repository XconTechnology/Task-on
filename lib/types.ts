export interface Project {
  id: string
  name: string
  description?: string
  startDate?: string
  endDate?: string
  workspaceId: string
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

export interface User {
  id: string
  username: string
  email: string
  password?: string // Only for database operations
  profilePictureUrl?: string
  workspaceId?: string
  createdAt: string
  updatedAt: string
}

export interface Workspace {
  id: string
  name: string
  ownerId: string
  usageType: "work" | "personal" | "school"
  managementType: string[]
  features: string[]
  referralSource?: string
  invitedEmails?: string[]
  createdAt: string
  updatedAt: string
}

export interface Attachment {
  id: string
  fileURL: string
  fileName: string
  taskId: string
  uploadedById: string
  createdAt: string
}

export interface Comment {
  id: string
  text: string
  taskId: string
  userId: string
  user?: User
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: Status
  priority: Priority
  tags?: string
  startDate?: string
  dueDate?: string
  points?: number
  projectId: string
  authorUserId: string
  assignedUserId?: string
  createdAt: string
  updatedAt: string

  author?: User
  assignee?: User
  comments?: Comment[]
  attachments?: Attachment[]
}

export interface Team {
  id: string
  teamName: string
  workspaceId: string
  productOwnerUserId?: string
  projectManagerUserId?: string
  createdAt: string
  updatedAt: string
}

export interface SearchResults {
  tasks?: Task[]
  projects?: Project[]
  users?: User[]
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

export interface OnboardingData {
  usageType: "work" | "personal" | "school"
  managementType: string[]
  features: string[]
  workspaceName: string
  invitedEmails: string[]
  referralSource: string
}
