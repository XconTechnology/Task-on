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

    // Get user's workspace
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get all members in the workspace
    const members = await usersCollection
      .find(
        { workspaceId: userData.workspaceId },
        { projection: { password: 0, tempPassword: 0 } }, // Exclude sensitive data
      )
      .toArray()

    return NextResponse.json({
      success: true,
      data: members,
      message: "Members retrieved successfully",
    })
  } catch (error) {
    console.error("Get members error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
