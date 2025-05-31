"use client"

import { useState } from "react"
import { useAppStore } from "@/lib/store"
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FolderOpen,
  Users,
  Settings,
  Plus,
  Search,
  Bell,
  Calendar,
  BarChart3,
  Target,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const SIDEBAR_PROJECTS = [
  { id: "1", name: "E-commerce Platform", color: "#3B82F6", tasks: 12, progress: 75 },
  { id: "2", name: "Mobile App", color: "#10B981", tasks: 8, progress: 45 },
  { id: "3", name: "Analytics Dashboard", color: "#F59E0B", tasks: 15, progress: 90 },
  { id: "4", name: "Marketing Website", color: "#EF4444", tasks: 6, progress: 30 },
]

const SIDEBAR_TEAMS = [
  { id: "1", name: "Frontend Team", members: 5, avatar: "/placeholder.svg?height=32&width=32" },
  { id: "2", name: "Backend Team", members: 4, avatar: "/placeholder.svg?height=32&width=32" },
  { id: "3", name: "Design Team", members: 3, avatar: "/placeholder.svg?height=32&width=32" },
]

export default function Sidebar() {
  const { isSidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const [activeItem, setActiveItem] = useState("dashboard")

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "projects", label: "Projects", icon: FolderOpen },
    { id: "teams", label: "Teams", icon: Users },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "goals", label: "Goals", icon: Target },
    { id: "time-tracking", label: "Time Tracking", icon: Clock },
  ]

  return (
    <div
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isSidebarCollapsed ? "w-16" : "w-80"
      } flex flex-col h-full custom-scrollbar overflow-y-auto`}
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-medium">PM</span>
              </div>
              <span className="header-extra-small">ProjectFlow</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1 h-8 w-8"
          >
            {isSidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>

        {!isSidebarCollapsed && (
          <div className="mt-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <Input placeholder="Search projects, tasks..." className="pl-10 bg-gray-50 border-gray-200" />
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700">
              <Plus size={16} className="mr-2" />
              <span className="text-medium text-white">New Project</span>
            </Button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <nav className="p-2">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveItem(item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-lg text-medium transition-colors ${
                      activeItem === item.id
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon size={18} className="flex-shrink-0" />
                    {!isSidebarCollapsed && <span className="ml-3">{item.label}</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {!isSidebarCollapsed && (
          <>
            {/* Recent Projects */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-label">Recent Projects</h3>
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <Plus size={12} />
                </Button>
              </div>
              <div className="space-y-2">
                {SIDEBAR_PROJECTS.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: project.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-medium truncate">{project.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${project.progress}%` }} />
                        </div>
                        <span className="text-muted-small">{project.progress}%</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-small">
                      {project.tasks}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Teams */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-label">Teams</h3>
                <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                  <Plus size={12} />
                </Button>
              </div>
              <div className="space-y-2">
                {SIDEBAR_TEAMS.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={team.avatar || "/placeholder.svg"} />
                      <AvatarFallback>{team.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-medium truncate">{team.name}</p>
                      <p className="text-muted-small">{team.members} members</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        {!isSidebarCollapsed ? (
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src="/placeholder.svg?height=40&width=40" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-medium">John Doe</p>
              <p className="text-muted-small">john@example.com</p>
            </div>
            <div className="flex space-x-1">
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                <Bell size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                <Settings size={16} />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg?height=32&width=32" />
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>
    </div>
  )
}
