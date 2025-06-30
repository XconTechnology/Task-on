import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import {
  verifyPassword,
  generateToken,
  isValidEmail,
  checkRateLimit,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const forwardedFor = request.headers.get("x-forwarded-for");
    const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // Rate limiting
    if (!checkRateLimit(`signin:${clientIp}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        {
          success: false,
          error: "Too many signin attempts. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password, validateOnly = false } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");

    // Find user
    const user = await usersCollection.findOne({ email: email.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // If validateOnly is true, just return success without creating session
    if (validateOnly) {
      return NextResponse.json({
        success: true,
        message: "Credentials validated successfully",
      });
    }

    // Generate JWT token for full signin
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
    });

    // Remove password from response
    const { password: _, ...userResponse } = user;

    const response = NextResponse.json({
      success: true,
      data: { user: userResponse },
      message: "Signed in successfully",
    });

    // Set HTTP-only cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Signin error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
