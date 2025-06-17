import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { readFile } from "fs/promises"
import { join } from "path"

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

    // Read file from disk
    const filePath = join(process.cwd(), "public", document.fileUrl)
    const fileBuffer = await readFile(filePath)

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": document.fileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${document.fileName}"`,
        "Content-Length": document.fileSize.toString(),
      },
    })
  } catch (error) {
    console.error("Download document error:", error)
    return NextResponse.json({ success: false, error: "File not found or internal server error" }, { status: 500 })
  }
}
