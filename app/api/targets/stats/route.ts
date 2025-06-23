import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"

export async function GET(request: NextRequest) {
  try {
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
    const targetsCollection = db.collection("targets")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    // Only Admins and Owners can access target stats
    if (userRole === "Member") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get target statistics
    const totalTargets = await targetsCollection.countDocuments({ workspaceId: currentWorkspaceId })
    const activeTargets = await targetsCollection.countDocuments({ workspaceId: currentWorkspaceId, status: "active" })
    const completedTargets = await targetsCollection.countDocuments({
      workspaceId: currentWorkspaceId,
      status: "completed",
    })
    const failedTargets = await targetsCollection.countDocuments({ workspaceId: currentWorkspaceId, status: "failed" })

    const completionRate = totalTargets > 0 ? Math.round((completedTargets / totalTargets) * 100) : 0

    const stats = {
      totalTargets,
      activeTargets,
      completedTargets,
      failedTargets,
      completionRate,
    }

    return NextResponse.json({
      success: true,
      data: stats,
    })
  } catch (error) {
    console.error("Get target stats error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
