import { apiCall } from "../api_call";

export const teamApi = {
  // Get all teams
  getTeams: async () => {
    return apiCall("/teams")
  },

  // Get single team
  getTeam: async (teamId: string) => {
    return apiCall(`/teams/${teamId}`)
  },

  // Create team
  createTeam: async (teamData: { teamName: string; description?: string }) => {
    return apiCall("/teams", {
      method: "POST",
      body: JSON.stringify(teamData),
    })
  },

  // Update team
  updateTeam: async (teamId: string, teamData: { teamName: string; description?: string }) => {
    return apiCall(`/teams/${teamId}`, {
      method: "PUT",
      body: JSON.stringify(teamData),
    })
  },

  // Delete team
  deleteTeam: async (teamId: string) => {
    return apiCall(`/teams/${teamId}`, {
      method: "DELETE",
    })
  },

  // Add team member
  addTeamMember: async (teamId: string, userId: string) => {
    return apiCall(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userIds: [userId] }),
    })
  },

  // Remove team member
  removeTeamMember: async (teamId: string, userId: string) => {
    return apiCall(`/teams/${teamId}/members?userId=${userId}`, {
      method: "DELETE",
    })
  },

  // Add multiple team members
  addTeamMembers: async (teamId: string, userIds: string[]) => {
    return apiCall(`/teams/${teamId}/members`, {
      method: "POST",
      body: JSON.stringify({ userIds }),
    })
  },
}
