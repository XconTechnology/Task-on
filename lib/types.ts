export interface User {
  id: string
  username: string
  email: string
  password: string
  workspaceIds: string[] // Changed from workspaceId to array
  teamIds?: string[]
  profilePictureUrl?: string
  isInvited?: boolean
  tempPassword?: string
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
  members: any[]
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
  createdBy: string
  assignedTo?: string
  dueDate?: string
  createdAt: string
  updatedAt: string

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

export interface Workspace {
  id: string
  name: string
  ownerId: string
  defaultRole: "Admin" | "Member"
  allowMemberInvites: boolean
  usageType:string
  members: WorkspaceMember[]
  pendingInvites: PendingInvite[] // New field for email invitations
  createdAt: string
  updatedAt: string
}

export type WorkspaceMember = {
  memberId: string
  username: string
  email: string
  role: "Owner" | "Admin" | "Member" // Moved role here from User
  joinedAt: string
}

export type PendingInvite = {
  id: string
  email: string
  role: "Admin" | "Member"
  invitedBy: string
  invitedAt: string
  token: string
  expiresAt: string
}

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

{
  /*

    Teams/[id]/route

  import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { userIds } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: "User IDs are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const teamsCollection = db.collection("teams")
    const usersCollection = db.collection("users")

    // Get user's role
    const userData = await usersCollection.findOne({ id: user.userId })
    const userRole = getUserRole(userData?.role)

    if (!canUserPerformAction(userRole, "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Check if team exists
    const team = await teamsCollection.findOne({ id: params.id })
    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 })
    }

    // Add team ID to users' teamIds array
    await usersCollection.updateMany(
      {
        id: { $in: userIds },
        workspaceId: userData?.workspaceId,
      },
      {
        $addToSet: { teamIds: params.id },
        $set: { updatedAt: new Date().toISOString() },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Members added to team successfully",
    })
  } catch (error) {
    console.error("Add team members error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get user's role
    const userData = await usersCollection.findOne({ id: user.userId })
    const userRole = getUserRole(userData?.role)

    if (!canUserPerformAction(userRole, "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Remove team ID from user's teamIds array
    await usersCollection.updateOne(
      { id: userId },
      {
        $pull: { teamIds: params.id as any},
        $set: { updatedAt: new Date().toISOString() },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Member removed from team successfully",
    })
  } catch (error) {
    console.error("Remove team member error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

  */
}

{
  /*

  user/[id]/route.ts

  import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

export async function PUT(request: NextRequest, context: { params: { id: string } }) {
  console.log("🟢 PUT /api/users/[id] hit")

  try {
    const { params } = context
    console.log("🟡 Context params:", params)

    const user = getUserFromRequest(request)
    console.log("👤 Authenticated user:", user)

    if (!user) {
      console.log("🔴 User not authenticated")
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { role, username, email } = body
    console.log("📦 Body:", body)

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    const currentUserData = await usersCollection.findOne({ id: user.userId })
    const currentUserRole = getUserRole(currentUserData?.role)
    console.log("🎭 Current user role:", currentUserRole)

    const targetUser = await usersCollection.findOne({ id: params.id })
    console.log("🎯 Target user:", targetUser)

    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    if (role && role !== targetUser.role) {
      if (!canUserPerformAction(currentUserRole, "user", "role_change")) {
        return NextResponse.json({ success: false, error: "Insufficient permissions to change roles" }, { status: 403 })
      }

      if (targetUser.role === "Owner" && currentUserRole !== "Owner") {
        return NextResponse.json({ success: false, error: "Cannot change owner role" }, { status: 403 })
      }

      if (role === "Owner" && currentUserRole !== "Owner") {
        return NextResponse.json({ success: false, error: "Only owners can assign owner role" }, { status: 403 })
      }
    }

    if (!canUserPerformAction(currentUserRole, "user", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (role && role !== targetUser.role) {
      updateData.role = role
    }
    if (username && username !== targetUser.username) {
      updateData.username = username
    }
    if (email && email !== targetUser.email) {
      updateData.email = email.toLowerCase()
    }

    console.log("🛠 Update data:", updateData)

    const updatedUser = await usersCollection.findOneAndUpdate(
      { id: params.id },
      { $set: updateData },
      { returnDocument: "after" }
    )

    console.log("✅ Updated user:", updatedUser)

    if (!updatedUser?.value) {
      return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
    }

    const { password: _, ...userResponse } = updatedUser.value

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("❌ Update user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get current user's role
    const currentUserData = await usersCollection.findOne({ id: user.userId })
    const currentUserRole = getUserRole(currentUserData?.role)

    if (!canUserPerformAction(currentUserRole, "user", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get target user
    const targetUser = await usersCollection.findOne({ id: params.id })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Prevent deleting owner
    if (targetUser.role === "Owner") {
      return NextResponse.json({ success: false, error: "Cannot delete workspace owner" }, { status: 403 })
    }

    // Prevent self-deletion
    if (params.id === user.userId) {
      return NextResponse.json({ success: false, error: "Cannot delete yourself" }, { status: 403 })
    }

    // Delete user
    await usersCollection.deleteOne({ id: params.id })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

  */
}
