"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Mail, RefreshCw, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Get parameters from URL
  const email = searchParams.get("email")
  const type = searchParams.get("type") as "signup" | "signin"
  const verificationId = searchParams.get("verificationId")

  // State management
  const [code, setCode] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [timeRemaining, setTimeRemaining] = useState(600) // 10 minutes in seconds
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)

  // Refs for input focus management
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Redirect if missing required parameters
  useEffect(() => {
    if (!email || !type || !["signup", "signin"].includes(type)) {
      router.push("/signin")
      return
    }
  }, [email, type, router])

  // Timer for code expiration
  useEffect(() => {
    if (timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setCanResend(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining])

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return

    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [resendCooldown])

  // Auto-focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus()
    }
  }, [])

  // Handle input change
  const handleInputChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newCode = [...code]
    newCode[index] = value.slice(-1) // Only take the last character
    setCode(newCode)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newCode.every((digit) => digit !== "") && newCode.join("").length === 6) {
      handleVerify(newCode.join(""))
    }
  }

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)

    if (pastedData.length === 6) {
      const newCode = pastedData.split("")
      setCode(newCode)
      setError("")

      // Focus last input
      inputRefs.current[5]?.focus()

      // Auto-submit
      handleVerify(pastedData)
    }
  }

  // Verify code
  const handleVerify = async (codeToVerify?: string) => {
    const verificationCode = codeToVerify || code.join("")

    if (verificationCode.length !== 6) {
      setError("Please enter all 6 digits")
      return
    }

    setIsVerifying(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          code: verificationCode,
          type,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(data.message)

        // Store user data in localStorage for authentication
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user))
        }

        // Redirect after a short delay
        setTimeout(() => {
          router.push(data.redirectTo || "/dashboard")
        }, 1500)
      } else {
        setError(data.error)
        // Clear the code inputs on error
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error("Verification error:", error)
      setError("Network error. Please try again.")
    } finally {
      setIsVerifying(false)
    }
  }

  // Resend code
  const handleResend = async () => {
    if (resendCooldown > 0) return

    setIsResending(true)
    setError("")

    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          type,
          userData: {}, // Empty for resend
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess("New verification code sent!")
        setTimeRemaining(600) // Reset timer
        setCanResend(false)
        setResendCooldown(60) // 1 minute cooldown
        setCode(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error("Resend error:", error)
      setError("Failed to resend code. Please try again.")
    } finally {
      setIsResending(false)
    }
  }

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  // Get masked email for display
  const getMaskedEmail = (email: string) => {
    const [username, domain] = email.split("@")
    const maskedUsername = username.slice(0, 2) + "*".repeat(username.length - 2)
    return `${maskedUsername}@${domain}`
  }

  if (!email || !type) {
    return null // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Back button */}
        <div className="mb-6">
          <Link href={type === "signup" ? "/signup" : "/signin"}>
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to {type === "signup" ? "Sign Up" : "Sign In"}
            </Button>
          </Link>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Mail className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Verify Your Email</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                We&apos;ve sent a 6-digit verification code to
                <br />
                <span className="font-medium text-gray-900">{getMaskedEmail(email)}</span>
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Success Message */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Code Input */}
            <div className="space-y-4">
              <div className="flex justify-center space-x-3">
                {code.map((digit, index) => (
                  <Input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleInputChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className="w-12 h-12 text-center text-xl font-bold border-2 focus:border-blue-500"
                    disabled={isVerifying}
                  />
                ))}
              </div>

              <Button
                onClick={() => handleVerify()}
                disabled={isVerifying || code.some((digit) => !digit)}
                className="w-full h-12 text-lg font-semibold"
              >
                {isVerifying ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Code"
                )}
              </Button>
            </div>

            {/* Timer and Resend */}
            <div className="text-center space-y-3">
              {timeRemaining > 0 ? (
                <p className="text-sm text-gray-600">
                  Code expires in <span className="font-medium text-gray-900">{formatTime(timeRemaining)}</span>
                </p>
              ) : (
                <p className="text-sm text-red-600 font-medium">Verification code has expired</p>
              )}

              <div className="flex items-center justify-center space-x-2">
                <span className="text-sm text-gray-600">Didn&apos;t receive the code?</span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={handleResend}
                  disabled={isResending || resendCooldown > 0}
                  className="p-0 h-auto font-medium text-blue-600 hover:text-blue-700"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                      Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    "Resend Code"
                  )}
                </Button>
              </div>
            </div>

            {/* Help Text */}
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Check your spam folder if you don&apos;t see the email.
                <br />
                Need help?{" "}
                <Link href="/support" className="text-blue-600 hover:underline">
                  Contact support
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
