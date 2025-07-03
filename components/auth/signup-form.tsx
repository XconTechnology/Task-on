"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react"

export default function SignUpForm() {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: [] as string[],
  })

  const router = useRouter()
  const searchParams = useSearchParams()
  const workspaceId = searchParams.get("workspaceId")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
    setError("")

    // Check password strength
    if (name === "password") {
      checkPasswordStrength(value)
    }
  }

  const checkPasswordStrength = (password: string) => {
    let score = 0
    const feedback = []

    if (password.length >= 8) score++
    else feedback.push("At least 8 characters")

    if (/[a-z]/.test(password)) score++
    else feedback.push("One lowercase letter")

    if (/[A-Z]/.test(password)) score++
    else feedback.push("One uppercase letter")

    if (/\d/.test(password)) score++
    else feedback.push("One number")

    if (/[^a-zA-Z0-9]/.test(password)) score++
    else feedback.push("One special character")

    setPasswordStrength({ score, feedback })
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return "bg-red-500"
    if (passwordStrength.score <= 2) return "bg-orange-500"
    if (passwordStrength.score <= 3) return "bg-yellow-500"
    if (passwordStrength.score <= 4) return "bg-blue-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength.score <= 1) return "Very Weak"
    if (passwordStrength.score <= 2) return "Weak"
    if (passwordStrength.score <= 3) return "Fair"
    if (passwordStrength.score <= 4) return "Good"
    return "Strong"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return

    // Validate form
    if (!formData.username.trim()) {
      setError("Username is required")
      return
    }

    if (formData.username.length < 2 || formData.username.length > 30) {
      setError("Username must be between 2 and 30 characters")
      return
    }

    if (!formData.email.trim()) {
      setError("Email is required")
      return
    }

    if (!formData.password) {
      setError("Password is required")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (passwordStrength.score < 3) {
      setError("Please choose a stronger password")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // Send verification code
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          type: "signup",
          userData: {
            username: formData.username,
            password: formData.password,
            workspaceId: workspaceId,
          },
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to verification page
        router.push(
          `/verify?email=${encodeURIComponent(formData.email)}&type=signup&verificationId=${data.verificationId}`,
        )
      } else {
        setError(data.error || "Failed to send verification code")
      }
    } catch (error) {
      console.error("Signup error:", error)
      setError("Network error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
        <p className="text-gray-600">Join ProjectFlow and start managing your projects</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-sm font-medium text-gray-700">
            Username
          </Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="Enter your username"
            value={formData.username}
            onChange={handleChange}
            disabled={isLoading}
            className="h-11"
            autoComplete="username"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            disabled={isLoading}
            className="h-11"
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="h-11 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">{getPasswordStrengthText()}</span>
              </div>
              {passwordStrength.feedback.length > 0 && (
                <div className="text-xs text-gray-500">Missing: {passwordStrength.feedback.join(", ")}</div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
            Confirm Password
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className="h-11 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {formData.confirmPassword && formData.password !== formData.confirmPassword && (
            <div className="flex items-center space-x-1 text-red-600 text-xs">
              <AlertCircle size={12} />
              <span>Passwords do not match</span>
            </div>
          )}
          {formData.confirmPassword && formData.password === formData.confirmPassword && formData.password && (
            <div className="flex items-center space-x-1 text-green-600 text-xs">
              <CheckCircle size={12} />
              <span>Passwords match</span>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </form>

      {/* Terms */}
      <div className="text-center text-xs text-gray-500">
        By creating an account, you agree to our{" "}
        <Link href="/terms" className="text-blue-600 hover:underline">
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="text-blue-600 hover:underline">
          Privacy Policy
        </Link>
      </div>

      {/* Sign In Link */}
      <div className="text-center">
        <span className="text-gray-600">Already have an account? </span>
        <Link href="/signin" className="text-blue-600 hover:underline font-medium">
          Sign in
        </Link>
      </div>
    </div>
  )
}
