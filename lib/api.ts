import type {
  Project,
  Task,
  User,
  ApiResponse,
  Status,
  ProjectStats,
  AnalyticsData,
  ChatAccessResponse,
  TimeTrackingStats,
  TimeEntry,
  ActiveTimer,
  PaginatedDocuments,
  DocumentFilters,
  Document,
  DashboardStats,
  Target,
  PaginatedTargets,
  TargetStats,
  MemberUpdate,
} from "./types";
import { apiCall } from "./api_call"; // Import the working apiCall function

// Project API Functions

// Project API Functions
export const projectApi = {
  // Get all projects
  getProjects: async (): Promise<ApiResponse<Project[]>> => {
    return apiCall<Project[]>("/projects");
  },
  // Get projects by user ID
  getProjectsByUser: async (userId: string): Promise<ApiResponse<Project[]>> => {
    return apiCall<Project[]>(`/projects/user/${userId}`)
  },

  // Get project by ID
  getProject: async (id: string): Promise<ApiResponse<Project>> => {
    return apiCall<Project>(`/projects/${id}`);
  },

  // Create new project
  createProject: async (
    project: Partial<Project>
  ): Promise<ApiResponse<Project>> => {
    return apiCall<Project>("/projects", {
      method: "POST",
      body: JSON.stringify(project),
    });
  },

  // Update project
  updateProject: async (
    id: string,
    project: Partial<Project>
  ): Promise<ApiResponse<Project>> => {
    return apiCall<Project>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(project),
    });
  },

  // Delete project
  deleteProject: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/projects/${id}`, {
      method: "DELETE",
    });
  },

  // Get project stats (NEW)
  getProjectStats: async (id: string): Promise<ApiResponse<ProjectStats>> => {
    return apiCall<ProjectStats>(`/projects/${id}/stats`);
  },
};

// Rest of the API functions remain unchanged

// Task API Functions
export const taskApi = {
  getALLTasks: async (): Promise<ApiResponse<Task[]>> => {
    return apiCall<Task[]>(`/tasks`);
  },
  // Get tasks by project ID
  getTasks: async (projectId: string): Promise<ApiResponse<Task[]>> => {
    return apiCall<Task[]>(`/tasks?projectId=${projectId}`);
  },

  // Get tasks by user ID
  getTasksByUser: async (userId: string): Promise<ApiResponse<Task[]>> => {
    return apiCall<Task[]>(`/tasks/user/${userId}`);
  },

  // Get task by ID
  getTask: async (id: string): Promise<ApiResponse<Task>> => {
    return apiCall<Task>(`/tasks/${id}`);
  },

  // Create new task
  createTask: async (task: Partial<Task>): Promise<ApiResponse<Task>> => {
    return apiCall<Task>("/tasks", {
      method: "POST",
      body: JSON.stringify(task),
    });
  },

  // Update task
  updateTask: async (
    id: string,
    task: Partial<Task>
  ): Promise<ApiResponse<Task>> => {
    return apiCall<Task>(`/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(task),
    });
  },

  // Update task status
  updateTaskStatus: async (
    id: string,
    status: Status
  ): Promise<ApiResponse<Task>> => {
    return apiCall<Task>(`/tasks/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Delete task
  deleteTask: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/tasks/${id}`, {
      method: "DELETE",
    });
  },

   // Get task comments
  getTaskComments: async (taskId: string): Promise<ApiResponse<any[]>> => {
    return apiCall<any[]>(`/tasks/${taskId}/comments`)
  },

  // Get comment count for a task
  getTaskCommentCount: async (taskId: string): Promise<ApiResponse<{ count: number }>> => {
    return apiCall<{ count: number }>(`/tasks/${taskId}/comments`, {
      method: "HEAD",
    })
  },

  // Get comment counts for multiple tasks
  getTasksCommentCounts: async (taskIds: string[]): Promise<ApiResponse<Record<string, number>>> => {
    return apiCall<Record<string, number>>("/tasks/comments-count", {
      method: "POST",
      body: JSON.stringify({ taskIds }),
    })
  },
};

