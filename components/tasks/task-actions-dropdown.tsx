"use client"

import type React from "react"

import { useState } from "react"
import { MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Task } from "@/lib/types"

type TaskActionsDropdownProps = {
  task: Task
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  size?: "sm" | "default"
}

export default function TaskActionsDropdown({ task, onEdit, onDelete, size = "default" }: TaskActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    onEdit(task)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsOpen(false)
    onDelete(task)
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
      <DropdownMenuContent align="end" className="w-40">
        <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
          <Edit size={14} className="mr-2" />
          <span className="text-medium">Edit Task</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-red-600 hover:text-red-700">
          <Trash2 size={14} className="mr-2" />
          <span className="text-medium">Delete Task</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
