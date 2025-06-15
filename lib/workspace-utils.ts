import { getDatabase } from "@/lib/mongodb"

/**
 * Get user's current workspace ID - with fallback to first workspace if no specific workspace is provided
 * This is the ORIGINAL function that your app depends on
 */
export async function getCurrentWorkspaceId(userId: string, headerWorkspaceId?: string): Promise<string | null> {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get user's workspace IDs
    const userData = await usersCollection.findOne({ id: userId })
    if (!userData?.workspaceIds || userData.workspaceIds.length === 0) {
      return null
    }

    // If a preferred workspace ID is provided and user has access to it, use it
    if (headerWorkspaceId && userData.workspaceIds.includes(headerWorkspaceId)) {
      return headerWorkspaceId
    }

    // Otherwise, return the first workspace ID as fallback
    return 'curent workspace not found in utils'
  } catch (error) {
    console.error("Error getting current workspace ID:", error)
    return null
  }
}

/**
 * Validate that a user has access to a specific workspace
 * NEVER falls back to another workspace - this is a security feature
 */
export async function validateUserWorkspaceAccess(userId: string, workspaceId: string): Promise<boolean> {
  try {
    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get user's workspace IDs
    const userData = await usersCollection.findOne({ id: userId })
    if (!userData?.workspaceIds || userData.workspaceIds.length === 0) {
      return false
    }

    // Check if user has access to the requested workspace
    return userData.workspaceIds.includes(workspaceId)
  } catch (error) {
    console.error("Error validating workspace access:", error)
    return false
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
