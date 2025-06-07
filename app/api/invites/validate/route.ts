import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token")

    if (!token) {
      return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 })
    }

    const db = await getDatabase()
    const workspacesCollection = db.collection("workspaces")

    // Find workspace with pending invite
    const workspace = await workspacesCollection.findOne({
      "pendingInvites.token": token,
    })

    if (!workspace) {
      return NextResponse.json({ success: false, error: "Invalid or expired invitation" }, { status: 404 })
    }

    // Find the specific invite
    const invite = workspace.pendingInvites.find((inv: any) => inv.token === token)

    if (!invite) {
      return NextResponse.json({ success: false, error: "Invalid invitation" }, { status: 404 })
    }

    // Check if invite is expired
    if (new Date() > new Date(invite.expiresAt)) {
      return NextResponse.json({ success: false, error: "Invitation has expired" }, { status: 400 })
    }

    // Return invite data (without sensitive info)
    return NextResponse.json({
      success: true,
      data: {
        workspace: {
          id: workspace.id,
          name: workspace.name,
          memberCount: workspace.members?.length || 0,
        },
        invite: {
          email: invite.email,
          role: invite.role,
          invitedAt: invite.invitedAt,
          expiresAt: invite.expiresAt,
        },
      },
    })
  } catch (error) {
    console.error("Validate invite error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
