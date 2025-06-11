import { getDatabase } from "@/lib/mongodb"
import { NotificationType } from "@/lib/types"
import type { Notification, NotificationData } from "@/lib/types"

export class NotificationService {
  private static instance: NotificationService
  private dbCache: any = null
  private connectionPromise: Promise<any> | null = null

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  private async getDb() {
    // Use cached connection if available
    if (this.dbCache) {
      return this.dbCache
    }

    // If connection is in progress, wait for it
    if (this.connectionPromise) {
      this.dbCache = await this.connectionPromise
      return this.dbCache
    }

    // Create new connection
    this.connectionPromise = getDatabase()
    this.dbCache = await this.connectionPromise
    this.connectionPromise = null

    return this.dbCache
  }

  /**
   * Create a new notification - FIXED to ensure MongoDB storage
   */
  async createNotification(
    userId: string,
    workspaceId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: NotificationData,
  ): Promise<boolean> {
    try {
      console.log("Creating notification:", { userId, workspaceId, type, title })

      const db = await this.getDb()
      const notificationsCollection = db.collection("notifications")

      const notification: Notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        workspaceId,
        type,
        title,
        message,
        data: data || {},
        isRead: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const result = await notificationsCollection.insertOne(notification)
      console.log("Notification created successfully:", result.insertedId)

      return true
    } catch (error) {
      console.error("Error creating notification:", error)
      return false
    }
  }

  /**
   * Create task assignment notification
   */
  async notifyTaskAssigned(
    assigneeId: string,
    workspaceId: string,
    taskId: string,
    taskTitle: string,
    projectName: string,
    assignedByName: string,
  ): Promise<void> {
    console.log("Creating task assignment notification for:", assigneeId)

    await this.createNotification(
      assigneeId,
      workspaceId,
      NotificationType.TASK_ASSIGNED,
      "New Task Assigned",
      `You have been assigned a new task: "${taskTitle}" in project "${projectName}" by ${assignedByName}`,
      {
        taskId,
        taskTitle,
        projectName,
        assignedByName,
      },
    )
  }

  /**
   * Create team member added notification
   */
  async notifyTeamMemberAdded(
    teamMemberIds: string[],
    workspaceId: string,
    teamId: string,
    teamName: string,
    newMemberName: string,
    newMemberEmail: string,
  ): Promise<void> {
    console.log("Creating team member notifications for:", teamMemberIds)

    const promises = teamMemberIds.map((memberId) =>
      this.createNotification(
        memberId,
        workspaceId,
        NotificationType.TEAM_MEMBER_ADDED,
        "New Team Member",
        `${newMemberName} (${newMemberEmail}) joined your team "${teamName}"`,
        {
          teamId,
          teamName,
          newMemberName,
          newMemberEmail,
        },
      ),
    )

    await Promise.all(promises)
  }

  /**
   * Create workspace member joined notification
   */
  async notifyWorkspaceMemberJoined(
    workspaceMemberIds: string[],
    workspaceId: string,
    workspaceName: string,
    newMemberName: string,
    newMemberEmail: string,
  ): Promise<void> {
    console.log("Creating workspace member notifications for:", workspaceMemberIds)

    const promises = workspaceMemberIds.map((memberId) =>
      this.createNotification(
        memberId,
        workspaceId,
        NotificationType.WORKSPACE_MEMBER_JOINED,
        "New Workspace Member",
        `${newMemberName} (${newMemberEmail}) joined your workspace "${workspaceName}"`,
        {
          workspaceId,
          workspaceName,
          newMemberName,
          newMemberEmail,
        },
      ),
    )

    await Promise.all(promises)
  }

  /**
   * Create added to team notification
   */
  async notifyAddedToTeam(
    userId: string,
    workspaceId: string,
    teamId: string,
    teamName: string,
    addedByName: string,
  ): Promise<void> {
    console.log("Creating added to team notification for:", userId)

    await this.createNotification(
      userId,
      workspaceId,
      NotificationType.ADDED_TO_TEAM,
      "Added to Team",
      `You have been added to team "${teamName}" by ${addedByName}`,
      {
        teamId,
        teamName,
        addedByName,
      },
    )
  }

