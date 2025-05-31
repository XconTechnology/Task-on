import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { hashPassword, generateToken, isValidEmail, isValidPassword, checkRateLimit } from "@/lib/auth"
import type { User } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const clientIp = request.ip || request.headers.get("x-forwarded-for") || "unknown"

    // Rate limiting
    if (!checkRateLimit(`signup:${clientIp}`, 3, 15 * 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: "Too many signup attempts. Please try again later." },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { email, password, username } = body

    // Validation
    if (!email || !password || !username) {
      return NextResponse.json({ success: false, error: "Email, password, and username are required" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address" }, { status: 400 })
    }

    const passwordValidation = isValidPassword(password)
    if (!passwordValidation.isValid) {
      return NextResponse.json({ success: false, error: passwordValidation.message }, { status: 400 })
    }

    if (username.length < 2 || username.length > 30) {
      return NextResponse.json(
        { success: false, error: "Username must be between 2 and 30 characters" },
        { status: 400 },
      )
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "User with this email or username already exists" },
        { status: 409 },
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newUser: User = {
      id: userId,
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
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

    // Remove password from response
    const { password: _, ...userResponse } = newUser

    const response = NextResponse.json({
      success: true,
      data: { user: userResponse },
      message: "Account created successfully",
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
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
