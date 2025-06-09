import { getDatabase } from "@/lib/mongodb"

/**
 * Get user's current workspace ID from localStorage (client-side) or user's first workspace (server-side)
 * This is a server-side utility for API routes
 */
export async function getCurrentWorkspaceId(userId: string): Promise<string | null> {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get user's workspace IDs
    const userData = await usersCollection.findOne({ id: userId })
    if (!userData?.workspaceIds || userData.workspaceIds.length === 0) {
      return null
    }

    // For server-side, return the first workspace ID
    // In a real app, you'd pass the current workspace ID from the client
    return userData.workspaceIds[0]
  } catch (error) {
    console.error("Error getting current workspace ID:", error)
    return null
  }
}

/**
 * Get workspace member data for a user in a specific workspace
 */
export async function getWorkspaceMember(userId: string, workspaceId: string) {
  try {
    const db = await getDatabase()
    const workspacesCollection = db.collection("workspaces")

    const workspace = await workspacesCollection.findOne({ id: workspaceId })
    if (!workspace?.members) {
      return null
    }

    return workspace.members.find((member: any) => member.memberId === userId) || null
  } catch (error) {
    console.error("Error getting workspace member:", error)
    return null
  }
}
