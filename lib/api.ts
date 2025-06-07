import type { Project, Task, User, Team, ApiResponse, Status } from "./types";
import { API_CONFIG } from "./constants";

// Base API function with error handling and retries
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || `HTTP error! status: ${response.status}`,
      };
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error occurred",
    };
  }
}

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
};

// Task API Functions
export const taskApi = {
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

      const response = await fetch(
        `/api/tasks?startDate=${startDate.toISOString()}&status=done`
      );
      const data = await response.json();

      return data;
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

// Team API Functions
export const teamApi = {
  // Get all teams for user's workspace
  getTeams: async (): Promise<ApiResponse<Team[]>> => {
    return apiCall<Team[]>("/teams");
  },

  // Get team by ID
  getTeam: async (id: string): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${id}`);
  },

  // Create new team
  createTeam: async (team: Partial<Team>): Promise<ApiResponse<Team>> => {
    return apiCall<Team>("/teams", {
      method: "POST",
      body: JSON.stringify(team),
    });
  },

  // Update team
  updateTeam: async (
    id: string,
    team: Partial<Team>
  ): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${id}`, {
      method: "PUT",
      body: JSON.stringify(team),
    });
  },

  // Delete team
  deleteTeam: async (id: string): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/teams/${id}`, {
      method: "DELETE",
    });
  },

  // Get team members
  getTeamMembers: async (teamId: string): Promise<ApiResponse<User[]>> => {
    return apiCall<User[]>(`/teams/${teamId}/members`);
  },

  // Add member to team
  addTeamMember: async (
    teamId: string,
    userId: string
  ): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },

  // Remove member from team
  removeTeamMember: async (
    teamId: string,
    userId: string
  ): Promise<ApiResponse<void>> => {
    return apiCall<void>(`/teams/${teamId}/members/${userId}`, {
      method: "DELETE",
    });
  },

  // Invite users to workspace
  inviteUsers: async (
    emails: string[],
    role: string,
    workspaceId?: string
  ): Promise<ApiResponse<any>> => {
    return workspaceApi.inviteUsers(emails, role, workspaceId);
  },
};


export const workspaceApi = {
  // Get workspace members
  getMembers: async () => {
    return apiCall("/workspace/members");
  },

  // Get workspace settings
  getSettings: async () => {
    return apiCall("/workspace/settings");
  },

  // Update workspace settings
  updateSettings: async (settings: any) => {
    return apiCall("/workspace/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    });
  },

  // Get user's workspaces
  getUserWorkspaces: async (): Promise<ApiResponse<any[]>> => {
    return apiCall<any[]>("/workspace/user");
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
    return apiCall<any>("/workspace", {
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
    try {
      const response = await fetch(
        `/api/search?query=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Search API error:", error);
      return { success: false, error: "Search request failed" };
    }
  },

  getSuggestions: async () => {
    try {
      const response = await fetch("/api/search");
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Suggestions API error:", error);
      return { success: false, error: "Suggestions request failed" };
    }
  },
};

// Export all APIs as a single object for easy importing
export const api = {
  projects: projectApi,
  tasks: taskApi,
  users: userApi,
  teams: teamApi,
  search: searchApi,
  workspace: workspaceApi,
};

export default api;

// Add this to your existing API file

export const analyticsApi = {
  getAnalytics: async (timeRange = "30d") => {
    try {
      const response = await fetch(`/api/analytics?timeRange=${timeRange}`);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Analytics API error:", error);
      return { success: false, error: "Analytics request failed" };
    }
  },

  exportAnalytics: async (timeRange = "30d") => {
    try {
      const response = await fetch(
        `/api/analytics/export?timeRange=${timeRange}`
      );
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `analytics-${timeRange}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
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
