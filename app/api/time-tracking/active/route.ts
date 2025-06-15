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
    const activeTimersCollection = db.collection("activeTimers")

    // Find active timer for this user
    const activeTimer = await activeTimersCollection.findOne({ userId: user.userId })

    return NextResponse.json({
      success: true,
      data: activeTimer || null,
    })
  } catch (error) {
    console.error("Get active timer error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
