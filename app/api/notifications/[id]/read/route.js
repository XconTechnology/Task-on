import { NextResponse } from "next/server"
import { getUserFromRequest } from "@/lib/auth"
import { notificationService } from "@/lib/services/notification-service"

export async function PATCH(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    await notificationService.markAsRead(params.id, user.userId)

    return NextResponse.json({
      success: true,
      message: "Notification marked as read",
    })
  } catch (error) {
    console.error("Mark notification as read error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
