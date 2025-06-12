import type { Project, Task, User, ApiResponse, Status, ProjectStats } from "./types"
import { apiCall } from "./api_call" // Import the working apiCall function

// Project API Functions


// Project API Functions
export const projectApi = {
  // Get all projects
  getProjects: async (): Promise<ApiResponse<Project[]>> => {
    return apiCall<Project[]>("/projects")
  },

  // Get project by ID
  getProject: async (id: string): Promise<ApiResponse<Project>> => {
    return apiCall<Project>(`/projects/${id}`)
  },

  // Create new project
  createProject: async (project: Partial<Project>): Promise<ApiResponse<Project>> => {
    return apiCall<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(project),
    })
  },

  // Update project
  updateProject: async (id: string, project: Partial<Project>): Promise<ApiResponse<Project>> => {
    return apiCall<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(project),
    })
  },

  // Delete project
  deleteProject: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/projects/${id}`, {
      method: "DELETE",
    })
  },

  // Get project stats (NEW)
  getProjectStats: async (id: string): Promise<ApiResponse<ProjectStats>> => {
    return apiCall<ProjectStats>(`/projects/${id}/stats`)
  },
}

// Rest of the API functions remain unchanged

// Task API Functions
export const taskApi = {
    getALLTasks: async (): Promise<ApiResponse<Task[]>> => {
    return apiCall<Task[]>(`/tasks`)
  },
  // Get tasks by project ID
  getTasks: async (projectId: string): Promise<ApiResponse<Task[]>> => {
    return apiCall<Task[]>(`/tasks?projectId=${projectId}`)
  },

  // Get tasks by user ID
  getTasksByUser: async (userId: string): Promise<ApiResponse<Task[]>> => {
    return apiCall<Task[]>(`/tasks/user/${userId}`)
  },

  // Get task by ID
  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    return apiCall<Task>(`/tasks/${id}`)
  },

  // Create new task
  createTask: async (task: Partial<Task>): Promise<ApiResponse<Task>> => {
    return apiCall<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    })
  },

  // Update task
  updateTask: async (id: string, task: Partial<Task>): Promise<ApiResponse<Task>> => {
    return apiCall<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(task),
    })
  },

  // Update task status
  updateTaskStatus: async (id: string, status: Status): Promise<ApiResponse<Task>> => {
    return apiCall<Task>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  },

  // Delete task
  deleteTask: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/tasks/${id}`, {
      method: "DELETE",
    })
  },

  // Get tasks with time-based filtering
  getTasksByTimeframe: async (timeframe: "today" | "week" | "month") => {
    try {
      const now = new Date()
      let startDate: Date

      switch (timeframe) {
        case "today":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          break
        case "week":
          // Start of week (Sunday)
          const day = now.getDay()
          startDate = new Date(now)
          startDate.setDate(now.getDate() - day)
          break
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        default:
          startDate = new Date(0) // Beginning of time
      }

      return apiCall<Task[]>(`/tasks?startDate=${startDate.toISOString()}&status=done`)
    } catch (error) {
      console.error(`Failed to fetch ${timeframe} tasks:`, error)
      return { success: false, error: `Failed to fetch ${timeframe} tasks` }
    }
  },
}

// User API Functions
export const userApi = {
  // Get all users
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return apiCall<User[]>("/users")
  },

  // Get user by ID
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    return apiCall<User>(`/users/${id}`)
  },

  // Create new user
  createUser: async (user: Partial<User>): Promise<ApiResponse<User>> => {
    return apiCall<User>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    })
  },

  // Update user
  updateUser: async (id: string, user: Partial<User>): Promise<ApiResponse<User>> => {
    return apiCall<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    })
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/users/${id}`, {
      method: "DELETE",
    })
  },
}

export const workspaceApi = {
  // Get workspace members
  getMembers: async () => {
    return apiCall("/workspace/members")
  },

  // Get workspace settings
  getSettings: async () => {
    return apiCall("/workspace/settings")
  },

  // Update workspace settings
  updateSettings: async (settings: any) => {
    return apiCall("/workspace/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  },

  // Get user's workspaces
  getUserWorkspaces: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<any[]>("/workspaces/user")
  },

  // Switch to workspace
  switchWorkspace: async (workspaceId: string): Promise<ApiResponse<any>> => {
    return apiCall<any>("/workspace/switch", {
      method: "POST",
      body: JSON.stringify({ workspaceId }),
    })
  },

  // Create new workspace
  createWorkspace: async (name: string): Promise<ApiResponse<any>> => {
    return apiCall<any>("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    })
  },

  // Send invitations (automatically uses current workspace)
  inviteUsers: async (emails: string[], role: string, workspaceId?: string): Promise<ApiResponse<any>> => {
    return apiCall<any>("/teams/invite", {
      method: "POST",
      body: JSON.stringify({ emails, role, workspaceId }),
    })
  },

  // Send invitations with explicit workspace
  inviteUsersToWorkspace: async (emails: string[], role: string, workspaceId: string): Promise<ApiResponse<any>> => {
    return apiCall<any>("/teams/invite", {
      method: "POST",
      body: JSON.stringify({ emails, role, workspaceId }),
    })
  },

  // Accept invitation
  acceptInvite: async (token: string, username: string, password: string): Promise<ApiResponse<any>> => {
    return apiCall<any>("/teams/accept-invite", {
      method: "POST",
      body: JSON.stringify({ token, username, password }),
    })
  },
}

// Teams API - Import from the working teams API
export { teamApi } from "./api/teams"

// Search API Functions
export const searchApi = {
  search: async (query: string) => {
    return apiCall(`/search?query=${encodeURIComponent(query)}`)
  },

  getSuggestions: async () => {
    return apiCall("/search")
  },
}

// Analytics API
export const analyticsApi = {
  getAnalytics: async (timeRange = "30d") => {
    return apiCall(`/analytics?timeRange=${timeRange}`)
  },

  exportAnalytics: async (timeRange = "30d") => {
    try {
      // For file downloads, we need to use fetch directly
      const response = await fetch(`/api/analytics/export?timeRange=${timeRange}`)
      const blob = await response.blob()

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      return { success: true }
    } catch (error) {
      console.error("Export error:", error)
      return { success: false, error: "Export failed" }
    }
  },
}

// Export all APIs as a single object for easy importing
export const api = {
  projects: projectApi,
  tasks: taskApi,
  users: userApi,
  search: searchApi,
  workspace: workspaceApi,
  analytics: analyticsApi,
}

export default api
