import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"

// ✅ Utility function to extract projectId from URL
function getProjectIdFromRequest(request: NextRequest): string | null {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/")
  const index = pathParts.indexOf("projects")
  return index !== -1 && pathParts.length > index + 1 ? pathParts[index + 1] : null
}

// GET /api/projects/[id]
export async function GET(request: NextRequest) {
  try {
    const projectId = getProjectIdFromRequest(request)
    if (!projectId) {
      return NextResponse.json({ success: false, error: "Invalid project ID" }, { status: 400 })
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    const project = await projectsCollection.findOne({
      id: projectId,
      workspaceId: currentWorkspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// PUT /api/projects/[id]
export async function PUT(request: NextRequest) {
  try {
    const projectId = getProjectIdFromRequest(request)
    if (!projectId) {
      return NextResponse.json({ success: false, error: "Invalid project ID" }, { status: 400 })
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, startDate, endDate, teamId } = body

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Project name is required" }, { status: 400 })
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ success: false, error: "End date must be after start date" }, { status: 400 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)
    if (!canUserPerformAction(userRole, "project", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const updatedProject = await projectsCollection.findOneAndUpdate(
      {
        id: projectId,
        workspaceId: currentWorkspaceId,
      },
      {
        $set: {
          name: name.trim(),
          description: description?.trim() || "",
          teamId: teamId && teamId !== "none" ? teamId : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" },
    )

    if (!updatedProject?.value) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: updatedProject.value,
      message: "Project updated successfully",
    })
  } catch (error) {
    console.error("Update project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

// DELETE /api/projects/[id]
export async function DELETE(request: NextRequest) {
  try {
    const projectId = getProjectIdFromRequest(request)
    if (!projectId) {
      return NextResponse.json({ success: false, error: "Invalid project ID" }, { status: 400 })
    }

    const user = await getUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Get current workspace ID from header or fallback to user's first workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const tasksCollection = db.collection("tasks")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)
    if (!canUserPerformAction(userRole, "project", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const project = await projectsCollection.findOne({
      id: projectId,
      workspaceId: currentWorkspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    // Delete all tasks in this project
    await tasksCollection.deleteMany({ projectId, workspaceId: currentWorkspaceId })
    await projectsCollection.deleteOne({ id: projectId })

    return NextResponse.json({
      success: true,
      message: "Project and all associated tasks deleted successfully",
    })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
