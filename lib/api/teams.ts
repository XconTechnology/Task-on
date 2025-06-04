export const teamApi = {
  // Get all teams
  getTeams: async () => {
    try {
      const response = await fetch("/api/teams")
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to fetch teams:", error)
      return { success: false, error: "Failed to fetch teams" }
    }
  },

  // Get single team
  getTeam: async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`)
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to fetch team:", error)
      return { success: false, error: "Failed to fetch team" }
    }
  },

  // Create team
  createTeam: async (teamData: { teamName: string; description?: string }) => {
    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to create team:", error)
      return { success: false, error: "Failed to create team" }
    }
  },

  // Update team
  updateTeam: async (teamId: string, teamData: { teamName: string; description?: string }) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teamData),
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to update team:", error)
      return { success: false, error: "Failed to update team" }
    }
  },

  // Delete team
  deleteTeam: async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`, {
        method: "DELETE",
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error("Failed to delete team:", error)
      return { success: false, error: "Failed to delete team" }
    }
  },
}
