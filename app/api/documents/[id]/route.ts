import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { unlink } from "fs/promises"
import { join } from "path"

// GET /api/documents/[id] - Get document by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

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

    return NextResponse.json({
      success: true,
      data: document,
    })
  } catch (error) {
    console.error("Get document error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/documents/[id] - Update document
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, projectId, taskId } = body

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

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

    const updates: any = {
      updatedAt: new Date().toISOString(),
    }

    if (name) updates.name = name.trim()
    if (description !== undefined) updates.description = description.trim()
    if (projectId !== undefined) updates.projectId = projectId || undefined
    if (taskId !== undefined) updates.taskId = taskId || undefined

    await documentsCollection.updateOne({ id: params.id }, { $set: updates })

    const updatedDocument = await documentsCollection.findOne({ id: params.id })

    return NextResponse.json({
      success: true,
      data: updatedDocument,
      message: "Document updated successfully",
    })
  } catch (error) {
    console.error("Update document error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/documents/[id] - Delete document
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

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

    // Delete file from disk
    try {
      const filePath = join(process.cwd(), "public", document.fileUrl)
      await unlink(filePath)
    } catch (fileError) {
      console.error("Error deleting file:", fileError)
      // Continue with database deletion even if file deletion fails
    }

    await documentsCollection.deleteOne({ id: params.id })

    return NextResponse.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    console.error("Delete document error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
