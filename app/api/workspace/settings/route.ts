import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const workspacesCollection = db.collection("workspaces")

    // Get current workspace ID
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get workspace settings
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 })
    }

    // Extract settings from workspace
    const settings = {
      name: workspace.name,
      usageType: workspace.usageType,
      managementType: workspace.managementType,
      features: workspace.features,
      // Add any other settings you need
    }

    return NextResponse.json({
      success: true,
      data: settings,
    })
  } catch (error) {
    console.error("Get workspace settings error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()

    const db = await getDatabase()
    const workspacesCollection = db.collection("workspaces")

    // Get current workspace ID
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Check if user is owner or admin
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 })
    }

    const userMember = workspace.members.find((m: any) => m.memberId === user.userId)
    if (!userMember || (userMember.role !== "Owner" && userMember.role !== "Admin")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Update workspace settings
    const updatedWorkspace = await workspacesCollection.findOneAndUpdate(
      { id: currentWorkspaceId },
      {
        $set: {
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" },
    )

    if (!updatedWorkspace?.value) {
      return NextResponse.json({ success: false, error: "Failed to update workspace settings" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: updatedWorkspace.value,
      message: "Workspace settings updated successfully",
    })
  } catch (error) {
    console.error("Update workspace settings error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
