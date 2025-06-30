import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken, isValidPassword } from "@/lib/auth"
import { getVerificationCode, verifyCode, incrementAttempts, deleteVerificationCode } from "@/lib/verification-utils"
import type { User } from "@/lib/types"
import { sendWelcomeEmail } from "@/lib/email-verification-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, code, type } = body

    // Validation
    if (!email || !code || !type) {
      return NextResponse.json({ success: false, error: "Email, code, and type are required" }, { status: 400 })
    }

    if (!["signup", "signin"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid verification type" }, { status: 400 })
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json({ success: false, error: "Verification code must be 6 digits" }, { status: 400 })
    }

    // Get verification record
    const verification = await getVerificationCode(email, type)

    if (!verification) {
      return NextResponse.json({ success: false, error: "Invalid or expired verification code" }, { status: 400 })
    }

    // Check attempts
    if (verification.attempts >= verification.maxAttempts) {
      await deleteVerificationCode(email, type)
      return NextResponse.json(
        { success: false, error: "Too many failed attempts. Please request a new code." },
        { status: 400 },
      )
    }

    // Verify code
    const isValidCode = await verifyCode(code, verification.code)

    if (!isValidCode) {
      await incrementAttempts(email, type)
      return NextResponse.json({ success: false, error: "Invalid verification code" }, { status: 400 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    if (type === "signup") {
      // Create new user
      const { userData } = verification

      if (!userData || !userData.username || !userData.password) {
        return NextResponse.json({ success: false, error: "Invalid user data" }, { status: 400 })
      }

      // Validate password
      const passwordValidation = isValidPassword(userData.password)
      if (!passwordValidation.isValid) {
        return NextResponse.json({ success: false, error: passwordValidation.message }, { status: 400 })
      }

      // Check if user already exists (double-check)
      const existingUser = await usersCollection.findOne({
        $or: [{ email: email.toLowerCase() }, { username: userData.username }],
      })

      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "User with this email or username already exists" },
          { status: 409 },
        )
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password)

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newUser: User = {
        id: userId,
        username: userData.username,
        email: email.toLowerCase(),
        password: hashedPassword,
        workspaceIds: userData.workspaceIds || [],
        profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userData.username}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await usersCollection.insertOne(newUser)

      // Generate JWT token
      const token = generateToken({
        userId: newUser.id,
        email: newUser.email,
        username: newUser.username,
      })

      // Send welcome email
      await sendWelcomeEmail(email, userData.username)

      // Clean up verification code
      await deleteVerificationCode(email, type)

      // Remove password from response
      const { password: _, ...userResponse } = newUser

      const response = NextResponse.json({
        success: true,
        message: "Account created and verified successfully",
        user: userResponse,
        redirectTo: "/onboarding",
      })

      // Set HTTP-only cookie
      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })

      return response
    } else if (type === "signin") {
      // Sign in existing user
      const user = await usersCollection.findOne({ email: email.toLowerCase() })

      if (!user) {
        return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
      }

      // Generate JWT token
      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      })

      // Clean up verification code
      await deleteVerificationCode(email, type)

      // Remove password from response
      const { password: _, ...userResponse } = user

      const response = NextResponse.json({
        success: true,
        message: "Signed in successfully",
        user: userResponse,
        redirectTo: "/dashboard",
      })

      // Set HTTP-only cookie
      response.cookies.set("auth-token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: "/",
      })

      return response
    }
  } catch (error) {
    console.error("Verify code error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
