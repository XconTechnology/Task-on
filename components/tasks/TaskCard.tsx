"use client"

import { useDrag } from "react-dnd"
import type { Task } from "@/lib/types"
import { MessageSquareMore } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import TaskActionsDropdown from "./task-actions-dropdown"
import { useRef, useEffect, useState } from "react"
import { useUser } from "@/lib/user-context"
import { commentService } from "@/lib/services/comment-service"

type TaskCardProps = {
  task: Task
  onTaskClick: (task: Task) => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  commentCount?: number
}

const TaskCard = ({
  task,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  commentCount: initialCommentCount,
}: TaskCardProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [commentCount, setCommentCount] = useState(initialCommentCount || 0)
  const [isLoadingComments, setIsLoadingComments] = useState(false)
  const { currentWorkspace } = useUser()

  const [{ isDragging }, drag] = useDrag(() => ({
    type: "task",
    item: { id: task.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }))

  drag(ref) // Connect the drag source to the ref

  // Fetch comment count if not provided and we have workspace
  useEffect(() => {
    if (initialCommentCount === undefined && currentWorkspace?.id) {
      fetchCommentCount()
    }
  }, [task.id, initialCommentCount, currentWorkspace?.id])

  const fetchCommentCount = async () => {
    if (!currentWorkspace?.id) return

    try {
      setIsLoadingComments(true)
      const count = await commentService.getCommentCount(task.id, currentWorkspace.id)
      setCommentCount(count)
    } catch (error) {
      console.error("Failed to fetch comment count:", error)
      setCommentCount(0)
    } finally {
      setIsLoadingComments(false)
    }
  }

  const priorityConfig = {
    Urgent: "bg-red-100 text-red-700 border-red-200",
    High: "bg-orange-100 text-orange-700 border-orange-200",
    Medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Low: "bg-green-100 text-green-700 border-green-200",
    Backlog: "bg-gray-100 text-gray-700 border-gray-200",
  }

  return (
    <Card
      ref={ref}
      onClick={() => onTaskClick(task)}
      className={`task-card transition-all duration-300 ease-in-out hover:shadow-lg bg-white border border-gray-200 cursor-pointer ${
        isDragging
          ? "opacity-60 rotate-3 scale-105 shadow-2xl z-50 transform-gpu"
          : "opacity-100 hover:shadow-md hover:-translate-y-1"
      }`}
      style={{
        transform: isDragging ? "rotate(3deg) scale(1.05)" : "none",
        transition: isDragging ? "none" : "all 0.2s ease-in-out",
      }}
    >
      <CardContent className="p-0">
        <div className="p-4 pt-4">
          {/* Priority and Tags */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              {task.priority && (
                <Badge variant="outline" className={`text-xs ${priorityConfig[task.priority]}`}>
                  {task.priority}
                </Badge>
              )}
            </div>
            <TaskActionsDropdown task={task} onEdit={onEditTask} onDelete={onDeleteTask} size="sm" />
          </div>

          {/* Task Title */}
          <h4 className="text-large font-semibold mb-2 line-clamp-2">{task.title}</h4>

          {/* Task Description */}
          {task.description && <p className="text-description mb-3 line-clamp-2">{task.description}</p>}

          {/* Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center space-x-2">
              {/* Assignee and Author */}
              <div className="flex -space-x-1">
                {task.assignee && (
                  <Avatar className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={"/placeholder.svg"} />
                    <AvatarFallback className="text-small bg-blue-100 text-blue-700">
                      {task.assignee.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
                {task.author && task.author.id !== task.assignee?.id && (
                  <Avatar className="h-6 w-6 border-2 border-white">
                    <AvatarImage src={"/placeholder.svg"} />
                    <AvatarFallback className="text-small bg-gray-100 text-gray-700">
                      {task.author.username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3 text-gray-500">
              {/* Comments */}
              <div className="flex items-center space-x-1">
                <MessageSquareMore size={14} className={isLoadingComments ? "animate-pulse" : ""} />
                <span className="text-small font-medium">{isLoadingComments ? "..." : commentCount}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default TaskCard
