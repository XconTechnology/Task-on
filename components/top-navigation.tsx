"use client"
import { Plus, Bell, Settings, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import GlobalSearch from "./global-search"

export default function TopNavigation() {
  return (
    <div className="bg-gradient-to-r from-purple-600 to-purple-700 border-b border-purple-800 px-4 py-2">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="text-purple-600 font-bold text-medium">PM</span>
            </div>
            <span className="text-white font-semibold text-medium hidden sm:block">ProjectFlow</span>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="text-white hover:bg-purple-500/20">
              <span className="text-small">Dashboards</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-purple-500/20">
              <span className="text-small">Projects</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-white hover:bg-purple-500/20">
              <span className="text-small">Teams</span>
            </Button>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="flex-1 max-w-md mx-4">
          <GlobalSearch />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Upgrade Button */}
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white hidden sm:flex">
            <span className="text-small">Upgrade</span>
          </Button>

          {/* New Button */}
          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
            <Plus size={14} className="mr-1" />
            <span className="text-small">New</span>
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

          {/* Settings */}
          <Button variant="ghost" size="sm" className="text-white hover:bg-purple-500/20 hidden sm:flex">
            <Settings size={16} />
          </Button>

          {/* User Avatar */}
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8 border-2 border-purple-400">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback className="bg-purple-300 text-purple-800">JD</AvatarFallback>
            </Avatar>
            <span className="text-white text-small hidden sm:block">John Doe</span>
          </div>
        </div>
      </div>
    </div>
  )
}
