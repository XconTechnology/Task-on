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

    // Get user data to find their workspaces
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData || !userData.workspaceIds || userData.workspaceIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        message: "No workspaces found",
      })
    }

    // Get all workspaces user belongs to
    const workspaces = await workspacesCollection.find({ id: { $in: userData.workspaceIds } }).toArray()

    // Add user's role in each workspace
    const workspacesWithRole = workspaces.map((workspace) => {
      const userMember = workspace.members?.find((member: any) => member.memberId === user.userId)

      return {
        id: workspace.id,
        name: workspace.name,
        ownerId: workspace.ownerId,
        memberCount: workspace.members?.length || 0,
        userRole: userMember?.role || "Member",
        isOwner: workspace.ownerId === user.userId,
        createdAt: workspace.createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: workspacesWithRole,
      message: "Workspaces retrieved successfully",
    })
  } catch (error) {
    console.error("Get user workspaces error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
