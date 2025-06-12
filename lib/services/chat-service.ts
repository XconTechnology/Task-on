import {
  collection,
  doc,
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
  writeBatch,
} from "firebase/firestore"
import { db, firebaseConnectionManager } from "@/lib/firebase"
import type { ChatMessage, TeamChatRoom, ChatUser } from "@/lib/types"

export class ChatService {
  // Collections
  private readonly MESSAGES_COLLECTION = "messages"
  private readonly CHAT_ROOMS_COLLECTION = "chatRooms"
  private readonly ONLINE_USERS_COLLECTION = "onlineUsers"

  // Enhanced caching and connection management
  private messageCache = new Map<string, ChatMessage[]>()
  private cacheExpiry = new Map<string, number>()
  private chatRoomCache = new Map<string, TeamChatRoom>()
  private pendingMessages = new Map<string, any>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  // Connection state
  private isInitialized = false
  private initializationPromise: Promise<void> | null = null

  /**
   * Initialize chat service with pre-warmed connections
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve()
    }

    if (this.initializationPromise) {
      return this.initializationPromise
    }

    this.initializationPromise = this.performInitialization()
    return this.initializationPromise
  }

  private async performInitialization(): Promise<void> {
    try {
      // Ensure Firebase connection is active
      await firebaseConnectionManager.ensureConnection()

      // Pre-warm Firestore collections by making a lightweight query
      const warmupPromises = [
        this.warmupCollection(this.MESSAGES_COLLECTION),
        this.warmupCollection(this.CHAT_ROOMS_COLLECTION),
        this.warmupCollection(this.ONLINE_USERS_COLLECTION),
      ]

      await Promise.all(warmupPromises)

      this.isInitialized = true
      this.initializationPromise = null
      console.log("Chat service initialized successfully")
    } catch (error) {
      console.error("Chat service initialization failed:", error)
      this.isInitialized = false
      this.initializationPromise = null
      throw error
    }
  }

  private async warmupCollection(collectionName: string): Promise<void> {
    try {
      // Make a minimal query to warm up the connection
      const q = query(collection(db, collectionName), limit(1))
      await getDocs(q)
    } catch (error) {
      console.warn(`Failed to warm up collection ${collectionName}:`, error)
      // Don't throw - this is just optimization
    }
  }

  /**
   * Create or update a team chat room with optimizations
   */
  async createOrUpdateChatRoom(teamData: {
    teamId: string
    teamName: string
    workspaceId: string
    members: string[]
  }): Promise<void> {
    try {
      await this.initialize()

      // Check cache first
      const cached = this.chatRoomCache.get(teamData.teamId)
      if (
        cached &&
        cached.teamName === teamData.teamName &&
        JSON.stringify(cached.members) === JSON.stringify(teamData.members)
      ) {
        return // No changes needed
      }

      const chatRoomRef = doc(db, this.CHAT_ROOMS_COLLECTION, teamData.teamId)

      const chatRoom: TeamChatRoom = {
        id: teamData.teamId,
        teamId: teamData.teamId,
        teamName: teamData.teamName,
        workspaceId: teamData.workspaceId,
        members: teamData.members,
        createdAt: cached?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await setDoc(chatRoomRef, chatRoom, { merge: true })

      // Update cache
      this.chatRoomCache.set(teamData.teamId, chatRoom)
    } catch (error) {
      console.error("Error creating/updating chat room:", error)
      throw new Error("Failed to create chat room")
    }
  }

  /**
   * Send a message with optimized performance and queuing
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

      // Ensure service is initialized
      await this.initialize()

      const timestamp = Date.now()
      const tempId = `temp_${timestamp}_${Math.random()}`

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

      // Add to pending messages for immediate UI update
      this.pendingMessages.set(tempId, { ...message, id: tempId, isPending: true })

      try {
        // Use batch write for better performance
        const batch = writeBatch(db)

        // Add message
        const messagesRef = collection(db, this.MESSAGES_COLLECTION)
        const messageDocRef = doc(messagesRef)
        batch.set(messageDocRef, message)

        // Update last message in chat room
        const chatRoomRef = doc(db, this.CHAT_ROOMS_COLLECTION, messageData.teamId)
        batch.update(chatRoomRef, {
          lastMessage: {
            message: messageData.message.trim(),
            timestamp,
            userId: messageData.userId,
            username: messageData.username,
          },
          updatedAt: new Date().toISOString(),
        })

        // Commit batch
        await batch.commit()

        // Remove from pending
        this.pendingMessages.delete(tempId)

        // Clear relevant cache
        this.clearMessageCache(messageData.teamId)

        return messageDocRef.id
      } catch (error) {
        // Remove from pending on error
        this.pendingMessages.delete(tempId)
        throw error
      }
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  }

  /**
   * Optimized getTeamMessages with better caching
   */
  async getTeamMessages(teamId: string, limitCount = 50, beforeTimestamp?: number): Promise<ChatMessage[]> {
    try {
      await this.initialize()

      // Check cache first
      const cacheKey = `${teamId}_${limitCount}_${beforeTimestamp || "latest"}`
      const cached = this.messageCache.get(cacheKey)
      const cacheTime = this.cacheExpiry.get(cacheKey)

      if (cached && cacheTime && Date.now() - cacheTime < this.CACHE_DURATION) {
        return this.mergePendingMessages(cached, teamId)
      }

      let q

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

        const result = messages.reverse()

        // Cache the result
        this.messageCache.set(cacheKey, result)
        this.cacheExpiry.set(cacheKey, Date.now())

        // Clean old cache entries
        this.cleanCache()

        return this.mergePendingMessages(result, teamId)
      } catch (indexError) {
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

        const result = fallbackMessages.sort((a, b) => a.timestamp - b.timestamp)
        return this.mergePendingMessages(result, teamId)
      }
    } catch (error) {
      console.error("Error getting team messages:", error)
      throw new Error("Failed to load messages")
    }
  }

