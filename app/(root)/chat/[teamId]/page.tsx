"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Send, ArrowLeft, MoreVertical, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@/lib/user-context"
import { chatService } from "@/lib/services/chat-service"
import type { ChatMessage, ChatUser } from "@/lib/types"
import { apiCall } from "@/lib/api_call"
import ChatSidebar from "@/components/chat/chat-sidebar"
import EmojiPicker from "@/components/chat/emoji-picker"
import { chatAPi } from "@/lib/api"

interface TeamData {
  id: string
  teamName: string
  description: string
  workspaceId: string
  members: string[]
}

interface UserData {
  id: string
  username: string
  email: string
  profilePictureUrl?: string
}

export default function TeamChatPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useUser()
  const teamId = params.teamId as string

  // State
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [teamData, setTeamData] = useState<TeamData>()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [teamMembers, setTeamMembers] = useState<UserData[]>([])
  const [onlineUsers, setOnlineUsers] = useState<ChatUser[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const unsubscribeRef = useRef<(() => void) | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Validate access and load initial data
  useEffect(() => {
    if (!teamId || !user) return

    // Pre-warm chat service before validation
    chatService.preWarmChat(teamId).catch(console.error)

    const validateAccess = async () => {
      try {
        setIsLoading(true)
        setError(null)

             const response = await chatAPi.getAcess(teamId)
       

        if (response.success && response.data) {
          setTeamData(response.data.team as TeamData)
          setUserData(response.data.user)
          setTeamMembers(response.data.teamMembers)

          // Set user online
          await chatService.setUserOnline(response.data.user.id, {
            username: response.data.user.username,
            email: response.data.user.email,
            profilePictureUrl: response.data.user.profilePictureUrl,
          })

          // Create/update chat room
          await chatService.createOrUpdateChatRoom({
            teamId: response.data.team.id,
            teamName: response.data.team.teamName,
            workspaceId: response.data.team.workspaceId,
            members: response.data.team.members,
          })

          try {
            // Load initial messages
            const initialMessages = await chatService.getTeamMessages(teamId, 50)
            setMessages(initialMessages)

            // Subscribe to real-time messages
            const unsubscribe = chatService.subscribeToTeamMessages(
              teamId,
              (newMessages) => {
                setMessages(newMessages)
                setTimeout(scrollToBottom, 100)
              },
              50,
            )
            unsubscribeRef.current = unsubscribe
          } catch (messageError) {
            console.error("Error loading messages:", messageError)
            // Don't fail the entire chat loading if messages fail
            // Just show an empty message list
            setMessages([])
          }

          // Load online users
          try {
            const online = await chatService.getOnlineUsers(response.data.team.members)
            setOnlineUsers(online)
          } catch (onlineError) {
            console.error("Error loading online users:", onlineError)
            // Don't fail if online users can't be loaded
            setOnlineUsers([])
          }
        } else {
          setError(response.error || "Access denied")
        }
      } catch (err) {
        console.error("Error validating chat access:", err)
        setError("Failed to load chat. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    validateAccess()

    // Cleanup on unmount
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
      if (userData) {
        chatService.setUserOffline(userData.id)
      }
    }
  }, [teamId, user])

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.trim() || isSending || !teamData || !userData) return

    const messageText = newMessage.trim()
    setNewMessage("") // Clear input immediately for better UX
    setIsSending(true)

    try {
      await apiCall(`/chat/teams/${teamId}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: messageText }),
      })
    } catch (error) {
      console.error("Error sending message:", error)
      setError("Failed to send message")
      setNewMessage(messageText) // Restore message on error
    } finally {
      setIsSending(false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    const input = inputRef.current
    if (input) {
      const start = input.selectionStart || 0
      const end = input.selectionEnd || 0
      const newValue = newMessage.slice(0, start) + emoji + newMessage.slice(end)
      setNewMessage(newValue)

      // Set cursor position after emoji
      setTimeout(() => {
        input.focus()
        input.setSelectionRange(start + emoji.length, start + emoji.length)
      }, 0)
    } else {
      setNewMessage((prev) => prev + emoji)
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString([], { weekday: "short", hour: "2-digit", minute: "2-digit" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
    }
  }

  // Group messages by date
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: { [key: string]: ChatMessage[] } = {}

    messages.forEach((message) => {
      const date = new Date(message.timestamp).toDateString()
      if (!groups[date]) {
        groups[date] = []
      }
      groups[date].push(message)
    })

    return groups
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="text-red-600 text-lg font-medium">{error}</div>
        <Button onClick={() => router.push("/teams")} variant="outline">
          <ArrowLeft size={16} className="mr-2" />
          Back to Teams
        </Button>
      </div>
    )
  }

  if (!teamData || !userData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading chat...</div>
      </div>
    )
  }

  const messageGroups = groupMessagesByDate(messages)

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 min-w-0">
              <Button variant="ghost" size="sm" onClick={() => router.push("/teams")} className="p-2 flex-shrink-0">
                <ArrowLeft size={16} />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg font-semibold text-gray-900 truncate">{teamData.teamName}</h1>
                <p className="text-xs text-gray-500">
                  {teamMembers.length} member{teamMembers.length !== 1 ? "s" : ""}
                  {onlineUsers.filter((u) => u.isOnline).length > 0 && (
                    <span className="ml-2">• {onlineUsers.filter((u) => u.isOnline).length} online</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2"
                title={isSidebarOpen ? "Hide members" : "Show members"}
              >
                <Users size={16} />
              </Button>
              <Button variant="ghost" size="sm" className="p-2">
                <MoreVertical size={16} />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-4">
            {Object.entries(messageGroups).map(([date, dayMessages]) => (
              <div key={date}>
                {/* Date separator */}
                <div className="flex items-center justify-center my-4">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {new Date(date).toLocaleDateString([], {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                </div>

                {/* Messages for this date */}
                {dayMessages.map((message, index) => {
                  const isOwnMessage = message.userId === userData.id
                  const showAvatar = index === 0 || dayMessages[index - 1].userId !== message.userId

                  return (
                    <div key={message.id} className={`flex items-start space-x-3 ${isOwnMessage ? "justify-end" : ""}`}>
                      {!isOwnMessage && (
                        <div className="flex-shrink-0">
                          {showAvatar ? (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={message.profilePictureUrl || "/placeholder.svg"} />
                              <AvatarFallback>{message.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                          ) : (
                            <div className="h-8 w-8" />
                          )}
                        </div>
                      )}

                      <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? "order-first" : ""}`}>
                        {showAvatar && !isOwnMessage && (
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900">{message.username}</span>
                            <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                          </div>
                        )}

                        <div
                          className={`rounded-lg px-3 py-2 ${
                            isOwnMessage ? "bg-blue-600 text-white" : "bg-white border border-gray-200 text-gray-900"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">{message.message}</p>
                          {message.edited && <p className="text-xs opacity-70 mt-1">(edited)</p>}
                        </div>

                        {isOwnMessage && showAvatar && (
                          <div className="text-right mt-1">
                            <span className="text-xs text-gray-500">{formatTimestamp(message.timestamp)}</span>
                          </div>
                        )}
                      </div>

                      {isOwnMessage && (
                        <div className="flex-shrink-0">
                            <div className="h-8 w-8 py-5" />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
          <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${teamData.teamName}...`}
                className="pr-12"
                disabled={isSending}
                maxLength={1000}
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <EmojiPicker onEmojiSelect={handleEmojiSelect} />
              </div>
            </div>
            <Button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </form>
        </div>
      </div>

      {/* Right Sidebar */}
      {teamData && userData && (
        <ChatSidebar
          teamData={teamData}
          userData={userData}
          teamMembers={teamMembers}
          onlineUsers={onlineUsers}
          isOpen={isSidebarOpen}
          onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />
      )}
    </div>
  )
}
