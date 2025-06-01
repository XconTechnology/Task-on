import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest, hashPassword } from "@/lib/auth"
import type { User } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { emails, role = "Member" } = body

    // Validation
    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ success: false, error: "Email addresses are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get user's workspace
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const results = []

    for (const email of emails) {
      try {
        // Check if user already exists
        const existingUser = await usersCollection.findOne({ email: email.toLowerCase() })

        if (existingUser) {
          if (existingUser.workspaceId === userData.workspaceId) {
            results.push({ email, status: "already_member", message: "User is already a member" })
          } else {
            // Update user's workspace
            await usersCollection.updateOne(
              { id: existingUser.id },
              {
                $set: {
                  workspaceId: userData.workspaceId,
                  updatedAt: new Date().toISOString(),
                },
              },
            )
            results.push({ email, status: "added", message: "User added to workspace" })
          }
        } else {
          // Create new user with temporary password
          const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const tempPassword = Math.random().toString(36).slice(-8)
          const hashedPassword = await hashPassword(tempPassword)

          const newUser: User = {
            id: userId,
            username: email.split("@")[0],
            email: email.toLowerCase(),
            password: hashedPassword,
            profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
            workspaceId: userData.workspaceId,
            role,
            isInvited: true,
            tempPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }

          await usersCollection.insertOne(newUser)

          // In a real app, you would send an email invitation here
          results.push({
            email,
            status: "invited",
            message: "Invitation sent",
            tempPassword, // In production, this would be sent via email
          })
        }
      } catch (error) {
        results.push({ email, status: "error", message: "Failed to process invitation" })
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
      message: "Invitations processed successfully",
    })
  } catch (error) {
    console.error("Invite users error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
