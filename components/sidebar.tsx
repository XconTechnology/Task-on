"use client";

import React from "react";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAppStore } from "@/lib/store";
import { useUser } from "@/lib/user-context";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  FolderOpen,
  Users,
  Plus,
  Calendar,
  BarChart3,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import InviteModal from "./modals/invite-modal";
import CreateTeamModal from "./modals/create-team-modal";
import CreateProjectModal from "./modals/create-project-modal";
import Link from "next/link";
import WorkspaceSwitcher from "./workspace-switcher";
import { projectApi, teamApi } from "@/lib/api";

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  const { isSidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [isCreateProjectModalOpen, setIsCreateProjectModalOpen] =
    useState(false);
  const [activeItem, setActiveItem] = useState(() => {
    return pathname.split("/")[1] || "dashboard";
  });

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
  ];

  const handleNavigation = (item: (typeof menuItems)[0]) => {
    setActiveItem(item.id);
  };

  const handleProjectCreated = (newProject: any) => {
    // Refresh projects or navigate to new project
    router.push(`/projects/${newProject.id}`);
  };

  console.log(activeItem);
  return (
    <>
      <div
        className={`bg-white border-r border-gray-200 transition-all duration-300 ${
          isSidebarCollapsed ? "w-16" : "w-72"
        } flex flex-col h-full custom-scrollbar overflow-y-auto`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isSidebarCollapsed && <WorkspaceSwitcher />}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1 h-8 w-8"
            >
              {isSidebarCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={16} />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <nav className="p-2">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
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
                      {!isSidebarCollapsed && (
                        <span className="ml-3">{item.label}</span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {!isSidebarCollapsed && (
            <>
              {/* Recent Projects */}
              <RecentProjectsSection
                onCreateProject={() => setIsCreateProjectModalOpen(true)}
              />

              {/* Teams */}
              <TeamsSection
                onCreateTeam={() => setIsCreateTeamModalOpen(true)}
              />
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

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
      />
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
      />
      <CreateProjectModal
        isOpen={isCreateProjectModalOpen}
        onClose={() => setIsCreateProjectModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </>
  );
}

function RecentProjectsSection({
  onCreateProject,
}: {
  onCreateProject: () => void;
}) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real projects
  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await projectApi.getProjects(); // ✅ Using your projectApi

        if (response.success) {
          setProjects(response.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch projects:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label">Recent Projects</h3>
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6"
          onClick={onCreateProject}
        >
          <Plus size={12} />
        </Button>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <Skeleton className="w-3 h-3 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-2 w-3/4" />
              </div>
              <Skeleton className="h-5 w-8 rounded" />
            </div>
          ))
        ) : projects.length > 0 ? (
          projects.map((project: any) => (
            <Link
              href={`/projects/${project.id}`}
              key={project.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="w-3 h-3 rounded-full flex-shrink-0 bg-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-medium truncate">{project.name}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div
                      className="bg-blue-600 h-1 rounded-full"
                      style={{ width: "75%" }}
                    />
                  </div>
                  <span className="text-muted-small">75%</span>
                </div>
              </div>
              <Badge variant="secondary" className="text-small">
                {Math.floor(Math.random() * 20) + 1}
              </Badge>
            </Link>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-small">No projects yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateProject}
              className="mt-2"
            >
              <Plus size={12} className="mr-1" />
              <span className="text-small">Create first project</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function TeamsSection({ onCreateTeam }: { onCreateTeam: () => void }) {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch real teams
  React.useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await teamApi.getTeams();
        if (response.success) {
          setTeams(response.data.slice(0, 3)); // Show only first 3
        }
      } catch (error) {
        console.error("Failed to fetch teams:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeams();
  }, []);

  return (
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-label">Teams</h3>
        <Button
          variant="ghost"
          size="sm"
          className="p-1 h-6 w-6"
          onClick={onCreateTeam}
        >
          <Plus size={12} />
        </Button>
      </div>
      <div className="space-y-2">
        {isLoading ? (
          // Skeleton loading
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-2">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </div>
          ))
        ) : teams.length > 0 ? (
          teams.map((team: any) => (
            <Link
              href={"/teams"}
              key={team.id}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-small font-medium">
                  {team.teamName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-medium truncate">{team.teamName}</p>
                <p className="text-muted-small">
                  {team.memberCount || 0} members
                </p>
              </div>
            </Link>
          ))
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-small">No teams yet</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={onCreateTeam}
              className="mt-2"
            >
              <Plus size={12} className="mr-1" />
              <span className="text-small">Create first team</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
