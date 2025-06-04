import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const usersCollection = db.collection("users")

    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData?.workspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found" }, { status: 404 })
    }

    const project = await projectsCollection.findOne({
      id: params.id,
      workspaceId: userData.workspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error("Get project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const usersCollection = db.collection("users")

    const userData = await usersCollection.findOne({ id: user.userId })
    const userRole = getUserRole(userData?.role)

    if (!canUserPerformAction(userRole, "project", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const updatedProject = await projectsCollection.findOneAndUpdate(
      {
        id: params.id,
        workspaceId: userData?.workspaceId,
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

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const projectsCollection = db.collection("projects")
    const tasksCollection = db.collection("tasks")
    const usersCollection = db.collection("users")

    const userData = await usersCollection.findOne({ id: user.userId })
    const userRole = getUserRole(userData?.role)

    if (!canUserPerformAction(userRole, "project", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    const project = await projectsCollection.findOne({
      id: params.id,
      workspaceId: userData?.workspaceId,
    })

    if (!project) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 })
    }

    await tasksCollection.deleteMany({ projectId: params.id })
    await projectsCollection.deleteOne({ id: params.id })

    return NextResponse.json({
      success: true,
      message: "Project and all associated tasks deleted successfully",
    })
  } catch (error) {
    console.error("Delete project error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