  /**
   * Create workspace invitation notification
   */
  async notifyWorkspaceInvitation(
    userId: string,
    workspaceId: string,
    workspaceName: string,
    invitedByName: string,
    inviteToken: string,
  ): Promise<void> {
    console.log("Creating workspace invitation notification for:", userId)

    await this.createNotification(
      userId,
      workspaceId,
      NotificationType.WORKSPACE_INVITATION,
      "Workspace Invitation",
      `${invitedByName} invited you to join workspace "${workspaceName}"`,
      {
        workspaceId,
        workspaceName,
        invitedByName,
        inviteToken,
        requiresAction: true,
      },
    )
  }

  /**
   * Get user notifications with pagination - OPTIMIZED
   */
  async getUserNotifications(
    userId: string,
    workspaceId: string,
    page = 1,
    limit = 20,
    unreadOnly = false,
  ): Promise<{
    notifications: Notification[]
    total: number
    unreadCount: number
  }> {
    try {
      const db = await this.getDb()
      const notificationsCollection = db.collection("notifications")

      const query: any = { userId, workspaceId }
      if (unreadOnly) {
        query.isRead = false
      }

      // Use Promise.all for parallel execution
      const [notifications, total, unreadCount] = await Promise.all([
        notificationsCollection
          .find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .toArray(),
        notificationsCollection.countDocuments(query),
        notificationsCollection.countDocuments({ userId, workspaceId, isRead: false }),
      ])

      return {
        notifications,
        total,
        unreadCount,
      }
    } catch (error) {
      console.error("Error getting user notifications:", error)
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
      }
    }
  }

  /**
   * Mark notification as read - OPTIMIZED
   */
  async markAsRead(notificationId: string, userId: string): Promise<boolean> {
    try {
      const db = await this.getDb()
      const notificationsCollection = db.collection("notifications")

      const result = await notificationsCollection.updateOne(
        { id: notificationId, userId },
        {
          $set: {
            isRead: true,
            updatedAt: new Date().toISOString(),
          },
        },
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error("Error marking notification as read:", error)
      return false
    }
  }

  /**
   * Mark all notifications as read for a user - OPTIMIZED
   */
  async markAllAsRead(userId: string, workspaceId: string): Promise<boolean> {
    try {
      const db = await this.getDb()
      const notificationsCollection = db.collection("notifications")

      const result = await notificationsCollection.updateMany(
        { userId, workspaceId, isRead: false },
        {
          $set: {
            isRead: true,
            updatedAt: new Date().toISOString(),
          },
        },
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error("Error marking all notifications as read:", error)
      return false
    }
  }

  /**
   * Get unread count for user - OPTIMIZED
   */
  async getUnreadCount(userId: string, workspaceId: string): Promise<number> {
    try {
      const db = await this.getDb()
      const notificationsCollection = db.collection("notifications")

      return await notificationsCollection.countDocuments({
        userId,
        workspaceId,
        isRead: false,
      })
    } catch (error) {
      console.error("Error getting unread count:", error)
      return 0
    }
  }

  /**
   * Accept workspace invitation
   */
  async acceptWorkspaceInvitation(
    notificationId: string,
    userId: string,
  ): Promise<{ success: boolean; inviteToken?: string }> {
    try {
      const db = await this.getDb()
      const notificationsCollection = db.collection("notifications")

      const notification = await notificationsCollection.findOne({
        id: notificationId,
        userId,
        type: NotificationType.WORKSPACE_INVITATION,
      })

      if (!notification || !notification.data?.inviteToken) {
        return { success: false }
      }

      // Mark notification as read
      await this.markAsRead(notificationId, userId)

      return {
        success: true,
        inviteToken: notification.data.inviteToken,
      }
    } catch (error) {
      console.error("Error accepting workspace invitation:", error)
      return { success: false }
    }
  }

  /**
   * Reject workspace invitation
   */
  async rejectWorkspaceInvitation(notificationId: string, userId: string): Promise<boolean> {
    try {
      const db = await this.getDb()
      const notificationsCollection = db.collection("notifications")

      // Mark notification as read and add rejection data
      const result = await notificationsCollection.updateOne(
        { id: notificationId, userId, type: NotificationType.WORKSPACE_INVITATION },
        {
          $set: {
            isRead: true,
            "data.rejected": true,
            "data.rejectedAt": new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        },
      )

      return result.modifiedCount > 0
    } catch (error) {
      console.error("Error rejecting workspace invitation:", error)
      return false
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()
