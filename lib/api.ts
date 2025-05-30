import type { Project, Task, User, Team, SearchResults, ApiResponse, Status } from "./types"
import { API_CONFIG } from "./constants"

// Base API function with error handling and retries
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
}

// Task API Functions
export const taskApi = {
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

// Team API Functions
export const teamApi = {
  // Get all teams
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
}

// Search API Functions
export const searchApi = {
  // Global search
  search: async (query: string): Promise<ApiResponse<SearchResults>> => {
    return apiCall<SearchResults>(`/search?query=${encodeURIComponent(query)}`)
  },

  // Search projects
  searchProjects: async (query: string): Promise<ApiResponse<Project[]>> => {
    return apiCall<Project[]>(`/search/projects?query=${encodeURIComponent(query)}`)
  },

  // Search tasks
  searchTasks: async (query: string): Promise<ApiResponse<Task[]>> => {
    return apiCall<Task[]>(`/search/tasks?query=${encodeURIComponent(query)}`)
  },

  // Search users
  searchUsers: async (query: string): Promise<ApiResponse<User[]>> => {
    return apiCall<User[]>(`/search/users?query=${encodeURIComponent(query)}`)
  },
}

// Export all APIs as a single object for easy importing
export const api = {
  projects: projectApi,
  tasks: taskApi,
  users: userApi,
  teams: teamApi,
  search: searchApi,
}

export default api
