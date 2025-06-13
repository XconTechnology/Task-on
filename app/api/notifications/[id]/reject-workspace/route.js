import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { notificationService } from "@/lib/services/notification-service"

export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const notificationId = params.id

    // Reject the workspace invitation
    const success = await notificationService.rejectWorkspaceInvitation(notificationId, user.userId)

    if (!success) {
      return NextResponse.json({ success: false, error: "Failed to reject invitation" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation rejected successfully",
    })
  } catch (error) {
    console.error("Reject workspace invitation error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
