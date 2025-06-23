import { type NextRequest, NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, hasPermission: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json(
        { success: false, hasPermission: false, error: "No workspace found for user" },
        { status: 404 },
      )
    }

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json(
        { success: false, hasPermission: false, error: "Not a member of current workspace" },
        { status: 403 },
      )
    }

    const userRole = getUserRole(workspaceMember.role)

    // Check permissions based on action
    let hasPermission = false

    switch (action) {
      case "view_targets":
      case "create_targets":
      case "edit_targets":
      case "delete_targets":
        // Only Admins and Owners can access targets
        hasPermission = userRole === "Admin" || userRole === "Owner"
        break
      default:
        hasPermission = false
    }

    return NextResponse.json({
      success: true,
      hasPermission,
      userRole,
      workspaceId: currentWorkspaceId,
    })
  } catch (error) {
    console.error("Permission check error:", error)
    return NextResponse.json({ success: false, hasPermission: false, error: "Internal server error" }, { status: 500 })
  }
}
