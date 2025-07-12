import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { firebaseStorageService } from "@/lib/firebase-storage"

// GET /api/tasks/attachments/[id] - Get attachment by ID
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const attachmentId = params.id
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const attachmentsCollection = db.collection("taskAttachments")

    const attachment = await attachmentsCollection.findOne({
      id: attachmentId,
      workspaceId: currentWorkspaceId,
    })

    if (!attachment) {
      return NextResponse.json({ success: false, error: "Attachment not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: attachment,
    })
  } catch (error) {
    console.error("Get attachment error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/tasks/attachments/[id] - Delete attachment
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const attachmentId = params.id
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const attachmentsCollection = db.collection("taskAttachments")
    const tasksCollection = db.collection("tasks")

    const attachment = await attachmentsCollection.findOne({
      id: attachmentId,
      workspaceId: currentWorkspaceId,
    })

    if (!attachment) {
      return NextResponse.json({ success: false, error: "Attachment not found" }, { status: 404 })
    }

    // Check if user can delete (owner or admin)
    // For now, allow uploader to delete their own attachments
    if (attachment.uploadedBy !== user.userId) {
      // TODO: Add admin check here
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    try {
      // Delete file from Firebase Storage
      if (attachment.storagePath) {
        await firebaseStorageService.deleteFile(attachment.storagePath)
      }
    } catch (storageError) {
      console.error("Error deleting file from Firebase Storage:", storageError)
      // Continue with database deletion even if storage deletion fails
    }

    // Delete attachment from database
    await attachmentsCollection.deleteOne({ id: attachmentId })

    // Update task attachment count
    await tasksCollection.updateOne(
      { id: attachment.taskId },
      {
        $inc: { attachmentCount: -1 },
        $set: { updatedAt: new Date().toISOString() },
      },
    )

    return NextResponse.json({
      success: true,
      message: "Attachment deleted successfully",
    })
  } catch (error) {
    console.error("Delete attachment error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
