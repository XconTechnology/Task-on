"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Clock, CheckCircle, Users, FileText, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { apiCall } from "@/lib/api_call"
import type { Notification, NotificationType } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"

interface NotificationDropdownProps {
  onTaskClick?: (taskId: string) => void
}

export default function NotificationDropdown({ onTaskClick }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load notifications
  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      const response = await apiCall("/notifications?limit=20")

      if (response.success && response.data) {
        setNotifications(response.data as any)
        setUnreadCount(response.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load notifications on mount and when dropdown opens
  useEffect(() => {
    loadNotifications()
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await apiCall(`/notifications/${notificationId}/read`, {
        method: "PATCH",
      })

      if (response.success) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId ? { ...notification, isRead: true } : notification,
          ),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Error marking notification as read:", error)
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      await markAsRead(notification.id)
    }

    // Handle task-related notifications
    if (notification.type === "task_assigned" && notification.data?.taskId && onTaskClick) {
      onTaskClick(notification.data.taskId)
      setIsOpen(false)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const response = await apiCall("/notifications/mark-all-read", {
        method: "PATCH",
      })

      if (response.success) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
    }
  }

  // Get notification icon based on type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case "task_assigned":
        return <FileText size={16} className="text-blue-500" />
      case "team_member_added":
      case "added_to_team":
        return <Users size={16} className="text-green-500" />
      case "workspace_member_joined":
        return <UserPlus size={16} className="text-purple-500" />
      case "task_status_changed":
        return <CheckCircle size={16} className="text-orange-500" />
      default:
        return <Bell size={16} className="text-gray-500" />
    }
  }

  // Format notification time
  const formatNotificationTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { addSuffix: true })
    } catch {
      return "Recently"
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Notification Bell Button */}
      <Button
        variant="ghost"
        size="sm"
        className="text-gray-600 hover:bg-gray-100 relative"
        onClick={() => {
          setIsOpen(!isOpen)
          if (!isOpen) {
            loadNotifications() // Refresh when opening
          }
        }}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 min-w-[16px] h-4">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-base font-semibold text-gray-900">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="xs"
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-700 text-xs"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications List */}
          <ScrollArea className="max-h-96">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8">
                <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.isRead ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-medium font-medium text-gray-900 truncate">{notification.title}</p>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2"></div>
                          )}
                        </div>
                        <p className="text-medium text-gray-600 mt-1 line-clamp-2">{notification.message}</p>

                        {/* Additional info for task notifications */}
                        {notification.type === "task_assigned" && notification.data?.projectName && (
                          <div className="flex items-center mt-2 text-xs text-gray-500">
                            <FileText size={12} className="mr-1" />
                            <span>Project: {notification.data.projectName}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock size={10} className="mr-1" />
                            <span>{formatNotificationTime(notification.createdAt)}</span>
                          </div>

                          {/* Assigned by info */}
                          {notification.data?.assignedByName && (
                            <div className="flex items-center text-xs text-gray-500">
                              <Avatar className="h-4 w-4 mr-1">
                                <AvatarFallback className="text-xs">
                                  {notification.data.assignedByName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>by {notification.data.assignedByName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 text-center">
              <Button
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-700 text-sm"
                onClick={() => {
                  setIsOpen(false)
                  // Navigate to full inbox page if you have one
                  window.location.href = "/inbox"
                }}
              >
                View all notifications
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
