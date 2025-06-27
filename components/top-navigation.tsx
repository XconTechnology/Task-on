"use client";

import { useState } from "react";
import { useUser } from "@/lib/user-context";
import {
  Plus,
  Settings,
  HelpCircle,
  LogOut,
  User,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import GlobalSearch from "./global-search";
import InviteModal from "./modals/invite-modal";
import TaskDetailModal from "./task-detail-modal";
import NotificationDropdown from "./notifications/notification-dropdown";
import { taskApi } from "@/lib/api";
import type { Task } from "@/lib/types";
import Image from "next/image";
import TimerDropdown from "./time-tracking/timer-dropdown";
import Link from "next/link";

export default function TopNavigation() {
  const { user, signOut } = useUser();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  // Handle notification task click
  const handleNotificationTaskClick = async (taskId: string) => {
    try {
      const response = await taskApi.getTask(taskId);
      if (response.success && response.data) {
        setSelectedTask(response.data);
        setIsTaskDetailOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
    }
  };

  // Handle timer task click
  const handleTimerTaskClick = async (taskId: string) => {
    try {
      const response = await taskApi.getTask(taskId);
      if (response.success && response.data) {
        setSelectedTask(response.data);
        setIsTaskDetailOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch task:", error);
    }
  };

  return (
    <>
      <div className="bg-white border-b border-gray-200 px-4 py-2 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left Section */}
          <div className="flex items-center space-x-4 pl-3">
            <Image
              src={"/images/logo-dark.png"}
              width={74}
              height={74}
              alt="Taskon"
            />
          </div>

          {/* Center Section - Search and Timer */}
          <div className="flex-1 flex items-center justify-center space-x-4 max-w-2xl mx-4">
            <div className="flex-1 max-w-md">
              <GlobalSearch onTaskClick={handleTaskClick} />
            </div>
            {/* Active Timer Display */}
            <TimerDropdown onTaskClick={handleTimerTaskClick} />
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
            <Button
              size="sm"
              className="bg-primary hover:bg-green-700 text-white hidden sm:flex"
            >
              <span className="text-xs">Upgrade</span>
            </Button>

            {/* Notifications */}
            <NotificationDropdown onTaskClick={handleNotificationTaskClick} />

            {/* Help */}
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-600 hover:bg-gray-100 hidden sm:flex"
            >
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
                    <AvatarImage
                      src={
                        user?.profilePictureUrl ||
                        "/placeholder.svg?height=32&width=32"
                      }
                    />
                    <AvatarFallback className="bg-purple-100 text-purple-800">
                      {user?.username?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-medium hidden sm:block">
                    {user?.username || "User"}
                  </span>
                  <ChevronDown
                    size={14}
                    className="hidden sm:block text-gray-500"
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white">
                <div className="px-3 py-2 border-b border-gray-200">
                  <p className="text-medium font-semibold text-gray-900">
                    {user?.username || "User"}
                  </p>
                  <p className="text-small text-gray-600">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <Link href={`/profile/${user?.id}`} className="flex">
                  <DropdownMenuItem className="cursor-pointer w-full">
                    <User size={16} className="mr-2 items-center" />
                    <span className="text-medium">My Profile</span>
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings size={16} className="mr-2" />
                  <span className="text-medium">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="cursor-pointer text-red-600 hover:text-red-700"
                >
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

      <TaskDetailModal
        task={selectedTask}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
        onUpdateTask={() => {
          // Just close the modal - no update handling needed
          setIsTaskDetailOpen(false);
          setSelectedTask(null);
        }}
      />
    </>
  );
}
