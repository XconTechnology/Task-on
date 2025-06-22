import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"

// Utility function to extract userId from URL
function getUserIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const index = pathParts.indexOf("user")
  return index !== -1 && pathParts.length > index + 1 ? pathParts[index + 1] : null
}

// GET /api/projects/user/[userId]
export async function GET(request: NextRequest) {
  try {
    const targetUserId = getUserIdFromRequest(request)
    if (!targetUserId) {
      return NextResponse.json({ success: false, error: "Invalid user ID" }, { status: 400 })
    }

    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    // Check if user can view other users' projects
    const canViewOtherUsers = userRole === "Owner" || userRole === "Admin"

    // If not admin/owner and trying to view someone else's projects, deny access
    if (!canViewOtherUsers && user.userId !== targetUserId) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Build query based on role and target user
    let projectsQuery: any = { workspaceId: currentWorkspaceId }

    if (userRole === "Member" && user.userId === targetUserId) {
      // Members can only see their own assigned projects
      projectsQuery = {
        workspaceId: currentWorkspaceId,
        $or: [{ assignedMembers: targetUserId }, { createdBy: targetUserId }],
      }
    } else if (canViewOtherUsers) {
      // Admins and Owners can see projects for any user
      projectsQuery = {
        workspaceId: currentWorkspaceId,
        $or: [{ assignedMembers: targetUserId }, { createdBy: targetUserId }],
      }
    }

    const projects = await projectsCollection.find(projectsQuery).sort({ createdAt: -1 }).toArray()

    return NextResponse.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error("Get projects by user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
