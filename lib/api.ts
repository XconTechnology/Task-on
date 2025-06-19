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
} from "./types";
import { apiCall } from "./api_call"; // Import the working apiCall function

// Project API Functions

// Project API Functions
export const projectApi = {
  // Get all projects
  getProjects: async (): Promise<ApiResponse<Project[]>> => {
    return apiCall<Project[]>("/projects");
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

  // Get tasks with time-based filtering
  getTasksByTimeframe: async (timeframe: "today" | "week" | "month") => {
    try {
      const now = new Date();
      let startDate: Date;

      switch (timeframe) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate()
          );
          break;
        case "week":
          // Start of week (Sunday)
          const day = now.getDay();
          startDate = new Date(now);
          startDate.setDate(now.getDate() - day);
          break;
        case "month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0); // Beginning of time
      }

      return apiCall<Task[]>(
        `/tasks?startDate=${startDate.toISOString()}&status=done`
      );
    } catch (error) {
      console.error(`Failed to fetch ${timeframe} tasks:`, error);
      return { success: false, error: `Failed to fetch ${timeframe} tasks` };
    }
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
    return apiCall<any[]>("/workspace/members");
  },

  // Update member role
  updateMemberRole: async (
    memberId: string,
    role: string
  ): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/workspace/members/${memberId}`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    });
  },

  // Remove member from workspace
  removeMember: async (memberId: string): Promise<ApiResponse<any>> => {
    return apiCall<any>(`/workspace/members/${memberId}`, {
      method: "DELETE",
    });
  },

  // Get workspace settings
  getSettings: async (): Promise<ApiResponse<any>> => {
    return apiCall<any>("/workspace/settings");
  },

  // Update workspace settings
  updateSettings: async (settings: any): Promise<ApiResponse<any>> => {
    return apiCall<any>("/workspace/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },

  // Get user's workspaces
  getUserWorkspaces: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<any[]>("/workspaces/user");
  },

  // Switch to workspace
  switchWorkspace: async (workspaceId: string): Promise<ApiResponse<any>> => {
    return apiCall<any>("/workspace/switch", {
      method: "POST",
      body: JSON.stringify({ workspaceId }),
    });
  },

  // Create new workspace
  createWorkspace: async (name: string): Promise<ApiResponse<any>> => {
    return apiCall<any>("/workspaces", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  // Send invitations (automatically uses current workspace)
  inviteUsers: async (
    emails: string[],
    role: string,
    workspaceId?: string
  ): Promise<ApiResponse<any>> => {
    return apiCall<any>("/teams/invite", {
      method: "POST",
      body: JSON.stringify({ emails, role, workspaceId }),
    });
  },

  // Send invitations with explicit workspace
  inviteUsersToWorkspace: async (
    emails: string[],
    role: string,
    workspaceId: string
  ): Promise<ApiResponse<any>> => {
    return apiCall<any>("/teams/invite", {
      method: "POST",
      body: JSON.stringify({ emails, role, workspaceId }),
    });
  },

  // Accept invitation
  acceptInvite: async (
    token: string,
    username: string,
    password: string
  ): Promise<ApiResponse<any>> => {
    return apiCall<any>("/teams/accept-invite", {
      method: "POST",
      body: JSON.stringify({ token, username, password }),
    });
  },
};

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
