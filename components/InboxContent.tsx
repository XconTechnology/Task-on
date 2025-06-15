"use client"

import { Bell, Check, CheckCheck, Search, UserPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatTimeAgo } from "@/lib/utils"
import { getNotificationColor, getNotificationIcon } from "@/lib/constants"
import type { Notification } from "@/lib/types"
import React from "react"

type Props = {
  filteredNotifications: Notification[]
  unreadCount: number
  isLoading: boolean
  searchTerm: string
  setSearchTerm: (value: string) => void
  activeTab: string
  setActiveTab: (value: string) => void
  markAllAsRead: () => void
  markAsRead: (id: string) => void
  acceptWorkspaceInvitation: (id: string) => void
  rejectWorkspaceInvitation: (id: string) => void
  processingInvites: Set<string>
}

const  InboxContent =({
  filteredNotifications,
  unreadCount,
  isLoading,
  searchTerm,
  setSearchTerm,
  activeTab,
  setActiveTab,
  markAllAsRead,
  markAsRead,
  acceptWorkspaceInvitation,
  rejectWorkspaceInvitation,
  processingInvites,
}: Props) => {
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell size={20} className="text-gray-700" />
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
              <p className="text-xs text-gray-500">
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                  : "All caught up!"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {unreadCount > 0 && (
              <Button onClick={markAllAsRead} variant="outline" size="sm">
                <CheckCheck size={16} className="mr-2" />
                Mark all read
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex-shrink-0">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6 flex-shrink-0">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread" className="relative">
              Unread
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500 text-white text-xs px-1 min-w-[16px] h-4">{unreadCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Notifications List */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm
                  ? "No matching notifications"
                  : activeTab === "unread"
                    ? "No unread notifications"
                    : "No notifications yet"}
              </h3>
              <p className="text-gray-500">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : activeTab === "unread"
                    ? "You're all caught up!"
                    : "You'll see notifications here when you get assigned tasks, join teams, or other important updates happen."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg border p-4 hover:shadow-md transition-shadow ${
                    !notification.isRead ? "border-l-4 border-l-blue-500" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4
                          className={`text-sm font-medium ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}
                        >
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <Badge className={`text-xs ${getNotificationColor(notification.type)}`}>
                            {notification.type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Badge>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                      </div>
                      <p className={`text-sm ${!notification.isRead ? "text-gray-800" : "text-gray-600"} mb-2`}>
                        {notification.message}
                      </p>

                      {/* Workspace Invitation Actions */}
                      {notification.type === "workspace_invitation" &&
                        !notification.data?.accepted &&
                        !notification.data?.rejected && (
                          <div className="flex items-center space-x-2 mb-2">
                            <Button
                              size="sm"
                              onClick={() => acceptWorkspaceInvitation(notification.id)}
                              disabled={processingInvites.has(notification.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              {processingInvites.has(notification.id) ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1" />
                              ) : (
                                <UserPlus size={14} className="mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => rejectWorkspaceInvitation(notification.id)}
                              disabled={processingInvites.has(notification.id)}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X size={14} className="mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}

                      {/* Status indicators for processed invitations */}
                      {notification.data?.accepted && (
                        <div className="mb-2">
                          <Badge className="bg-green-100 text-green-800 text-xs">✓ Accepted</Badge>
                        </div>
                      )}
                      {notification.data?.rejected && (
                        <div className="mb-2">
                          <Badge className="bg-red-100 text-red-800 text-xs">✗ Declined</Badge>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{formatTimeAgo(notification.createdAt)}</span>
                        {!notification.isRead && notification.type !== "workspace_invitation" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                          >
                            <Check size={14} />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default InboxContent