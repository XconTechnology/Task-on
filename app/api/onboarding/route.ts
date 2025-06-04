import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import type { Workspace, OnboardingData } from "@/lib/types"

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

    // Create workspace
    const workspaceId = `workspace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const newWorkspace: any = {
      id: workspaceId,
      name: workspaceName,
      ownerId: user.userId,
      usageType,
      managementType: managementType || [],
      features: features || [],
      referralSource,
      teamInvites: teamInvites || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    await workspacesCollection.insertOne(newWorkspace)

    // Update user with workspace ID
    await usersCollection.updateOne(
      { id: user.userId },
      {
        $set: {
          workspaceId: workspaceId,
          updatedAt: new Date().toISOString(),
        },
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
