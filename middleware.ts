import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define which paths require authentication
const protectedPaths = ["/dashboard", "/projects", "/teams", "/calendar", "/inbox", "/analytics", "/time-tracking"]

// Define authentication-specific paths
const authPaths = ["/signin", "/signup", "/forgot-password", "/reset-password"]

export function middleware(request: NextRequest) {
  // Extract the path from the request URL
  const path = request.nextUrl.pathname

  // Get the authentication status from a cookie
  const isAuthenticated = request.cookies.has("auth-token") || request.cookies.has("session")

  // Handle protected paths - redirect to signin if not authenticated
  if (protectedPaths.some((prefix) => path.startsWith(prefix)) && !isAuthenticated) {
    return NextResponse.redirect(new URL("/signin", request.url))
  }

  // Handle auth paths - redirect to dashboard if already authenticated
  if (authPaths.includes(path) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Handle root path - redirect to dashboard if authenticated, otherwise to signin
  if (path === "/" || path === "") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", request.url))
    } else {
      return NextResponse.redirect(new URL("/signin", request.url))
    }
  }

  // Allow the request to continue
  return NextResponse.next()
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    // Protected routes
    "/dashboard/:path*",
    "/projects/:path*",
    "/teams/:path*",
    "/calendar/:path*",
    "/inbox/:path*",
    "/analytics/:path*",
    "/time-tracking/:path*",

    // Auth routes
    "/signin",
    "/signup",
    "/forgot-password",
    "/reset-password",

    // Root path
    "/",
  ],
}
