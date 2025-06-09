"use client"

import { MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface TeamChatButtonProps {
  teamId: string
  teamName: string
}

export default function TeamChatButton({ teamId, teamName }: TeamChatButtonProps) {
  const router = useRouter()

  const handleOpenChat = () => {
    router.push(`/chat/${teamId}`)
  }

  return (
    <Button variant="outline" size="sm" onClick={handleOpenChat} className="flex items-center space-x-2">
      <MessageCircle size={14} />
      <span>Chat</span>
    </Button>
  )
}