  /**
   * Enhanced subscription with better error handling
   */
  subscribeToTeamMessages(teamId: string, callback: (messages: ChatMessage[]) => void, limitCount = 50): () => void {
    let unsubscribe: (() => void) | null = null

    const setupSubscription = async () => {
      try {
        await this.initialize()

        const q = query(
          collection(db, this.MESSAGES_COLLECTION),
          where("teamId", "==", teamId),
          orderBy("timestamp", "desc"),
          limit(limitCount),
        )

        unsubscribe = onSnapshot(
          q,
          (querySnapshot) => {
            const messages: ChatMessage[] = []

            querySnapshot.forEach((doc) => {
              messages.push({
                id: doc.id,
                ...doc.data(),
              } as ChatMessage)
            })

            // Return in chronological order with pending messages
            const result = messages.reverse()
            callback(this.mergePendingMessages(result, teamId))
          },
          (error) => {
            console.error("Error in message subscription:", error)

            // Fallback to simpler query
            if (error.code === "failed-precondition" || error.message.includes("requires an index")) {
              console.warn("Index error in subscribeToTeamMessages, falling back to simpler query")

              const fallbackQuery = query(
                collection(db, this.MESSAGES_COLLECTION),
                where("teamId", "==", teamId),
                limit(limitCount),
              )

              unsubscribe = onSnapshot(
                fallbackQuery,
                (fallbackSnapshot) => {
                  const fallbackMessages: ChatMessage[] = []

                  fallbackSnapshot.forEach((doc) => {
                    fallbackMessages.push({
                      id: doc.id,
                      ...doc.data(),
                    } as ChatMessage)
                  })

                  const result = fallbackMessages.sort((a, b) => a.timestamp - b.timestamp)
                  callback(this.mergePendingMessages(result, teamId))
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
      }
    }

    setupSubscription()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }

  /**
   * Merge pending messages with fetched messages
   */
  private mergePendingMessages(messages: ChatMessage[], teamId: string): ChatMessage[] {
    const pendingForTeam = Array.from(this.pendingMessages.values())
      .filter((msg) => msg.teamId === teamId)
      .map((msg) => ({ ...msg, isPending: true }))

    return [...messages, ...pendingForTeam].sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Clear message cache for a team
   */
  private clearMessageCache(teamId: string): void {
    for (const key of this.messageCache.keys()) {
      if (key.startsWith(teamId)) {
        this.messageCache.delete(key)
        this.cacheExpiry.delete(key)
      }
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
   * Get chat room info with caching
   */
  async getChatRoom(teamId: string): Promise<TeamChatRoom | null> {
    try {
      await this.initialize()

      // Check cache first
      const cached = this.chatRoomCache.get(teamId)
      if (cached) {
        return cached
      }

      const chatRoomRef = doc(db, this.CHAT_ROOMS_COLLECTION, teamId)
      const docSnap = await getDoc(chatRoomRef)

      if (docSnap.exists()) {
        const chatRoom = { id: docSnap.id, ...docSnap.data() } as TeamChatRoom
        this.chatRoomCache.set(teamId, chatRoom)
        return chatRoom
      }

      return null
    } catch (error) {
      console.error("Error getting chat room:", error)
      throw new Error("Failed to load chat room")
    }
  }

  /**
   * Set user online status with optimization
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
      await this.initialize()

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
      if (!this.isInitialized) return // Don't initialize just to set offline

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
   * Get online users with caching
   */
  async getOnlineUsers(userIds: string[]): Promise<ChatUser[]> {
    try {
      await this.initialize()

      if (userIds.length === 0) return []

      const users: ChatUser[] = []

      // Firestore 'in' queries are limited to 10 items, so we batch them
      const batches = []
      for (let i = 0; i < userIds.length; i += 10) {
        batches.push(userIds.slice(i, i + 10))
      }

      const batchPromises = batches.map(async (batch) => {
        const q = query(collection(db, this.ONLINE_USERS_COLLECTION), where("id", "in", batch))
        const querySnapshot = await getDocs(q)
        const batchUsers: ChatUser[] = []

        querySnapshot.forEach((doc) => {
          batchUsers.push({ id: doc.id, ...doc.data() } as ChatUser)
        })

        return batchUsers
      })

      const batchResults = await Promise.all(batchPromises)
      batchResults.forEach((batchUsers) => users.push(...batchUsers))

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
      await this.initialize()

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

      // Clear cache
      this.clearMessageCache(messageData.teamId)
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

      await this.initialize()

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

      // Clear cache
      this.clearMessageCache(messageData.teamId)
    } catch (error) {
      console.error("Error editing message:", error)
      throw error
    }
  }

  /**
   * Enhanced cache cleaning with better memory management
   */
  private cleanCache(): void {
    const now = Date.now()

    // Clean message cache
    for (const [key, time] of this.cacheExpiry.entries()) {
      if (now - time > this.CACHE_DURATION) {
        this.messageCache.delete(key)
        this.cacheExpiry.delete(key)
      }
    }

    // Clean chat room cache (longer TTL)
    if (this.chatRoomCache.size > 50) {
      // Keep only the 30 most recently used
      const entries = Array.from(this.chatRoomCache.entries())
      entries.slice(0, -30).forEach(([key]) => {
        this.chatRoomCache.delete(key)
      })
    }

    // Clean old pending messages (older than 30 seconds)
    for (const [key, message] of this.pendingMessages.entries()) {
      if (now - message.timestamp > 30000) {
        this.pendingMessages.delete(key)
      }
    }
  }

  /**
   * Pre-warm chat for a team (call this when user navigates to chat)
   */
  async preWarmChat(teamId: string): Promise<void> {
    try {
      await this.initialize()

      // Pre-load chat room and recent messages
      const promises = [
        this.getChatRoom(teamId),
        this.getTeamMessages(teamId, 20), // Load fewer messages for speed
      ]

      await Promise.all(promises)
    } catch (error) {
      console.warn("Pre-warm chat failed:", error)
      // Don't throw - this is just optimization
    }
  }
}

// Export singleton instance
export const chatService = new ChatService()

// Pre-initialize the service
if (typeof window !== "undefined") {
  chatService.initialize().catch(console.error)
}
