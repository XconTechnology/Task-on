"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send, Trash2, Edit, MoreVertical, Clock } from "lucide-react"
import { format } from "date-fns"
import { commentService, type TaskComment } from "@/lib/services/comment-service"
import { useUser } from "@/lib/user-context"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

interface TaskCommentsProps {
  taskId: string
  workspaceId: string
}

export default function TaskComments({ taskId, workspaceId }: TaskCommentsProps) {
  const { user } = useUser()
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const commentInputRef = useRef<HTMLTextAreaElement>(null)
  const editInputRef = useRef<HTMLTextAreaElement>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!taskId || !workspaceId) return

    setIsLoading(true)

    // Subscribe to real-time updates
    const unsubscribe = commentService.subscribeToTaskComments(taskId, workspaceId, (updatedComments) => {
      setComments(updatedComments)
      setIsLoading(false)
    })

    // Cleanup subscription on unmount
    return () => {
      unsubscribe()
    }
  }, [taskId, workspaceId])

  // Scroll to bottom when new comments are added
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }, [comments])

  // Focus the edit input when editing starts
  useEffect(() => {
    if (editingCommentId && editInputRef.current) {
      editInputRef.current.focus()
    }
  }, [editingCommentId])

  const handleSubmitComment = async () => {
    if (!user || !newComment.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)

      await commentService.addComment(taskId, workspaceId, user.id, newComment.trim(), {
        username: user.username || "Unknown User",
        profilePictureUrl: user.profilePictureUrl,
      })

      setNewComment("")
      // No need to manually update comments as the subscription will handle it
    } catch (error) {
      console.error("Error submitting comment:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditComment = (comment: TaskComment) => {
    setEditingCommentId(comment.id)
    setEditText(comment.text)
  }

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return

    try {
      await commentService.updateComment(commentId, editText.trim())
      setEditingCommentId(null)
      setEditText("")
    } catch (error) {
      console.error("Error updating comment:", error)
    }
  }

    const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return "Just now"
    
    const date = new Date(timestamp.seconds * 1000)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`
    
    return format(date, "MMM dd, yyyy")
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return

    try {
      await commentService.deleteComment(commentId)
      // No need to manually update comments as the subscription will handle it
    } catch (error) {
      console.error("Error deleting comment:", error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      action()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Comments List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {isLoading ? (
          // Skeleton loading state
          Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex space-x-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-16 w-full" />
              </div>
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="flex space-x-3 group ">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={comment.user?.profilePictureUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-small">
                  {comment.user?.username?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-medium font-medium">{comment.user?.username || "Unknown"}</span>
                    <span className="text-muted-small">
                      {comment.createdAt && (
                         <div className="flex items-center space-x-1 text-gray-500">
                          <Clock size={12} />
                          <span className="text-xs">
                            {formatTimeAgo(comment.createdAt)}
                          </span>
                        </div>
                      )}
                    </span>
                  </div>

                  {user?.id === comment.userId && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditComment(comment)}>
                            <Edit size={14} className="mr-2" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 size={14} className="mr-2" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {editingCommentId === comment.id ? (
                  <div className="space-y-2">
                    <Textarea
                      ref={editInputRef}
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyDown={(e) => handleKeyDown(e, () => handleSaveEdit(comment.id))}
                      rows={2}
                      className="w-full resize-none"
                    />
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleSaveEdit(comment.id)}
                        disabled={!editText.trim()}
                      >
                        <span className="text-small text-white">Save</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingCommentId(null)
                          setEditText("")
                        }}
                      >
                        <span className="text-small">Cancel</span>
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-medium text-gray-700 whitespace-pre-wrap">{comment.text}</p>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={commentsEndRef} />
      </div>

      {/* Add Comment - Fixed at the bottom */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="relative flex items-center">
          <Textarea
            ref={commentInputRef}
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, handleSubmitComment)}
            rows={1}
            className="w-full resize-none pl-4 pr-12 py-2 min-h-[40px] max-h-[120px] overflow-auto"
            disabled={isSubmitting}
          />
          <Button
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700 h-8 w-8 p-0 rounded-full"
            onClick={handleSubmitComment}
            disabled={!newComment.trim() || isSubmitting}
          >
            {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={14} />}
            <span className="sr-only">Send</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
