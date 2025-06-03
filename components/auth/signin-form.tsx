"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignInForm() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        // Check if user has completed onboarding
        const userResponse = await fetch("/api/auth/me")
        const userData = await userResponse.json()

        if (userData.success && userData.data.user.workspaceId) {
          router.push("/dashboard")
        } else {
          router.push("/onboarding")
        }
      } else {
        setError(data.error || "Sign in failed")
      }
    } catch (error) {
      setError("Network error. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-6 lg:hidden">
          <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">PM</span>
          </div>
          <span className="text-xl font-bold text-gray-900">ProjectFlow</span>
        </div>
        <h1 className="header-medium mb-2">Welcome back</h1>
        <p className="text-description">Sign in to your account to continue</p>
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
                placeholder="Enter your password"
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
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
            <span className="ml-2 text-medium text-gray-600">Remember me</span>
          </label>
          <Link href="/forgot-password" className="text-link">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700 text-white h-12">
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              <span className="text-medium">Signing in...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-medium">Sign in</span>
              <ArrowRight size={16} />
            </div>
          )}
        </Button>
      </form>

      {/* Footer */}
      <div className="text-center">
        <p className="text-medium text-gray-600">
          Don't have an account?{" "}
          <Link href="/signup" className="text-link font-medium">
            Sign up for free
          </Link>
        </p>
      </div>
    </div>
  )
}
