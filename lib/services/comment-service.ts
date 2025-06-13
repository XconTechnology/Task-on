import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDoc,
  getDocs,
  limit,
  type Timestamp,
} from "firebase/firestore"
import { db, firebaseConnectionManager } from "@/lib/firebase"

export interface TaskComment {
  id: string
  taskId: string
  workspaceId: string
  userId: string // This will store the user's id
  text: string
  createdAt: Timestamp
  updatedAt: Timestamp
  user?: {
    id: string
    username: string
    profilePictureUrl?: string
  }
}

export const commentService = {
  /**
   * Add a new comment to a task
   */
  async addComment(
    taskId: string,
    workspaceId: string,
    userId: string,
    text: string,
    userInfo: { username: string; profilePictureUrl?: string },
  ): Promise<TaskComment | null> {
    try {
      await firebaseConnectionManager.ensureConnection()

      const commentData = {
        taskId,
        workspaceId,
        userId, // This is the user's id
        text,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        user: {
          id: userId,
          username: userInfo.username,
          profilePictureUrl: userInfo.profilePictureUrl || null,
        },
      }

      const docRef = await addDoc(collection(db, "taskComments"), commentData)
      const docSnap = await getDoc(docRef)

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as unknown as TaskComment
      }

      return null
    } catch (error) {
      console.error("Error adding comment:", error)
      throw error
    }
  },

  /**
   * Update an existing comment
   */
  async updateComment(commentId: string, text: string): Promise<void> {
    try {
      await firebaseConnectionManager.ensureConnection()

      const commentRef = doc(db, "taskComments", commentId)
      await updateDoc(commentRef, {
        text,
        updatedAt: serverTimestamp(),
      })
    } catch (error) {
      console.error("Error updating comment:", error)
      throw error
    }
  },

  /**
   * Delete a comment
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      await firebaseConnectionManager.ensureConnection()

      const commentRef = doc(db, "taskComments", commentId)
      await deleteDoc(commentRef)
    } catch (error) {
      console.error("Error deleting comment:", error)
      throw error
    }
  },

  /**
   * Get comments for a specific task with real-time updates
   */
  subscribeToTaskComments(
    taskId: string,
    workspaceId: string,
    callback: (comments: TaskComment[]) => void,
  ): () => void {
    firebaseConnectionManager.ensureConnection().catch(console.error)

    const q = query(
      collection(db, "taskComments"),
      where("taskId", "==", taskId),
      where("workspaceId", "==", workspaceId),
      orderBy("createdAt", "desc"),
    )

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const comments: TaskComment[] = []
        querySnapshot.forEach((doc) => {
          const data = doc.data()
          comments.push({
            id: doc.id,
            ...data,
          } as unknown as TaskComment)
        })
        callback(comments)
      },
      (error) => {
        console.error("Error getting comments:", error)
      },
    )

    return unsubscribe
  },

  /**
   * Get the latest comments for a task (non-realtime)
   */
  async getTaskComments(taskId: string, workspaceId: string, limitCount = 50): Promise<TaskComment[]> {
    try {
      await firebaseConnectionManager.ensureConnection()

      const q = query(
        collection(db, "taskComments"),
        where("taskId", "==", taskId),
        where("workspaceId", "==", workspaceId),
        orderBy("createdAt", "desc"),
        limit(limitCount),
      )

      const querySnapshot = await getDocs(q)
      const comments: TaskComment[] = []

      querySnapshot.forEach((doc) => {
        comments.push({
          id: doc.id,
          ...doc.data(),
        } as unknown as TaskComment)
      })

      return comments
    } catch (error) {
      console.error("Error getting comments:", error)
      return []
    }
  },

  /**
   * Get comment count for a task
   */
  async getCommentCount(taskId: string, workspaceId: string): Promise<number> {
    try {
      await firebaseConnectionManager.ensureConnection()

      const q = query(
        collection(db, "taskComments"),
        where("taskId", "==", taskId),
        where("workspaceId", "==", workspaceId),
      )

      const querySnapshot = await getDocs(q)
      return querySnapshot.size
    } catch (error) {
      console.error("Error getting comment count:", error)
      return 0
    }
  },
}
