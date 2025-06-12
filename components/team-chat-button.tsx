"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { chatService } from "@/lib/services/chat-service"

interface TeamChatButtonProps {
  teamId: string
  teamName: string
}

export default function TeamChatButton({ teamId, teamName }: TeamChatButtonProps) {
  const router = useRouter()

  const handleOpenChat = () => {
    router.push(`/chat/${teamId}`)
  }

  // Pre-warm chat when user hovers over button
  const handleMouseEnter = () => {
    chatService.preWarmChat(teamId).catch(console.error)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleOpenChat}
      onMouseEnter={handleMouseEnter}
      className="flex items-center space-x-2"
    >
      <MessageCircle size={14} />
      <span>Chat</span>
    </Button>
  )
}
