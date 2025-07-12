import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { firebaseStorageService } from "@/lib/firebase-storage"

// GET /api/tasks/attachments/[id]/download - Download attachment
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

    try {
      // Get fresh download URL from Firebase Storage
      const downloadURL = attachment.storagePath
        ? await firebaseStorageService.getDownloadURL(attachment.storagePath)
        : attachment.fileUrl

      // Redirect to the Firebase Storage download URL
      return NextResponse.redirect(downloadURL)
    } catch (storageError) {
      console.error("Error getting download URL:", storageError)
      return NextResponse.json({ success: false, error: "Failed to generate download link" }, { status: 500 })
    }
  } catch (error) {
    console.error("Download attachment error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
