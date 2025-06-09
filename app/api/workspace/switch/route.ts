import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { workspaceId } = body

    if (!workspaceId) {
      return NextResponse.json({ success: false, error: "Workspace ID is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")
    const workspacesCollection = db.collection("workspaces")

    // Check if user exists
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check if workspace exists
    const workspace = await workspacesCollection.findOne({ id: workspaceId })
    if (!workspace) {
      return NextResponse.json({ success: false, error: "Workspace not found" }, { status: 404 })
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members?.some((member: any) => member.memberId === user.userId)
    if (!isMember) {
      return NextResponse.json({ success: false, error: "You are not a member of this workspace" }, { status: 403 })
    }

    // Set current workspace in session/cookie
    // In a real app, you'd store the current workspace ID in the session
    // For this example, we'll just return success

    return NextResponse.json({
      success: true,
      data: { workspaceId },
      message: "Workspace switched successfully",
    })
  } catch (error) {
    console.error("Switch workspace error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
