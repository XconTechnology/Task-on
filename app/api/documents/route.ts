import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getCurrentWorkspaceId } from "@/lib/workspace-utils"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"

// GET /api/documents - Get documents with pagination and filters
export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search")
    const projectId = searchParams.get("projectId")
    const taskId = searchParams.get("taskId")

    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const db = await getDatabase()
    const documentsCollection = db.collection("documents")
    const projectsCollection = db.collection("projects")
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    // Build query
    const query: any = { workspaceId: currentWorkspaceId }

    if (projectId) query.projectId = projectId
    if (taskId) query.taskId = taskId
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { fileName: { $regex: search, $options: "i" } },
      ]
    }

    // Get total count
    const total = await documentsCollection.countDocuments(query)

    // Get documents with pagination
    const documents = await documentsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    // Populate related data
    const populatedDocuments = await Promise.all(
      documents.map(async (doc) => {
        const [project, task, uploader] = await Promise.all([
          doc.projectId ? projectsCollection.findOne({ id: doc.projectId }) : null,
          doc.taskId ? tasksCollection.findOne({ id: doc.taskId }) : null,
          usersCollection.findOne({ id: doc.uploadedBy }),
        ])

        return {
          ...doc,
          project: project ? { id: project.id, name: project.name } : undefined,
          task: task ? { id: task.id, title: task.title } : undefined,
          uploader: uploader
            ? {
                id: uploader.id,
                username: uploader.username,
                email: uploader.email,
              }
            : undefined,
        }
      }),
    )

    const hasMore = page * limit < total

    return NextResponse.json({
      success: true,
      data: {
        documents: populatedDocuments,
        hasMore,
        total,
        page,
      },
    })
  } catch (error) {
    console.error("Get documents error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/documents - Create new document
export async function POST(request: NextRequest) {
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

    const formData = await request.formData()
    const file = formData.get("file") as File
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const projectId = formData.get("projectId") as string
    const taskId = formData.get("taskId") as string

    if (!file || !name) {
      return NextResponse.json({ success: false, error: "File and name are required" }, { status: 400 })
    }

    // File size limit (50MB)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File size too large (max 50MB)" }, { status: 400 })
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", currentWorkspaceId)
    await mkdir(uploadsDir, { recursive: true })

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substr(2, 9)
    const fileExtension = file.name.split(".").pop()
    const uniqueFileName = `${timestamp}_${randomString}.${fileExtension}`
    const filePath = join(uploadsDir, uniqueFileName)

    // Save file to disk
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    const fileUrl = `/uploads/${currentWorkspaceId}/${uniqueFileName}`

    const db = await getDatabase()
    const documentsCollection = db.collection("documents")

    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newDocument = {
      id: documentId,
      name: name.trim(),
      description: description?.trim() || "",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl,
      workspaceId: currentWorkspaceId,
      projectId: projectId || undefined,
      taskId: taskId || undefined,
      uploadedBy: user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await documentsCollection.insertOne(newDocument)

    return NextResponse.json({
      success: true,
      data: newDocument,
      message: "Document uploaded successfully",
    })
  } catch (error) {
    console.error("Create document error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
