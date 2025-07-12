import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { firebaseStorageService } from "@/lib/firebase-storage"

// GET /api/documents/[id]/preview - Preview document from Firebase Storage
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get("workspaceId")

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, workspaceId || headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const documentsCollection = db.collection("documents")

    const document = await documentsCollection.findOne({
      id: params.id,
      workspaceId: currentWorkspaceId,
    })

    if (!document) {
      return NextResponse.json({ success: false, error: "Document not found" }, { status: 404 })
    }

    try {
      // Get fresh download URL from Firebase Storage for preview
      const previewURL = document.storagePath
        ? await firebaseStorageService.getDownloadURL(document.storagePath)
        : document.fileUrl

      // For images and PDFs, we can redirect directly
      // For other file types, you might want to implement a viewer
      if (document.fileType.startsWith("image/") || document.fileType === "application/pdf") {
        return NextResponse.redirect(previewURL)
      } else {
        // For other file types, return the URL as JSON
        return NextResponse.json({
          success: true,
          data: {
            previewUrl: previewURL,
            fileName: document.fileName,
            fileType: document.fileType,
            message: "File preview URL generated",
          },
        })
      }
    } catch (storageError) {
      console.error("Error getting preview URL:", storageError)
      return NextResponse.json({ success: false, error: "Failed to generate preview link" }, { status: 500 })
    }
  } catch (error) {
    console.error("Preview document error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
