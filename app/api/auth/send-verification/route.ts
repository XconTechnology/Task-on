import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { isValidEmail, checkRateLimit } from "@/lib/auth"
import { generateVerificationCode, storeVerificationCode, checkResendRateLimit } from "@/lib/verification-utils"
import { sendVerificationEmail } from "@/lib/email-verification-service"

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for")
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown"

    // Rate limiting
    if (!checkRateLimit(`send-verification:${clientIp}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many verification requests. Please try again later.",
        },
        { status: 429 },
      )
    }

    const body = await request.json()
    const { email, type, userData } = body

    // Validation
    if (!email || !type) {
      return NextResponse.json({ success: false, error: "Email and type are required" }, { status: 400 })
    }

    if (!["signup", "signin"].includes(type)) {
      return NextResponse.json({ success: false, error: "Invalid verification type" }, { status: 400 })
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ success: false, error: "Please enter a valid email address" }, { status: 400 })
    }

    // Check resend rate limit
    if (!checkResendRateLimit(email)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many resend attempts. Please wait before requesting another code.",
        },
        { status: 429 },
      )
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    if (type === "signup") {
      // For signup, check if user already exists
      const existingUser = await usersCollection.findOne({
        email: email.toLowerCase(),
      })

      if (existingUser) {
        return NextResponse.json({ success: false, error: "User with this email already exists" }, { status: 409 })
      }

      // Validate userData for signup
      if (!userData || !userData.username || !userData.password) {
        return NextResponse.json(
          { success: false, error: "Username and password are required for signup" },
          { status: 400 },
        )
      }
    } else if (type === "signin") {
      // For signin, check if user exists
      const user = await usersCollection.findOne({
        email: email.toLowerCase(),
      })

      if (!user) {
        return NextResponse.json({ success: false, error: "No account found with this email address" }, { status: 404 })
      }
    }

    // Generate and store verification code
    const code = generateVerificationCode()
    const verificationId = await storeVerificationCode(email, code, type, userData)

    // Get username for email
    let username = "User"
    if (type === "signup" && userData?.username) {
      username = userData.username
    } else if (type === "signin") {
      const user = await usersCollection.findOne({ email: email.toLowerCase() })
      username = user?.username || "User"
    }

    // Send verification email
    const emailResult = await sendVerificationEmail(email, code, username, type)

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error)
      return NextResponse.json(
        { success: false, error: "Failed to send verification email. Please try again." },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: "Verification code sent successfully",
      verificationId,
    })
  } catch (error) {
    console.error("Send verification error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
