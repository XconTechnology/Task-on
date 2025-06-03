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
import InviteModal from "./modals/invite-modal"

// Modern Purple Design
export default function TopNavigation() {
  const { user, signOut } = useUser()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">PM</span>
              </div>
              <span className="font-semibold text-gray-800 hidden sm:block">ProjectFlow</span>
            </div>
          </div>

          {/* Center Section - Search */}
          <div className="flex-1 max-w-md mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-gray-100 border border-gray-200 rounded-lg py-1.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg
                  className="h-4 w-4 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-3">
            {/* Invite Button */}
            <Button
              onClick={() => setIsInviteModalOpen(true)}
              size="sm"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <Plus size={14} className="mr-1" />
              <span className="text-xs">Invite</span>
            </Button>

            {/* Upgrade Button */}
            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white hidden sm:flex">
              <span className="text-xs">Upgrade</span>
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 relative">
              <Bell size={18} />
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-extra-small px-1 min-w-[16px] h-4">
                3
              </Badge>
            </Button>

            {/* Help */}
            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 hidden sm:flex">
              <HelpCircle size={18} />
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Avatar className="h-8 w-8 border-2 border-purple-200">
                    <AvatarImage src={user?.profilePictureUrl || "/placeholder.svg?height=32&width=32"} />
                    <AvatarFallback className="bg-purple-100 text-purple-800">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-small hidden sm:block">{user?.username || "User"}</span>
                  <ChevronDown size={14} className="hidden sm:block text-gray-500" />
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
