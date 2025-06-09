"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronDown, Plus, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { workspaceApi } from "@/lib/api"
import { useUser } from "@/lib/user-context"

export default function WorkspaceSwitcher() {
  const router = useRouter()
  const { workspaces, currentWorkspace, setCurrentWorkspace, isLoading } = useUser()
  const [isSwitching, setIsSwitching] = useState(false)

  const handleWorkspaceSwitch = async (workspace: any) => {
    if (isSwitching) return // Prevent multiple clicks

    try {
      setIsSwitching(true)

      // Update the current workspace immediately for better UX
      setCurrentWorkspace(workspace)

      // Call the API to switch workspace
      const response = await workspaceApi.switchWorkspace(workspace.id)

      if (response.success) {
        // Force a refresh of the page to update all data
        window.location.reload()
      } else {
        // Revert if API call failed
        console.error("Failed to switch workspace:", response.error)
        // Don't revert the UI change, just log the error
      }
    } catch (error) {
      console.error("Failed to switch workspace:", error)
      // Don't revert the UI change, just log the error
    } finally {
      setIsSwitching(false)
    }
  }

  const handleCreateWorkspace = () => {
    router.push("/workspace/create")
  }

  const handleSettings = () => {
    router.push("/workspace/settings")
  }

  // Show loading only if user context is loading
  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 p-2">
        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
        <div className="space-y-1">
          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  // If no current workspace, show default
  if (!currentWorkspace) {
    return (
      <Button variant="ghost" className="w-full justify-between p-2 h-auto hover:bg-gray-50">
        <div className="flex items-center space-x-2 min-w-0">
          <Avatar className="h-8 w-8 border-2 border-gray-200">
            <AvatarFallback className="bg-gray-100 text-gray-800 text-sm">W</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">No Workspace</p>
            <p className="text-xs text-gray-500">Select workspace</p>
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-gray-400" />
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-between p-2 h-auto hover:bg-gray-50">
          <div className="flex items-center space-x-2 min-w-0">
            <Avatar className="h-8 w-8 border-2 border-teal-200">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentWorkspace.name}`} />
              <AvatarFallback className="bg-teal-100 text-teal-800 text-sm">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium truncate">{currentWorkspace.name}</p>
              <p className="text-xs text-gray-500">{currentWorkspace.userRole || "Member"}</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start">
        {/* Current Workspace */}
        <div className="p-3 border-b">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${currentWorkspace.name}`} />
              <AvatarFallback className="bg-teal-100 text-teal-800">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{currentWorkspace.name}</p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {currentWorkspace.userRole || "Member"}
                </Badge>
                <span className="text-xs text-gray-500">{currentWorkspace.memberCount || 0} members</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Actions */}
        <div className="p-1">
          <DropdownMenuItem onClick={handleSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </DropdownMenuItem>
        </div>
        <DropdownMenuSeparator />

        {/* Switch Workspace */}
        {workspaces.length > 1 && (
          <>
            <div className="p-2">
              <p className="text-xs font-medium text-gray-500 mb-2 px-2">Switch Workspace:</p>
              {workspaces
                .filter((ws) => ws.id !== currentWorkspace?.id)
                .map((workspace) => (
                  <DropdownMenuItem
                    key={workspace.id}
                    onClick={() => handleWorkspaceSwitch(workspace)}
                    className="p-2"
                    disabled={isSwitching}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${workspace.name}`} />
                        <AvatarFallback className="bg-blue-100 text-blue-800 text-sm">
                          {workspace.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{workspace.name}</p>
                        <p className="text-xs text-gray-500">{workspace.userRole || "Member"}</p>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Create Workspace */}
        <div className="p-1">
          <DropdownMenuItem onClick={handleCreateWorkspace}>
            <Plus className="h-4 w-4 mr-2" />
            Create Workspace
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
