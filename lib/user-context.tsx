"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@/lib/types"
import { workspaceApi } from "@/lib/api"

interface UserContextType {
  user: User | null
  isLoading: boolean
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
  // Add workspace functionality
  workspaces: any[]
  currentWorkspace: any | null
  setCurrentWorkspace: (workspace: any) => void
  refreshWorkspaces: () => Promise<void>
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Add workspace state
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<any | null>(null)

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()

      if (data.success) {
        setUser(data.data.user)
        // Fetch workspaces after user is loaded
        if (data.data.user) {
          await fetchWorkspaces()
        }
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Failed to fetch user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWorkspaces = async () => {
    try {
      const response = await workspaceApi.getUserWorkspaces()
      console.log('response',response)
      if (response.success && response.data) {
        setWorkspaces(response.data)
        // Set first workspace as current if none selected
        if (response.data.length > 0 && !currentWorkspace) {
          setCurrentWorkspace(response.data[0])
        }
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
    }
  }

  console.log(workspaces)
  const refreshUser = async () => {
    await fetchUser()
  }

  const refreshWorkspaces = async () => {
    await fetchWorkspaces()
  }

  const signOut = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      setUser(null)
      setWorkspaces([])
      setCurrentWorkspace(null)
      window.location.href = "/signin"
    } catch (error) {
      console.error("Sign out failed:", error)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        refreshUser,
        signOut,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace,
        refreshWorkspaces,
      }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider")
  }
  return context
}
