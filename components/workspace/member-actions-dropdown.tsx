"use client"

import type React from "react"
import { useState } from "react"
import { MoreHorizontal, UserCog, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { WorkspaceMember } from "@/lib/types"

type MemberActionsDropdownProps = {
  member: WorkspaceMember
  currentUserRole: string
  currentUserId: string
  onUpdateRole: (member: WorkspaceMember) => void
  onRemoveMember: (member: WorkspaceMember) => void
  size?: "sm" | "default"
}

export default function MemberActionsDropdown({
  member,
  currentUserRole,
  currentUserId,
  onUpdateRole,
  onRemoveMember,
  size = "default",
}: MemberActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Check permissions
  const canManageMember = currentUserRole === "Owner" || (currentUserRole === "Admin" && member.role !== "Owner")
  const isCurrentUser = member.memberId === currentUserId

  const handleUpdateRole = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    onUpdateRole(member)
  }

  const handleRemoveMember = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    onRemoveMember(member)
  }

  // If user can't manage this member or it's the current user, disable the dropdown
  if (!canManageMember || isCurrentUser) {
    return (
      <Button
        variant="ghost"
        size={size === "sm" ? "sm" : "default"}
        className={`${size === "sm" ? "p-1 h-6 w-6" : "p-1 h-8 w-8"} text-gray-300 cursor-not-allowed`}
        disabled
      >
        <MoreHorizontal size={size === "sm" ? 14 : 16} />
      </Button>
    )
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={size === "sm" ? "sm" : "default"}
          className={`${size === "sm" ? "p-1 h-6 w-6" : "p-1 h-8 w-8"} text-gray-400 hover:text-gray-600`}
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal size={size === "sm" ? 14 : 16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem onClick={handleUpdateRole} className="cursor-pointer">
          <UserCog size={14} className="mr-2" />
          <span className="text-medium">Change Role</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleRemoveMember} className="cursor-pointer text-red-600 hover:text-red-700">
          <Trash2 size={14} className="mr-2" />
          <span className="text-medium">Remove from Workspace</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
