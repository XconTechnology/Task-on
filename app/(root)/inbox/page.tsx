"use client"

import { useEffect, useState } from "react"
import { apiCall } from "@/lib/api_call"
import type { Notification } from "@/lib/types"
import InboxContent from "@/components/InboxContent"

export default function InboxPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [processingInvites, setProcessingInvites] = useState<Set<string>>(new Set())

  // Load notifications
  const loadNotifications = async (unreadOnly = false) => {
    try {
      setIsLoading(true)
      const response = await apiCall(`/notifications?unreadOnly=${unreadOnly}&limit=50`)

      if (response.success && response.data) {
        setNotifications(response.data)
        setUnreadCount(response.unreadCount || 0)
      }
    } catch (error) {
      console.error("Error loading notifications:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Load notifications on mount
  useEffect(() => {
    loadNotifications(activeTab === "unread")
  }, [activeTab])

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

  // Accept workspace invitation
  const acceptWorkspaceInvitation = async (notificationId: string) => {
    if (processingInvites.has(notificationId)) return

    try {
      setProcessingInvites((prev) => new Set(prev).add(notificationId))

      const response = await apiCall(`/notifications/${notificationId}/accept-workspace`, {
        method: "POST",
      })

      if (response.success) {
        // Update notification to show as accepted
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                  data: { ...notification.data, accepted: true },
                }
              : notification,
          ),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))

        // Show success message
        alert(`Successfully joined workspace: ${response.data?.workspace?.name}`)
      } else {
        alert(response.error || "Failed to accept invitation")
      }
    } catch (error) {
      console.error("Error accepting workspace invitation:", error)
      alert("Failed to accept invitation")
    } finally {
      setProcessingInvites((prev) => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }

  // Reject workspace invitation
  const rejectWorkspaceInvitation = async (notificationId: string) => {
    if (processingInvites.has(notificationId)) return

    try {
      setProcessingInvites((prev) => new Set(prev).add(notificationId))

      const response = await apiCall(`/notifications/${notificationId}/reject-workspace`, {
        method: "POST",
      })

      if (response.success) {
        // Update notification to show as rejected
        setNotifications((prev) =>
          prev.map((notification) =>
            notification.id === notificationId
              ? {
                  ...notification,
                  isRead: true,
                  data: { ...notification.data, rejected: true },
                }
              : notification,
          ),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } else {
        alert(response.error || "Failed to reject invitation")
      }
    } catch (error) {
      console.error("Error rejecting workspace invitation:", error)
      alert("Failed to reject invitation")
    } finally {
      setProcessingInvites((prev) => {
        const newSet = new Set(prev)
        newSet.delete(notificationId)
        return newSet
      })
    }
  }


  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      searchTerm === "" ||
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTab = activeTab === "all" || (activeTab === "unread" && !notification.isRead)

    return matchesSearch && matchesTab
  })
 

  return (
     <InboxContent
    filteredNotifications={filteredNotifications}
    unreadCount={unreadCount}
    isLoading={isLoading}
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    activeTab={activeTab}
    setActiveTab={setActiveTab}
    markAllAsRead={markAllAsRead}
    markAsRead={markAsRead}
    acceptWorkspaceInvitation={acceptWorkspaceInvitation}
    rejectWorkspaceInvitation={rejectWorkspaceInvitation}
    processingInvites={processingInvites}
  />
  )
}
