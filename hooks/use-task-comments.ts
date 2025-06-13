"use client"

import { useState, useEffect } from "react"
import { commentService, type TaskComment } from "@/lib/services/comment-service"

export function useTaskComments(taskId: string, workspaceId: string) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!taskId || !workspaceId) {
      setComments([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setError(null)

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

  const addComment = async (
    text: string,
    userId: string,
    userInfo: { username: string; profilePictureUrl?: string },
  ) => {
    if (!text.trim()) return null

    try {
      return await commentService.addComment(taskId, workspaceId, userId, text, userInfo)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      throw err
    }
  }

  const updateComment = async (commentId: string, text: string) => {
    if (!text.trim()) return

    try {
      await commentService.updateComment(commentId, text)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      throw err
    }
  }

  const deleteComment = async (commentId: string) => {
    try {
      await commentService.deleteComment(commentId)
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)))
      throw err
    }
  }

  return {
    comments,
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
  }
}
