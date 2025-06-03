"use client"

import type React from "react"

import { useUser } from "@/lib/user-context"
import TopNavigation from "@/components/top-navigation"
import Sidebar from "@/components/sidebar"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-description">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // Middleware will handle redirect
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 ">
      <TopNavigation />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto custom-scrollbar">{children}</main>
      </div>
    </div>
  )
}
