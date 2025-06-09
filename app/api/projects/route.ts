import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"
import type { Project } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    // Get current workspace ID
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId)
    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get all projects in the workspace
    const projects = await projectsCollection
      .find({ workspaceId: currentWorkspaceId })
      .sort({ createdAt: -1 })
      .toArray()

    return NextResponse.json({
      success: true,
      data: projects,
    })
  } catch (error) {
    console.error("Get projects error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, startDate, endDate, teamId } = body

    // Validation
    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Project name is required" }, { status: 400 })
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return NextResponse.json({ success: false, error: "End date must be after start date" }, { status: 400 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")

    // Get current workspace ID
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId)
    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)
    if (!canUserPerformAction(userRole, "project", "create")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Create project
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newProject: Project = {
      id: projectId,
      name: name.trim(),
      description: description?.trim() || "",
      workspaceId: currentWorkspaceId,
      createdBy: user.userId,
      teamId: teamId && teamId !== "none" ? teamId : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await projectsCollection.insertOne(newProject)

    return NextResponse.json({
      success: true,
      data: newProject,
      message: "Project created successfully",
    })
  } catch (error) {
    console.error("Create project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