// User API Functions
export const userApi = {
  // Get all users
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    return apiCall<User[]>("/users");
  },

  // Get user by ID
  getUser: async (id: string): Promise<ApiResponse<User>> => {
    return apiCall<User>(`/users/${id}`);
  },

  // Create new user
  createUser: async (user: Partial<User>): Promise<ApiResponse<User>> => {
    return apiCall<User>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  },

  // Update user
  updateUser: async (
    id: string,
    user: Partial<User>
  ): Promise<ApiResponse<User>> => {
    return apiCall<User>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
  },

  // Delete user
  deleteUser: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/users/${id}`, {
      method: "DELETE",
    });
  },
};

// Workspace API Functions
export const workspaceApi = {
  // Get workspace members
  getMembers: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<any[]>("/workspace/members")
  },

  // Update member role and/or salary
  updateMember: async (memberId: string, updates: MemberUpdate): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/workspace/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },

  // Update member role (legacy method - kept for backward compatibility)
  updateMemberRole: async (memberId: string, role: string): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/workspace/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    })
  },

  // Update member salary
  updateMemberSalary: async (
    memberId: string,
    salary: { amount: number; currency: string },
  ): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/workspace/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify({ salary }),
    })
  },

  // Remove member from workspace
  removeMember: async (memberId: string): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/workspace/members/${memberId}`, {
      method: "DELETE",
    })
  },

  // Get workspace settings
  getSettings: async (): Promise<ApiResponse<any>> => {
    return apiCall<any>("/workspace/settings")
  },

  // Update workspace settings
  updateSettings: async (settings: any): Promise<ApiResponse<any>> => {
    return apiCall<any>("/workspace/settings", {
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
  inviteUsers: async (emails: string[],position:string, role: string, workspaceId?: string): Promise<ApiResponse<any>> => {
    return apiCall<any>("/teams/invite", {
      method: "POST",
      body: JSON.stringify({ emails,position, role, workspaceId }),
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

// Search API Functions
export const searchApi = {
  search: async (query: string) => {
    return apiCall(`/search?query=${encodeURIComponent(query)}`);
  },

  getSuggestions: async () => {
    return apiCall("/search");
  },
};

// Analytics API
export const analyticsApi = {
  getAnalytics: async (
    timeRange = "30d"
  ): Promise<ApiResponse<AnalyticsData>> => {
    return apiCall<AnalyticsData>(`/analytics?timeRange=${timeRange}`);
  },

  exportAnalytics: async (timeRange = "30d") => {
    try {
      // For file downloads, we need to use fetch directly
      const response = await fetch(
        `/api/analytics/export?timeRange=${timeRange}`
      );
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${timeRange}-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (error) {
      console.error("Export error:", error);
      return { success: false, error: "Export failed" };
    }
  },
};

export const chatAPi = {
  getAcess: async (
    teamId: string
  ): Promise<ApiResponse<ChatAccessResponse>> => {
    return apiCall<ChatAccessResponse>(`/chat/teams/${teamId}/access`);
  },
};

// Time Tracking API Functions


// Time Tracking API Functions
export const timeTrackingApi = {
  // Start timer for a task
  startTimer: async (taskId: string, description?: string): Promise<ApiResponse<ActiveTimer>> => {
    return apiCall<ActiveTimer>("/time-tracking/start", {
      method: "POST",
      body: JSON.stringify({ taskId, description }),
    })
  },

  getUserTimeEntries: async (userId: string, page = 1, limit = 10): Promise<ApiResponse<TimeEntry[]>> => {
    return apiCall<TimeEntry[]>(`/time-tracking/user/${userId}?page=${page}&limit=${limit}`)
  },
  // Stop timer
  stopTimer: async (timerId: string): Promise<ApiResponse<TimeEntry>> => {
    return apiCall<TimeEntry>(`/time-tracking/stop/${timerId}`, {
      method: "POST",
    })
  },

  // Get active timer for current user
  getActiveTimer: async (): Promise<ApiResponse<ActiveTimer | null>> => {
    return apiCall<ActiveTimer | null>("/time-tracking/active")
  },

  // Get time entries for current user
  getTimeEntries: async (filters?: {
    taskId?: string
    projectId?: string
    startDate?: string
    endDate?: string
    limit?: number
  }): Promise<ApiResponse<TimeEntry[]>> => {
    const params = new URLSearchParams()
    if (filters?.taskId) params.append("taskId", filters.taskId)
    if (filters?.projectId) params.append("projectId", filters.projectId)
    if (filters?.startDate) params.append("startDate", filters.startDate)
    if (filters?.endDate) params.append("endDate", filters.endDate)
    if (filters?.limit) params.append("limit", filters.limit.toString())

    const endpoint = `/time-tracking/entries${params.toString() ? `?${params.toString()}` : ""}`
    return apiCall<TimeEntry[]>(endpoint)
  },

  // Delete time entry
  deleteTimeEntry: async (entryId: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/time-tracking/entries/${entryId}`, {
      method: "DELETE",
    })
  },

  // Update time entry
  updateTimeEntry: async (entryId: string, updates: Partial<TimeEntry>): Promise<ApiResponse<TimeEntry>> => {
    return apiCall<TimeEntry>(`/time-tracking/entries/${entryId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },

  // Get time tracking statistics
  getStats: async (timeframe?: "today" | "week" | "month"): Promise<ApiResponse<TimeTrackingStats>> => {
    const endpoint = `/time-tracking/stats${timeframe ? `?timeframe=${timeframe}` : ""}`
    return apiCall<TimeTrackingStats>(endpoint)
  },

  // Get task total time
  getTaskTime: async (taskId: string): Promise<ApiResponse<{ totalTime: number; isRunning: boolean }>> => {
    return apiCall<{ totalTime: number; isRunning: boolean }>(`/time-tracking/task/${taskId}/total`)
  },

  // Resume a specific time entry
  resumeTimeEntry: async (entryId: string): Promise<ApiResponse<ActiveTimer>> => {
    return apiCall<ActiveTimer>(`/time-tracking/resume/${entryId}`, {
      method: "POST",
    })
  },
  // Get time tracking statistics with timeframe and user filtering
  getStatsWithTimeframe: async (
    timeframe?: "today" | "week" | "month" | "year" | "all",
    userId?: string,
  ): Promise<ApiResponse<TimeTrackingStats>> => {
    const params = new URLSearchParams()
    if (timeframe) params.append("timeframe", timeframe)
    if (userId) params.append("userId", userId)

    const endpoint = `/time-tracking/stats${params.toString() ? `?${params.toString()}` : ""}`
    return apiCall<TimeTrackingStats>(endpoint)
  },

  // Get filtered user time entries with pagination
  getFilteredUserTimeEntries: async (
    userId: string,
    timeframe: "today" | "week" | "month" | "year" | "all" = "all",
    page = 1,
    limit = 10,
  ): Promise<ApiResponse<TimeEntry[]>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      timeframe,
    })

    return apiCall<TimeEntry[]>(`/time-tracking/user/${userId}/filtered?${params.toString()}`)
  },
}



// Add these document API functions to your existing api.ts file

// Declare necessary types and interfaces
export const documentApi = {
  // Get documents with pagination and filters
  getDocuments: async (
    page = 1,
    limit = 10,
    filters?: DocumentFilters
  ): Promise<ApiResponse<PaginatedDocuments>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (filters?.search) params.append("search", filters.search)
    if (filters?.projectId) params.append("projectId", filters.projectId)
    if (filters?.taskId) params.append("taskId", filters.taskId)

    return apiCall<PaginatedDocuments>(`/documents?${params.toString()}`)
  },

  // Get single document by ID
  getDocument: async (id: string): Promise<ApiResponse<Document>> => {
    return apiCall<Document>(`/documents/${id}`)
  },

  // Create a new document (FormData for file upload)
  createDocument: async (
    formData: FormData
  ): Promise<ApiResponse<Document>> => {
    return apiCall<Document>("/documents", {
      method: "POST",
      body: formData,
    })
  },

  // Update existing document by ID
  updateDocument: async (
    id: string,
    updates: Partial<Document>
  ): Promise<ApiResponse<Document>> => {
    return apiCall<Document>(`/documents/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    })
  },

  // Delete a document by ID
  deleteDocument: async (id: string): Promise<ApiResponse<null>> => {
    return apiCall<null>(`/documents/${id}`, {
      method: "DELETE",
    })
  },

  // Download a document file
  downloadDocument: async (id: string, filename: string): Promise<void> => {
    try {
      const currentWorkspaceId = localStorage.getItem("currentWorkspaceId") || ""
      const response = await fetch(`/api/documents/${id}/download`, {
        headers: {
          "x-workspace-id": currentWorkspaceId,
        },
      })

      if (!response.ok) throw new Error("Download failed")

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Download error:", error)
      throw error
    }
  },

  // Get preview URL of a document
  getPreviewUrl: (id: string): string => {
    const currentWorkspaceId = localStorage.getItem("currentWorkspaceId") || ""
    return `/api/documents/${id}/preview?workspaceId=${currentWorkspaceId}`
  },
}
export const dashboardApi = {
  // Get dashboard stats and data
  getDashboardData: async (tasksPage = 1, tasksLimit = 10): Promise<ApiResponse<DashboardStats>> => {
    return apiCall<DashboardStats>(`/dashboard?tasksPage=${tasksPage}&tasksLimit=${tasksLimit}`)
  },
}



// Target API Functions

// Target API Functions
export const targetApi = {
  // Get targets with pagination and filtering
  getTargets: async (
    page = 1,
    limit = 10,
    filters?: {
      status?: string
      search?: string
      assignedTo?: string
      projectId?: string
    },
  ): Promise<ApiResponse<PaginatedTargets>> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })

    if (filters?.status) params.append("status", filters.status)
    if (filters?.search) params.append("search", filters.search)
    if (filters?.assignedTo) params.append("assignedTo", filters.assignedTo)
    if (filters?.projectId) params.append("projectId", filters.projectId)

    return apiCall<PaginatedTargets>(`/targets?${params.toString()}`)
  },

  // Get target by ID
  getTarget: async (id: string): Promise<ApiResponse<Target>> => {
    return apiCall<Target>(`/targets/${id}`)
  },

  // Create new target
  createTarget: async (target: Partial<Target>): Promise<ApiResponse<Target>> => {
    return apiCall<Target>("/targets", {
      method: "POST",
      body: JSON.stringify(target),
    })
  },

  // Update target
  updateTarget: async (id: string, target: Partial<Target>): Promise<ApiResponse<Target>> => {
    return apiCall<Target>(`/targets/${id}`, {
      method: "PUT",
      body: JSON.stringify(target),
    })
  },

  // Delete target
  deleteTarget: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/targets/${id}`, {
      method: "DELETE",
    })
  },

  // Get target statistics
  getTargetStats: async (): Promise<ApiResponse<TargetStats>> => {
    return apiCall<TargetStats>("/targets/stats")
  },
  // Get targets assigned to a specific user (for user's profile page)
  getUserTargets: async (
    userId: string,
    timeframe = "all",
    status = "all",
  ): Promise<ApiResponse<{ targets: Target[]; stats: any }>> => {
    const params = new URLSearchParams()
    if (timeframe !== "all") params.append("timeframe", timeframe)
    if (status !== "all") params.append("status", status)

    const endpoint = `/targets/user/${userId}${params.toString() ? `?${params.toString()}` : ""}`
    return apiCall<{ targets: Target[]; stats: any }>(endpoint)
  },

  // Update user's own target progress
  updateUserTargetProgress: async (
    userId: string,
    targetId: string,
    currentValue: number,
  ): Promise<ApiResponse<Target>> => {
    return apiCall<Target>(`/targets/user/${userId}/${targetId}`, {
      method: "PUT",
      body: JSON.stringify({ currentValue }),
    })
  },
}

// Export API Functions - NEW
export const exportApi = {
  // Export user data as PDF
  exportUserData: async (userId: string, timeframe: string): Promise<ApiResponse<Blob>> => {
    try {
      // We need to use a special approach for blob responses
      // Since apiCall expects JSON, we'll handle this differently
      const currentWorkspaceId = localStorage.getItem("currentWorkspaceId") || ""

      const response = await fetch(`/api/export/user/${userId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspaceId,
        },
        body: JSON.stringify({ timeframe }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || `HTTP error! status: ${response.status}`,
        }
      }

      const blob = await response.blob()
      return {
        success: true,
        data: blob,
      }
    } catch (error) {
      console.error("Export API call failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  },

  // Export multiple users data (bulk export)
  exportMultipleUsers: async (userIds: string[], timeframe: string): Promise<ApiResponse<Blob>> => {
    try {
      const currentWorkspaceId = localStorage.getItem("currentWorkspaceId") || ""

      const response = await fetch(`/api/export/users/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspaceId,
        },
        body: JSON.stringify({ userIds, timeframe }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || `HTTP error! status: ${response.status}`,
        }
      }

      const blob = await response.blob()
      return {
        success: true,
        data: blob,
      }
    } catch (error) {
      console.error("Bulk export API call failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
    }
  },

  // Export workspace analytics
  exportWorkspaceAnalytics: async (timeframe: string): Promise<ApiResponse<Blob>> => {
    try {
      const currentWorkspaceId = localStorage.getItem("currentWorkspaceId") || ""

      const response = await fetch(`/api/export/workspace/analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspaceId,
        },
        body: JSON.stringify({ timeframe }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return {
          success: false,
          error: errorData.error || `HTTP error! status: ${response.status}`,
        }
      }

      const blob = await response.blob()
      return {
        success: true,
        data: blob,
      }
    } catch (error) {
      console.error("Workspace analytics export API call failed:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }
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
};

export default api;
