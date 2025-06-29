import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { VerificationUtils } from "@/lib/verification-utils"
import { EmailService } from "@/lib/email-service"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, type } = body

    // Validate input
    if (!email || !code || !type) {
      return NextResponse.json({ success: false, error: "Email, code, and type are required" }, { status: 400 })
    }

    if (!VerificationUtils.isValidCodeFormat(code)) {
      return NextResponse.json(
        { success: false, error: "Invalid code format. Please enter a 6-digit code." },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const verificationsCollection = db.collection("verifications")
    const usersCollection = db.collection("users")
    const workspacesCollection = db.collection("workspaces")

    // Find verification record
    const verification = await verificationsCollection.findOne({
      email,
      type,
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: "No verification found. Please request a new code." },
        { status: 404 },
      )
    }

    // Check if expired
    if (VerificationUtils.isExpired(new Date(verification.expiresAt))) {
      // Clean up expired verification
      await verificationsCollection.deleteOne({ _id: verification._id })
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new code." },
        { status: 410 },
      )
    }

    // Check attempts limit
    if (VerificationUtils.hasExceededAttempts(verification.attempts)) {
      // Clean up verification after too many attempts
      await verificationsCollection.deleteOne({ _id: verification._id })
      return NextResponse.json(
        { success: false, error: "Too many failed attempts. Please request a new code." },
        { status: 429 },
      )
    }

    // Verify the code
    const isValidCode = VerificationUtils.verifyHashedCode(code, verification.code)

    if (!isValidCode) {
      // Increment attempts
      await verificationsCollection.updateOne({ _id: verification._id }, { $inc: { attempts: 1 } })

      const remainingAttempts = 5 - (verification.attempts + 1)
      return NextResponse.json(
        {
          success: false,
          error: `Invalid verification code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts,
        },
        { status: 400 },
      )
    }

    // Code is valid - process based on type
    let result: any = { success: true }

    if (type === "signup") {
      // Create new user account
      const { username, password, workspaceId } = verification.userData

      if (!username || !password) {
        return NextResponse.json({ success: false, error: "Missing user data for signup" }, { status: 400 })
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 12)

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const newUser = {
        id: userId,
        username,
        email,
        password: hashedPassword,
        workspaceIds: workspaceId ? [workspaceId] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        emailVerified: true,
        emailVerifiedAt: new Date().toISOString(),
      }

      await usersCollection.insertOne(newUser)

      // If joining existing workspace, add user to workspace
      if (workspaceId) {
        await workspacesCollection.updateOne(
          { id: workspaceId },
          {
            $push: {
              members: {
                userId,
                role: "Member",
                joinedAt: new Date().toISOString(),
              },
            },
          },
        )
      }

      // Send welcome email (don't wait for it)
      EmailService.sendWelcomeEmail(email, username).catch((error) => {
        console.error("Failed to send welcome email:", error)
      })

      result = {
        success: true,
        message: "Account created successfully",
        user: {
          id: userId,
          username,
          email,
          workspaceIds: newUser.workspaceIds,
        },
        redirectTo: workspaceId ? "/dashboard" : "/onboarding",
      }
    } else if (type === "signin") {
      // Find existing user
      const user = await usersCollection.findOne({ email })

      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      // Update email verification status if not already verified
      if (!user.emailVerified) {
        await usersCollection.updateOne(
          { id: user.id },
          {
            $set: {
              emailVerified: true,
              emailVerifiedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          },
        )
      }

      result = {
        success: true,
        message: "Email verified successfully",
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          workspaceIds: user.workspaceIds || [],
        },
        redirectTo: "/dashboard",
      }
    }

    // Clean up verification record
    await verificationsCollection.deleteOne({ _id: verification._id })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
