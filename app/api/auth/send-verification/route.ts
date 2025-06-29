import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { VerificationUtils } from "@/lib/verification-utils"
import EmailService from "@/lib/email-verification-service"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, type, userData } = body

    // Validate input
    if (!email || !type) {
      return NextResponse.json({ success: false, error: "Email and type are required" }, { status: 400 })
    }

    if (!["signup", "signin"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid verification type" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ success: false, error: "Invalid email format" }, { status: 400 })
    }

    const db = await getDatabase()
    const verificationsCollection = db.collection("verifications")
    const usersCollection = db.collection("users")

    // For signin, check if user exists
    if (type === "signin") {
      const existingUser = await usersCollection.findOne({ email })
      if (!existingUser) {
        return NextResponse.json({ success: false, error: "No account found with this email address" }, { status: 404 })
      }
    }

    // For signup, check if user already exists
    if (type === "signup") {
      const existingUser = await usersCollection.findOne({ email })
      if (existingUser) {
        return NextResponse.json(
          { success: false, error: "An account with this email already exists" },
          { status: 409 },
        )
      }
    }

    // Check for existing verification and rate limiting
    const existingVerification = await verificationsCollection.findOne({
      email,
      type,
      expiresAt: { $gt: new Date() },
    })

    if (existingVerification) {
      // Check if we can resend (1 minute cooldown)
      const canResend = VerificationUtils.canResendCode(new Date(existingVerification.createdAt), 1)
      if (!canResend) {
        const timeRemaining = VerificationUtils.getTimeRemaining(new Date(existingVerification.expiresAt))
        return NextResponse.json(
          {
            success: false,
            error: "Please wait before requesting another code",
            timeRemaining:
              timeRemaining.minutes > 0
                ? `${timeRemaining.minutes}m ${timeRemaining.seconds}s`
                : `${timeRemaining.seconds}s`,
          },
          { status: 429 },
        )
      }
    }

    // Generate new verification code
    const code = VerificationUtils.generateCode()
    const verificationId = VerificationUtils.generateVerificationId()
    const expiresAt = VerificationUtils.getExpirationTime()

    // Create verification record
    const verificationRecord = {
      id: verificationId,
      email,
      code: VerificationUtils.hashCode(code), // Store hashed code
      type,
      expiresAt,
      attempts: 0,
      createdAt: new Date(),
      userData: userData || {},
    }

    // Remove any existing verification for this email and type
    await verificationsCollection.deleteMany({ email, type })

    // Insert new verification
    await verificationsCollection.insertOne(verificationRecord)

    // Send verification email
    const emailResult = await EmailService.sendVerificationCode({
      email,
      code, // Send plain code in email
      username: userData?.username,
      type,
    })

    if (!emailResult.success) {
      // Clean up verification record if email failed
      await verificationsCollection.deleteOne({ id: verificationId })

      return NextResponse.json(
        { success: false, error: "Failed to send verification email. Please try again." },
        { status: 500 },
      )
    }

    // Return success without the actual code
    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      verificationId,
      expiresAt: expiresAt.toISOString(),
      email: email.replace(/(.{2})(.*)(@.*)/, "$1***$3"), // Mask email for security
    })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
