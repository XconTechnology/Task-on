import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const workspacesCollection = db.collection("workspaces")

    // Get user's current workspace ID
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceIds || userData.workspaceIds.length === 0) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Use the first workspace ID if multiple exist
    // In a real app, you'd use the currently selected workspace from context/session
    const currentWorkspaceId = userData.workspaceIds[0]

    // Get workspace with members
    const workspace = await workspacesCollection.findOne({ id: currentWorkspaceId })
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 })
    }

    // Return members from workspace
    return NextResponse.json({
      success: true,
      data: workspace.members || [],
      message: "Members retrieved successfully",
    })
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
