"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useUser } from "@/lib/user-context"
import TargetsContent from "@/components/targets-content"

export default function TargetsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const { user, isLoading: userLoading, currentWorkspace } = useUser()
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [user, userLoading, currentWorkspace])

  const checkAccess = async () => {
    // Wait for user context to load
    if (userLoading) {
      return
    }

    try {
      // Check if user is authenticated
      if (!user) {
        router.push("/signin")
        return
      }

      // Check if user has a current workspace
      if (!currentWorkspace) {
        router.push("/dashboard")
        return
      }

      // Check user role in current workspace
      // We'll make an API call to check permissions since we can't use server-side utilities
      const response = await fetch("/api/auth/check-permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspace.id,
        },
        body: JSON.stringify({
          action: "view_targets",
        }),
      })

      const data = await response.json()

      if (!data.success || !data.hasPermission) {
        router.push("/dashboard")
        return
      }

      setHasAccess(true)
    } catch (error) {
      console.error("Access check failed:", error)
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  if (userLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600">You don&apos;t have permission to access this page.</p>
        </div>
      </div>
    )
  }

  return <TargetsContent />
}
