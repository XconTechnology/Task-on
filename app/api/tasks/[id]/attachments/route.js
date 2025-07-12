import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { firebaseStorageService } from "@/lib/firebase-storage"

// GET /api/tasks/[id]/attachments - Get task attachments
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const taskId = params.id
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const attachmentsCollection = db.collection("taskAttachments")
    const usersCollection = db.collection("users")

    // Get attachments for the task
    const attachments = await attachmentsCollection
      .find({
        taskId,
        workspaceId: currentWorkspaceId,
      })
      .sort({ createdAt: -1 })
      .toArray()

    // Populate uploader information
    const populatedAttachments = await Promise.all(
      attachments.map(async (attachment) => {
        const uploader = await usersCollection.findOne({ id: attachment.uploadedBy })
        return {
          ...attachment,
          uploader: uploader
            ? {
                id: uploader.id,
                username: uploader.username,
                email: uploader.email,
                profilePictureUrl: uploader.profilePictureUrl,
              }
            : undefined,
        }
      }),
    )

    return NextResponse.json({
      success: true,
      data: populatedAttachments,
    })
  } catch (error) {
    console.error("Get task attachments error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/tasks/[id]/attachments - Create task attachment
export async function POST(request, { params }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const taskId = params.id
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Verify task exists and user has access
    const db = await getDatabase()
    const tasksCollection = db.collection("tasks")
    const task = await tasksCollection.findOne({
      id: taskId,
      workspaceId: currentWorkspaceId,
    })

    if (!task) {
      return NextResponse.json({ success: false, error: "Task not found" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") 
    const name = formData.get("name") 
    const description = formData.get("description")

    if (!file || !name) {
      return NextResponse.json({ success: false, error: "File and name are required" }, { status: 400 })
    }

    // File size limit (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size too large (max 50MB)" }, { status: 400 })
    }

    try {
      // Upload file to Firebase Storage
      const uploadResult = await firebaseStorageService.uploadFile(file, currentWorkspaceId, file.name, {
        uploadedBy: user.userId,
        taskId,
        attachmentName: name,
        type: "task-attachment",
      })

      const attachmentsCollection = db.collection("taskAttachments")
      const attachmentId = `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      const newAttachment = {
        id: attachmentId,
        taskId,
        name: name.trim(),
        description: description?.trim() || "",
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        fileUrl: uploadResult.downloadURL,
        storagePath: uploadResult.storagePath,
        workspaceId: currentWorkspaceId,
        uploadedBy: user.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await attachmentsCollection.insertOne(newAttachment)

      // Update task attachment count
      await tasksCollection.updateOne(
        { id: taskId },
        {
          $inc: { attachmentCount: 1 },
          $set: { updatedAt: new Date().toISOString() },
        },
      )

      return NextResponse.json({
        success: true,
        data: newAttachment,
        message: "Attachment uploaded successfully",
      })
    } catch (storageError) {
      console.error("Firebase Storage upload error:", storageError)
      return NextResponse.json(
        {
          success: false,
          error: `Upload failed: ${storageError instanceof Error ? storageError.message : "Unknown storage error"}`,
        },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Create task attachment error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
