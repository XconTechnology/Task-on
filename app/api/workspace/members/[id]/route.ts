import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { getCurrentWorkspaceId } from "@/lib/workspace-utils";

// Update a workspace member (change role)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    const memberId = params.id;
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { role } = await request.json();

    if (!role || !["Member", "Admin", "Owner"].includes(role)) {
      return NextResponse.json(
        { success: false, error: "Invalid role" },
        { status: 400 }
      );
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id");
    const currentWorkspaceId = await getCurrentWorkspaceId(
      user.userId,
      headerWorkspaceId || undefined
    );

    if (!currentWorkspaceId) {
      return NextResponse.json(
        { success: false, error: "No workspace found for user" },
        { status: 404 }
      );
    }

    const db = await getDatabase();
    const workspacesCollection = db.collection("workspaces");

    // Check if the current user has permission to update roles (must be Owner or Admin)
    const workspace = await workspacesCollection.findOne({
      id: currentWorkspaceId,
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Find the current user's role in the workspace
    const currentUserMember = workspace.members.find(
      (member: any) => member.memberId === user.userId
    );

    if (
      !currentUserMember ||
      (currentUserMember.role !== "Owner" && currentUserMember.role !== "Admin")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to update member roles",
        },
        { status: 403 }
      );
    }

    // Cannot change Owner's role unless you're the Owner
    const targetMember = workspace.members.find(
      (member: any) => member.memberId === memberId
    );
    if (targetMember?.role === "Owner" && currentUserMember.role !== "Owner") {
      return NextResponse.json(
        {
          success: false,
          error: "Only the workspace owner can change the owner's role",
        },
        { status: 403 }
      );
    }

    // Cannot change your own role
    if (memberId === user.userId) {
      return NextResponse.json(
        { success: false, error: "You cannot change your own role" },
        { status: 400 }
      );
    }

    const result = await workspacesCollection.updateOne(
      {
        id: currentWorkspaceId,
        "members.memberId": memberId,
      },
      {
        $set: { "members.$.role": role }, // <--- use positional operator
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Member not found in workspace" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Member role updated successfully",
    });
  } catch (error) {
    console.error("Update member error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete a workspace member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = getUserFromRequest(request);
    const memberId = params.id;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Try to get workspace ID from header first, then fallback to user's workspace
    const headerWorkspaceId = request.headers.get("x-workspace-id");
    const currentWorkspaceId = await getCurrentWorkspaceId(
      user.userId,
      headerWorkspaceId || undefined
    );

    if (!currentWorkspaceId) {
      return NextResponse.json(
        { success: false, error: "No workspace found for user" },
        { status: 404 }
      );
    }

    const db = await getDatabase();
    const workspacesCollection = db.collection("workspaces");
    const usersCollection = db.collection("users");

    // Check if the current user has permission to remove members (must be Owner or Admin)
    const workspace = await workspacesCollection.findOne({
      id: currentWorkspaceId,
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    // Find the current user's role in the workspace
    const currentUserMember = workspace.members.find(
      (member: any) => member.memberId === user.userId
    );

    if (
      !currentUserMember ||
      (currentUserMember.role !== "Owner" && currentUserMember.role !== "Admin")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "You don't have permission to remove members",
        },
        { status: 403 }
      );
    }

    // Cannot remove the Owner unless you're the Owner
    const targetMember = workspace.members.find(
      (member: any) => member.memberId === memberId
    );
    if (!targetMember) {
      return NextResponse.json(
        { success: false, error: "Member not found in workspace" },
        { status: 404 }
      );
    }

    if (targetMember.role === "Owner" && currentUserMember.role !== "Owner") {
      return NextResponse.json(
        {
          success: false,
          error: "Only the workspace owner can remove the owner",
        },
        { status: 403 }
      );
    }

    // Cannot remove yourself (use a different endpoint for leaving a workspace)
    if (memberId === user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot remove yourself from the workspace",
        },
        { status: 400 }
      );
    }

    // 1. Remove the member from the workspace
    const removeResult = await workspacesCollection.updateOne(
      { id: currentWorkspaceId },
      { $pull: { members: { memberId: memberId } } }
    );

    if (removeResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to remove member from workspace" },
        { status: 500 }
      );
    }

    // 2. Remove the workspace from the user's workspaces array
    await usersCollection.updateOne(
      { id: memberId },
      { $pull: { workspaces: currentWorkspaceId } }
    );

    return NextResponse.json({
      success: true,
      message: "Member removed from workspace successfully",
    });
  } catch (error) {
    console.error("Delete member error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
