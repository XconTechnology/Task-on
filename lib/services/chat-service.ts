import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  getDocs,
  getDoc,
  setDoc,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { ChatMessage, TeamChatRoom, ChatUser } from "@/lib/types"

export class ChatService {
  // Collections
  private readonly MESSAGES_COLLECTION = "messages"
  private readonly CHAT_ROOMS_COLLECTION = "chatRooms"
  private readonly ONLINE_USERS_COLLECTION = "onlineUsers"

  /**
   * Create or update a team chat room
   */
  async createOrUpdateChatRoom(teamData: {
    teamId: string
    teamName: string
    workspaceId: string
    members: string[]
  }): Promise<void> {
    try {
      const chatRoomRef = doc(db, this.CHAT_ROOMS_COLLECTION, teamData.teamId)

      const chatRoom: TeamChatRoom = {
        id: teamData.teamId,
        teamId: teamData.teamId,
        teamName: teamData.teamName,
        workspaceId: teamData.workspaceId,
        members: teamData.members,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(chatRoomRef, chatRoom, { merge: true })
    } catch (error) {
      console.error("Error creating/updating chat room:", error)
      throw new Error("Failed to create chat room")
    }
  }

  /**
   * Send a message to a team chat
   */
  async sendMessage(messageData: {
    teamId: string
    userId: string
    username: string
    userEmail: string
    profilePictureUrl?: string
    message: string
  }): Promise<string> {
    try {
      // Validate message
      if (!messageData.message.trim()) {
        throw new Error("Message cannot be empty")
      }

      if (messageData.message.length > 1000) {
        throw new Error("Message too long (max 1000 characters)")
      }

      const messagesRef = collection(db, this.MESSAGES_COLLECTION)
      const timestamp = Date.now()

      const message: Omit<ChatMessage, "id"> = {
        teamId: messageData.teamId,
        userId: messageData.userId,
        username: messageData.username,
        userEmail: messageData.userEmail,
        profilePictureUrl: messageData.profilePictureUrl,
        message: messageData.message.trim(),
        timestamp,
        createdAt: new Date().toISOString(),
      }

      const docRef = await addDoc(messagesRef, message)

      // Update last message in chat room
      await this.updateLastMessage(messageData.teamId, {
        message: messageData.message.trim(),
        timestamp,
        userId: messageData.userId,
        username: messageData.username,
      })

      return docRef.id
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  /**
   * Get messages for a team (with pagination)
   */
  async getTeamMessages(teamId: string, limitCount = 50, beforeTimestamp?: number): Promise<ChatMessage[]> {
    try {
      let q

      // Try a simpler query first that doesn't require complex indexing
      if (beforeTimestamp) {
        q = query(
          collection(db, this.MESSAGES_COLLECTION),
          where("teamId", "==", teamId),
          where("timestamp", "<", beforeTimestamp),
          orderBy("timestamp", "desc"),
          limit(limitCount),
        )
      } else {
        q = query(
          collection(db, this.MESSAGES_COLLECTION),
          where("teamId", "==", teamId),
          orderBy("timestamp", "desc"),
          limit(limitCount),
        )
      }

      try {
        const querySnapshot = await getDocs(q)
        const messages: ChatMessage[] = []

        querySnapshot.forEach((doc) => {
          messages.push({
            id: doc.id,
            ...doc.data(),
          } as ChatMessage)
        })

        // Return in chronological order (oldest first)
        return messages.reverse()
      } catch (indexError) {
        // If we get an index error, try a simpler query without ordering
        console.warn("Index error in getTeamMessages, falling back to simpler query:", indexError)

        const fallbackQuery = query(
          collection(db, this.MESSAGES_COLLECTION),
          where("teamId", "==", teamId),
          limit(limitCount),
        )

        const fallbackSnapshot = await getDocs(fallbackQuery)
        const fallbackMessages: ChatMessage[] = []

        fallbackSnapshot.forEach((doc) => {
          fallbackMessages.push({
            id: doc.id,
            ...doc.data(),
          } as ChatMessage)
        })

        // Sort manually in memory
        return fallbackMessages.sort((a, b) => a.timestamp - b.timestamp)
      }
    } catch (error) {
      console.error("Error getting team messages:", error)
      throw new Error("Failed to load messages")
    }
  }

  /**
   * Subscribe to real-time messages for a team
   */
  subscribeToTeamMessages(teamId: string, callback: (messages: ChatMessage[]) => void, limitCount = 50): () => void {
    try {
      const q = query(
        collection(db, this.MESSAGES_COLLECTION),
        where("teamId", "==", teamId),
        orderBy("timestamp", "desc"),
        limit(limitCount),
      )

      return onSnapshot(
        q,
        (querySnapshot) => {
          const messages: ChatMessage[] = []

          querySnapshot.forEach((doc) => {
            messages.push({
              id: doc.id,
              ...doc.data(),
            } as ChatMessage)
          })

          // Return in chronological order (oldest first)
          callback(messages.reverse())
        },
        (error) => {
          console.error("Error in message subscription:", error)

          // If we get an index error, try a simpler query without ordering
          if (error.code === "failed-precondition" || error.message.includes("requires an index")) {
            console.warn("Index error in subscribeToTeamMessages, falling back to simpler query")

            const fallbackQuery = query(
              collection(db, this.MESSAGES_COLLECTION),
              where("teamId", "==", teamId),
              limit(limitCount),
            )

            return onSnapshot(
              fallbackQuery,
              (fallbackSnapshot) => {
                const fallbackMessages: ChatMessage[] = []

                fallbackSnapshot.forEach((doc) => {
                  fallbackMessages.push({
                    id: doc.id,
                    ...doc.data(),
                  } as ChatMessage)
                })

                // Sort manually in memory
                callback(fallbackMessages.sort((a, b) => a.timestamp - b.timestamp))
              },
              (fallbackError) => {
                console.error("Error in fallback message subscription:", fallbackError)
              },
            )
          }
        },
      )
    } catch (error) {
      console.error("Error setting up message subscription:", error)
      return () => {}
    }
  }

  /**
   * Update last message in chat room
   */
  private async updateLastMessage(
    teamId: string,
    lastMessage: {
      message: string
      timestamp: number
      userId: string
      username: string
    },
  ): Promise<void> {
    try {
      const chatRoomRef = doc(db, this.CHAT_ROOMS_COLLECTION, teamId)
      await updateDoc(chatRoomRef, {
        lastMessage,
        updatedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error updating last message:", error)
      // Don't throw here as it's not critical
    }
  }

  /**
   * Get chat room info
   */
  async getChatRoom(teamId: string): Promise<TeamChatRoom | null> {
    try {
      const chatRoomRef = doc(db, this.CHAT_ROOMS_COLLECTION, teamId)
      const docSnap = await getDoc(chatRoomRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as TeamChatRoom
      }

      return null
    } catch (error) {
      console.error("Error getting chat room:", error)
      throw new Error("Failed to load chat room")
    }
  }

  /**
   * Set user online status
   */
  async setUserOnline(
    userId: string,
    userData: {
      username: string
      email: string
      profilePictureUrl?: string
    },
  ): Promise<void> {
    try {
      const userRef = doc(db, this.ONLINE_USERS_COLLECTION, userId)
      const chatUser: ChatUser = {
        id: userId,
        username: userData.username,
        email: userData.email,
        profilePictureUrl: userData.profilePictureUrl,
        isOnline: true,
        lastSeen: Date.now(),
      }

      await setDoc(userRef, chatUser)
    } catch (error) {
      console.error("Error setting user online:", error)
    }
  }

  /**
   * Set user offline
   */
  async setUserOffline(userId: string): Promise<void> {
    try {
      const userRef = doc(db, this.ONLINE_USERS_COLLECTION, userId)
      await updateDoc(userRef, {
        isOnline: false,
        lastSeen: Date.now(),
      })
    } catch (error) {
      console.error("Error setting user offline:", error)
    }
  }

  /**
   * Get online users for a team
   */
  async getOnlineUsers(userIds: string[]): Promise<ChatUser[]> {
    try {
      if (userIds.length === 0) return []

      const users: ChatUser[] = []

      // Firestore 'in' queries are limited to 10 items, so we batch them
      const batches = []
      for (let i = 0; i < userIds.length; i += 10) {
        batches.push(userIds.slice(i, i + 10))
      }

      for (const batch of batches) {
        const q = query(collection(db, this.ONLINE_USERS_COLLECTION), where("id", "in", batch))

        const querySnapshot = await getDocs(q)
        querySnapshot.forEach((doc) => {
          users.push({ id: doc.id, ...doc.data() } as ChatUser)
        })
      }

      return users
    } catch (error) {
      console.error("Error getting online users:", error)
      return []
    }
  }

  /**
   * Delete a message (only by sender)
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId)
      const messageDoc = await getDoc(messageRef)

      if (!messageDoc.exists()) {
        throw new Error("Message not found")
      }

      const messageData = messageDoc.data() as ChatMessage
      if (messageData.userId !== userId) {
        throw new Error("You can only delete your own messages")
      }

      await deleteDoc(messageRef)
    } catch (error) {
      console.error("Error deleting message:", error)
      throw error
    }
  }

  /**
   * Edit a message (only by sender)
   */
  async editMessage(messageId: string, userId: string, newMessage: string): Promise<void> {
    try {
      if (!newMessage.trim()) {
        throw new Error("Message cannot be empty")
      }

      if (newMessage.length > 1000) {
        throw new Error("Message too long (max 1000 characters)")
      }

      const messageRef = doc(db, this.MESSAGES_COLLECTION, messageId)
      const messageDoc = await getDoc(messageRef)

      if (!messageDoc.exists()) {
        throw new Error("Message not found")
      }

      const messageData = messageDoc.data() as ChatMessage
      if (messageData.userId !== userId) {
        throw new Error("You can only edit your own messages")
      }

      await updateDoc(messageRef, {
        message: newMessage.trim(),
        edited: true,
        editedAt: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error editing message:", error)
      throw error
    }
  }
}

// Export singleton instance
export const chatService = new ChatService()
