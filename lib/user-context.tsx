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
  getCurrentWorkspaceId: () => string | null
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  // Add workspace state
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [currentWorkspace, setCurrentWorkspace] = useState<any | null>(null)
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)

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
      if (response.success && response.data) {
        setWorkspaces(response.data)

        // Initialize localStorage with first workspace if nothing is saved
        const savedWorkspaceId = localStorage.getItem("currentWorkspaceId")

        if (!savedWorkspaceId && response.data.length > 0) {
          // Set first workspace as default
          const firstWorkspace = response.data[0]
          setCurrentWorkspace(firstWorkspace)
          localStorage.setItem("currentWorkspaceId", firstWorkspace.id)
        } else if (savedWorkspaceId) {
          // Find and set the saved workspace
          const savedWorkspace = response.data.find((ws: any) => ws.id === savedWorkspaceId)
          if (savedWorkspace) {
            setCurrentWorkspace(savedWorkspace)
          } else {
            // Fallback to first workspace if saved one doesn't exist
            const firstWorkspace = response.data[0]
            setCurrentWorkspace(firstWorkspace)
            localStorage.setItem("currentWorkspaceId", firstWorkspace.id)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch workspaces:", error)
    }
  }

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

  useEffect(() => {
    const savedWorkspaceId = localStorage.getItem("currentWorkspaceId")
    if (savedWorkspaceId && workspaces.length > 0) {
      const savedWorkspace = workspaces.find((ws) => ws.id === savedWorkspaceId)
      if (savedWorkspace) {
        setCurrentWorkspace(savedWorkspace)
      }
    }
  }, [workspaces])

  const getCurrentWorkspaceId = (): string | null => {
    return currentWorkspaceId || currentWorkspace?.id || null
  }

  const handleSetCurrentWorkspace = (workspace: any) => {
    setCurrentWorkspace(workspace)
    setCurrentWorkspaceId(workspace?.id || null)
    // Persist to localStorage
    if (workspace?.id) {
      localStorage.setItem("currentWorkspaceId", workspace.id)
    } else {
      localStorage.removeItem("currentWorkspaceId")
    }
  }

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        refreshUser,
        signOut,
        workspaces,
        currentWorkspace,
        setCurrentWorkspace: handleSetCurrentWorkspace,
        refreshWorkspaces,
        getCurrentWorkspaceId,
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
