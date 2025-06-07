import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { OnboardingData, Workspace, WorkspaceMember } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body: OnboardingData = await request.json()
    const { usageType, managementType, features, workspaceName, teamInvites, referralSource } = body

    // Validation
    if (!usageType || !workspaceName) {
      return NextResponse.json({ success: false, error: "Usage type and workspace name are required" }, { status: 400 })
    }

    const db = await getDatabase()
    const workspacesCollection = db.collection("workspaces")
    const usersCollection = db.collection("users")

    // Get user data to create workspace member
    const userData = await usersCollection.findOne({ id: user.userId })
    if (!userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Create workspace
    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Create workspace member object for the user
    const workspaceMember: WorkspaceMember = {
      memberId: user.userId,
      username: userData.username,
      email: userData.email,
      role: "Owner", // User is owner of their new workspace
      joinedAt: new Date().toISOString(),
    }

    const newWorkspace: Workspace = {
      id: workspaceId,
      name: workspaceName,
      ownerId: user.userId,
      defaultRole: "Member",
      allowMemberInvites: true,
      members: [workspaceMember], // Add user as first member
      pendingInvites: [],
      // Store onboarding data as additional fields
      usageType,
      managementType: managementType || [],
      features: features || [],
      referralSource,
      teamInvites: teamInvites || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await workspacesCollection.insertOne(newWorkspace)

    // FIXED: Add workspace ID to user's workspaceIds array (don't overwrite)
    await usersCollection.updateOne(
      { id: user.userId },
      {
        $addToSet: { workspaceIds: workspaceId }, // Use $addToSet to add to array without duplicates
        $set: { updatedAt: new Date().toISOString() },
      },
    )

    return NextResponse.json({
      success: true,
      data: { workspace: newWorkspace },
      message: "Onboarding completed successfully",
    })
  } catch (error) {
    console.error("Onboarding error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
