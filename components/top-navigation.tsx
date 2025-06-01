"use client"

import { useState } from "react"
import { useUser } from "@/lib/user-context"
import { Plus, Bell, Settings, HelpCircle, LogOut, User, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import GlobalSearch from "./global-search"
import InviteModal from "./modals/invite-modal"

export default function TopNavigation() {
  const { user, signOut } = useUser()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-800 px-4 py-1">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold text-xs">PM</span>
              </div>
            </div>

          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-4">
            <GlobalSearch />
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-2">
            {/* Invite Button */}
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20"
            >
              <Plus size={14} className="mr-1" />
              <span className="text-small">Invite</span>
            </Button>

            {/* Upgrade Button */}
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white hidden sm:flex">
              <span className="text-small">Upgrade</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="text-white hover:bg-purple-500/20 relative">
              <Bell size={16} />
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-extra-small px-1 min-w-[16px] h-4">
                3
              </Badge>
            </Button>

            {/* Help */}
            <Button variant="ghost" size="sm" className="text-white hover:bg-purple-500/20 hidden sm:flex">
              <HelpCircle size={16} />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-purple-500/20 flex items-center space-x-2"
                >
                  <Avatar className="h-8 w-8 border-2 border-purple-400">
                    <AvatarImage src={user?.profilePictureUrl || "/placeholder.svg?height=32&width=32"} />
                    <AvatarFallback className="bg-purple-300 text-purple-800">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-small hidden sm:block">{user?.username || "User"}</span>
                  <ChevronDown size={14} className="hidden sm:block" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white">
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-medium font-semibold text-gray-900">{user?.username || "User"}</p>
                  <p className="text-small text-gray-600">{user?.email || "user@example.com"}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer">
                  <User size={16} className="mr-2" />
                  <span className="text-medium">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings size={16} className="mr-2" />
                  <span className="text-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="cursor-pointer text-red-600 hover:text-red-700">
                  <LogOut size={16} className="mr-2" />
                  <span className="text-medium">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => {
          // Refresh teams or members data if needed
        }}
      />
    </>
  )
}
