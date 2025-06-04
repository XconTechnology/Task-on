import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const workspacesCollection = db.collection("workspaces")

    // Get user's workspace and role
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Check permissions
    const userRole = getUserRole(userData.role)
    if (!canUserPerformAction(userRole, "workspace", "read")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get workspace settings
    const workspace = await workspacesCollection.findOne({ id: userData.workspaceId })

    return NextResponse.json({
      success: true,
      data: {
        workspaceName: workspace?.name || "My Workspace",
        defaultRole: workspace?.defaultRole || "Member",
        allowMemberInvites: workspace?.allowMemberInvites !== false,
      },
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
    const { workspaceName, defaultRole, allowMemberInvites } = body

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const workspacesCollection = db.collection("workspaces")

    // Get user's workspace and role
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Check permissions
    const userRole = getUserRole(userData.role)
    if (!canUserPerformAction(userRole, "workspace", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Update workspace settings
    const updatedWorkspace = await workspacesCollection.findOneAndUpdate(
      { id: userData.workspaceId },
      {
        $set: {
          name: workspaceName,
          defaultRole: defaultRole,
          allowMemberInvites: allowMemberInvites,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" },
    )

    return NextResponse.json({
      success: true,
      data: updatedWorkspace?.value,
      message: "Workspace settings updated successfully",
    })
  } catch (error) {
    console.error("Update workspace settings error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
