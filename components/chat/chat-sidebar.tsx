"use client"

import { useState } from "react"
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import type { ChatUser } from "@/lib/types"

interface TeamData {
  id: string
  teamName: string
  description: string
  workspaceId: string
  members: string[]
}

interface UserData {
  id: string
  username: string
  email: string
  profilePictureUrl?: string
}

interface ChatSidebarProps {
  teamData: TeamData
  userData: UserData
  teamMembers: UserData[]
  onlineUsers: ChatUser[]
  isOpen: boolean
  onToggle: () => void
}

export default function ChatSidebar({
  teamData,
  userData,
  teamMembers,
  onlineUsers,
  isOpen,
  onToggle,
}: ChatSidebarProps) {
  if (!isOpen) {
    return (
      <div className="w-12 bg-white border-l border-gray-200 flex flex-col">
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="w-full h-8 p-1"
            title="Open sidebar"
          >
            <ChevronLeft size={16} />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="p-1 h-8 w-8"
          title="Close sidebar"
        >
          <ChevronRight size={16} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-3">
          {teamMembers.map((member) => {
            const isOnline = onlineUsers.find((u) => u.id === member.id)?.isOnline || false

            return (
              <div key={member.id} className="flex items-center space-x-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                    <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  {isOnline && (
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {member.username}
                    {member.id === userData.id && " (You)"}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{member.email}</p>
                </div>
                {isOnline && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    Online
                  </Badge>
                )}
              </div>
            )
          })}
        </div>

        {teamData.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">About</h4>
            <p className="text-sm text-gray-600">{teamData.description}</p>
          </div>
        )}
      </div>
    </div>
  )
}
