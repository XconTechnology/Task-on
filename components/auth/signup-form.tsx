"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState({
    hasLength: false,
    hasLower: false,
    hasUpper: false,
    hasNumber: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/onboarding")
      } else {
        setError(data.error || "Sign up failed")
      }
    } catch (error) {
      setError(`Network error. Please try again. ${error}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")

    // Check password strength
    if (field === "password") {
      setPasswordStrength({
        hasLength: value.length >= 8,
        hasLower: /[a-z]/.test(value),
        hasUpper: /[A-Z]/.test(value),
        hasNumber: /\d/.test(value),
      })
    }
  }

  const isPasswordValid = Object.values(passwordStrength).every(Boolean)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-6 lg:hidden">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">PM</span>
          </div>
          <span className="text-xl font-bold text-gray-900">ProjectFlow</span>
        </div>
        <h1 className="header-medium mb-2">Create your account</h1>
        <p className="text-description">Start your project management journey today</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-error">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-label">
              Username
            </Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="username"
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Choose a username"
                className="pl-10"
                required
                disabled={isLoading}
                minLength={2}
                maxLength={30}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email" className="text-label">
              Email address
            </Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter your email"
                className="pl-10"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password" className="text-label">
              Password
            </Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Create a strong password"
                className="pl-10 pr-10"
                required
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${passwordStrength.hasLength ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <span className={`text-small ${passwordStrength.hasLength ? "text-green-600" : "text-gray-500"}`}>
                    At least 8 characters
                  </span>
                  {passwordStrength.hasLength && <Check size={14} className="text-green-500" />}
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${passwordStrength.hasLower ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <span className={`text-small ${passwordStrength.hasLower ? "text-green-600" : "text-gray-500"}`}>
                    One lowercase letter
                  </span>
                  {passwordStrength.hasLower && <Check size={14} className="text-green-500" />}
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${passwordStrength.hasUpper ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <span className={`text-small ${passwordStrength.hasUpper ? "text-green-600" : "text-gray-500"}`}>
                    One uppercase letter
                  </span>
                  {passwordStrength.hasUpper && <Check size={14} className="text-green-500" />}
                </div>
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${passwordStrength.hasNumber ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <span className={`text-small ${passwordStrength.hasNumber ? "text-green-600" : "text-gray-500"}`}>
                    One number
                  </span>
                  {passwordStrength.hasNumber && <Check size={14} className="text-green-500" />}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="terms"
            required
            className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            disabled={isLoading}
          />
          <label htmlFor="terms" className="text-medium text-gray-600">
            I agree to the{" "}
            <Link href="/terms" className="text-link">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-link">
              Privacy Policy
            </Link>
          </label>
        </div>

        <Button
          type="submit"
          disabled={isLoading || !isPasswordValid}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span className="text-medium">Creating account...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-medium">Create account</span>
              <ArrowRight size={16} />
            </div>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center">
        <p className="text-medium text-gray-600">
          Already have an account?{" "}
          <Link href="/signin" className="text-link font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
