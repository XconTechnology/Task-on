import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { getUserRole } from "@/lib/permissions"
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils"
import { calculateTargetStatus } from "@/lib/target-utils"
import type { Target } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const targetsCollection = db.collection("targets")
    const usersCollection = db.collection("users")
    const projectsCollection = db.collection("projects")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    // Only Admins and Owners can access targets
    if (userRole === "Member") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const status = url.searchParams.get("status") || "all"
    const search = url.searchParams.get("search") || ""
    const assignedTo = url.searchParams.get("assignedTo") || ""
    const projectId = url.searchParams.get("projectId") || ""

    // Build query
    const query: any = { workspaceId: currentWorkspaceId }

    // Filter by status
    if (status !== "all") {
      query.status = status
    }

    // Filter by assigned user
    if (assignedTo) {
      query.assignedTo = assignedTo
    }

    // Filter by project
    if (projectId) {
      query.projectId = projectId
    }

    // Search functionality
    if (search) {
      // We'll need to do a more complex search that includes user names
      const searchRegex = new RegExp(search, "i")

      // First, find users that match the search term
      const matchingUsers = await usersCollection
        .find({
          workspaceIds: currentWorkspaceId,
          $or: [{ username: searchRegex }, { email: searchRegex }],
        })
        .toArray()

      const matchingUserIds = matchingUsers.map((u) => u.id)

      // Update query to include title search or matching user IDs
      query.$or = [{ title: searchRegex }, { description: searchRegex }, { assignedTo: { $in: matchingUserIds } }]
    }

    // Get total count for pagination
    const total = await targetsCollection.countDocuments(query)

    // Get targets with pagination
    const targets = await targetsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    // CRITICAL: Check and update target statuses automatically
    const updatedTargets :any = []

    for (const target of targets) {
      const statusCheck = calculateTargetStatus(target.currentValue, target.targetValue, target.deadline, target.status)

      if (statusCheck.shouldUpdate) {
        // Update the target status in database
        const updateData = {
          status: statusCheck.status,
          updatedAt: new Date().toISOString(),
          ...(statusCheck.status === "completed" && target.status !== "completed"
            ? { completedAt: new Date().toISOString() }
            : {}),
        }

        await targetsCollection.updateOne({ id: target.id }, { $set: updateData })

        // Update the target object for response
        const updatedTarget = { ...target, ...updateData }
        updatedTargets.push(updatedTarget)

        console.log(
          `Target ${target.id} status updated from ${target.status} to ${statusCheck.status}: ${statusCheck.reason}`,
        )
      } else {
        updatedTargets.push(target)
      }
    }

    // Populate user and project data
    const populatedTargets = await Promise.all(
      updatedTargets.map(async (target: any) => {
        const populatedTarget = { ...target }

        // Populate assignee
        if (target.assignedTo) {
          const assignee = await usersCollection.findOne({ id: target.assignedTo })
          if (assignee) {
            populatedTarget.assignee = {
              id: assignee.id,
              username: assignee.username,
              email: assignee.email,
              profilePictureUrl: assignee.profilePictureUrl,
            }
          }
        }

        // Populate project
        if (target.projectId) {
          const project = await projectsCollection.findOne({ id: target.projectId })
          if (project) {
            populatedTarget.project = {
              id: project.id,
              name: project.name,
            }
          }
        }

        // Populate creator
        if (target.createdBy) {
          const creator = await usersCollection.findOne({ id: target.createdBy })
          if (creator) {
            populatedTarget.creator = {
              id: creator.id,
              username: creator.username,
              email: creator.email,
            }
          }
        }

        return populatedTarget
      }),
    )

    const hasMore = page * limit < total

    return NextResponse.json({
      success: true,
      data: {
        targets: populatedTargets,
        hasMore,
        total,
        page,
      },
    })
  } catch (error) {
    console.error("Get targets error:", error)
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
    const { title, description, assignedTo, projectId, targetValue, unit, deadline } = body

    // Validation
    if (!title?.trim()) {
      return NextResponse.json({ success: false, error: "Target title is required" }, { status: 400 })
    }

    if (!description?.trim()) {
      return NextResponse.json({ success: false, error: "Target description is required" }, { status: 400 })
    }

    if (!assignedTo) {
      return NextResponse.json({ success: false, error: "Assigned user is required" }, { status: 400 })
    }

    if (!targetValue || targetValue <= 0) {
      return NextResponse.json({ success: false, error: "Target value must be greater than 0" }, { status: 400 })
    }

    if (!unit?.trim()) {
      return NextResponse.json({ success: false, error: "Unit is required" }, { status: 400 })
    }

    if (!deadline) {
      return NextResponse.json({ success: false, error: "Deadline is required" }, { status: 400 })
    }

    // Check if deadline is in the future
    if (new Date(deadline) <= new Date()) {
      return NextResponse.json({ success: false, error: "Deadline must be in the future" }, { status: 400 })
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id")
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined)

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 })
    }

    const db = await getDatabase()
    const targetsCollection = db.collection("targets")

    // Get user's role in the workspace
    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId)
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 })
    }

    const userRole = getUserRole(workspaceMember.role)

    // Only Admins and Owners can create targets
    if (userRole === "Member") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Create target
    const targetId = `target_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newTarget: Target = {
      id: targetId,
      title: title.trim(),
      description: description.trim(),
      workspaceId: currentWorkspaceId,
      assignedTo,
      projectId: projectId || undefined,
      targetValue: Number(targetValue),
      currentValue: 0,
      unit: unit.trim(),
      deadline,
      status: "active",
      createdBy: user.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await targetsCollection.insertOne(newTarget)

    return NextResponse.json({
      success: true,
      data: newTarget,
      message: "Target created successfully",
    })
  } catch (error) {
    console.error("Create target error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
