import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { getCurrentWorkspaceId } from "@/lib/workspace-utils";

// Update a workspace member (change role)
export async function PUT(request, { params }) {
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

    const workspace = await workspacesCollection.findOne({
      id: currentWorkspaceId,
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    const currentUserMember = workspace.members.find(
      (member) => member.memberId === user.userId
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

    const targetMember = workspace.members.find(
      (member) => member.memberId === memberId
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
        $set: { "members.$.role": role },
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
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);
    const memberId = params.id;

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

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

    const workspace = await workspacesCollection.findOne({
      id: currentWorkspaceId,
    });

    if (!workspace) {
      return NextResponse.json(
        { success: false, error: "Workspace not found" },
        { status: 404 }
      );
    }

    const currentUserMember = workspace.members.find(
      (member) => member.memberId === user.userId
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

    const targetMember = workspace.members.find(
      (member) => member.memberId === memberId
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

    if (memberId === user.userId) {
      return NextResponse.json(
        {
          success: false,
          error: "You cannot remove yourself from the workspace",
        },
        { status: 400 }
      );
    }

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
