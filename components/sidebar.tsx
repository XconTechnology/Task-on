"use client"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/lib/store"
import { Home, FolderOpen, Users, Plus, Calendar, BarChart3, Clock, PanelRight, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import InviteModal from "./modals/invite-modal"
import CreateTeamModal from "./modals/create-team-modal"
import CreateProjectModal from "./modals/create-project-modal"
import Link from "next/link"
import WorkspaceSwitcher from "./workspace-switcher"
import RecentProjectsSection from "./sidebar/RecentProjectsSection"
import TeamsSection from "./sidebar/TeamsSection"

export default function Sidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const { isSidebarCollapsed, setSidebarCollapsed } = useAppStore()
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false)
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] = useState(false)
  const [activeItem, setActiveItem] = useState(() => {
    return pathname.split("/")[1] || "dashboard"
  })

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, path: "/dashboard" },
    { id: "projects", label: "Projects", icon: FolderOpen, path: "/projects" },
    { id: "teams", label: "Teams", icon: Users, path: "/teams" },
    { id: "calendar", label: "Calendar", icon: Calendar, path: "/calendar" },
    { id: "inbox", label: "Inbox", icon: FolderOpen, path: "/inbox" },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart3,
      path: "/analytics",
    },
    {
      id: "time-tracking",
      label: "Time Tracking",
      icon: Clock,
      path: "/time-tracking",
    },
  ]

  const handleNavigation = (item: (typeof menuItems)[0]) => {
    setActiveItem(item.id)
  }

  const handleProjectCreated = (newProject: any) => {
    // Refresh projects or navigate to new project
    router.push(`/projects/${newProject.id}`)
  }

  return (
    <>
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          isSidebarCollapsed ? "w-16" : "w-72"
        } flex flex-col h-full custom-scrollbar overflow-y-auto`}
      >
        {/* Header */}
        <div className="px-4 py-1 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && <WorkspaceSwitcher />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 h-8 w-8"
            >
              {isSidebarCollapsed ? <PanelLeft size={16} /> : <PanelRight size={16} />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="p-2">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.id}>
                    <Link
                      href={item.path}
                      onClick={() => handleNavigation(item)}
                      className={`w-full flex items-center px-3 py-2 rounded-lg text-medium transition-colors ${
                        activeItem === item.id
                          ? "bg-blue-50 text-primary border-r-2 border-primary"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      {!isSidebarCollapsed && <span className="ml-3">{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {!isSidebarCollapsed && (
            <>
              {/* Recent Projects */}
              <RecentProjectsSection onCreateProject={() => setIsCreateProjectModalOpen(true)} />

              {/* Teams */}
              <TeamsSection onCreateTeam={() => setIsCreateTeamModalOpen(true)} />
            </>
          )}
        </div>

        {/* Bottom Actions */}
        {!isSidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setIsInviteModalOpen(true)}
            >
              <Plus size={16} className="mr-2" />
              <span className="text-medium">Invite</span>
            </Button>
          </div>
        )}
      </div>

      <InviteModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} />
      <CreateTeamModal isOpen={isCreateTeamModalOpen} onClose={() => setIsCreateTeamModalOpen(false)} />
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </>
  )
}



