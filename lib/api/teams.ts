import type { Team, User, ApiResponse } from "@/lib/types"
import { API_CONFIG } from "@/lib/constants"
import { workspaceApi } from "../api"

// Base API function with error handling
async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  }

  try {
    const response = await fetch(url, defaultOptions)
    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      }
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    }
  }
}

// Team API Functions
export const teamApi = {
  // Get all teams for user's workspace
  getTeams: async (): Promise<ApiResponse<Team[]>> => {
    return apiCall<Team[]>("/teams")
  },

  // Get team by ID
  getTeam: async (id: string): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${id}`)
  },

  // Create new team
  createTeam: async (team: Partial<Team>): Promise<ApiResponse<Team>> => {
    return apiCall<Team>("/teams", {
      method: "POST",
      body: JSON.stringify(team),
    })
  },

  // Update team
  updateTeam: async (id: string, team: Partial<Team>): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify(team),
    })
  },

  // Delete team
  deleteTeam: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/teams/${id}`, {
      method: "DELETE",
    })
  },

  // Get team members
  getTeamMembers: async (teamId: string): Promise<ApiResponse<User[]>> => {
    return apiCall<User[]>(`/teams/${teamId}/members`)
  },

  // Add member to team
  addTeamMember: async (teamId: string, userId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    })
  },

  // Remove member from team
  removeTeamMember: async (teamId: string, userId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    })
  },

  // Invite users to workspace
  inviteUsers: async (emails: string[], role: string, workspaceId?: string): Promise<ApiResponse<any>> => {
    return workspaceApi.inviteUsers(emails, role, workspaceId)
  },
}
