import { Team, ApiResponse } from "@/lib/types"; // Update paths/types as needed
import { apiCall } from "../api_call";

export const teamApi = {
  // Get all teams - returns array
   getTeams: async (): Promise<ApiResponse<Team[]>> => {
    return apiCall<Team[]>("/teams");
  },


  // Get single team
  getTeam: async (teamId: string): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${teamId}`);
  },

  // Create team
  createTeam: async (
    teamData: { teamName: string; description?: string }
  ): Promise<ApiResponse<Team>> => {
    return apiCall<Team>("/teams", {
      method: "POST",
      body: JSON.stringify(teamData),
    });
  },

  // Update team
  updateTeam: async (
    teamId: string,
    teamData: { teamName: string; description?: string }
  ): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${teamId}`, {
      method: "PUT",
      body: JSON.stringify(teamData),
    });
  },

  // Delete team
  deleteTeam: async (teamId: string): Promise<ApiResponse<null>> => {
    return apiCall<null>(`/teams/${teamId}`, {
      method: "DELETE",
    });
  },

  // Add one member
  addTeamMember: async (
    teamId: string,
    userId: string
  ): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userIds: [userId] }),
    });
  },

  // Remove member
  removeTeamMember: async (
    teamId: string,
    userId: string
  ): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${teamId}/members?userId=${userId}`, {
      method: "DELETE",
    });
  },

  // Add multiple members
  addTeamMembers: async (
    teamId: string,
    userIds: string[]
  ): Promise<ApiResponse<Team>> => {
    return apiCall<Team>(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    });
  },
};
