import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { canUserPerformAction, getUserRole } from "@/lib/permissions";
import { getCurrentWorkspaceId, getWorkspaceMember } from "@/lib/workspace-utils";

// GET a team by ID with full member details
export async function GET(request, { params }) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const headerWorkspaceId = request.headers.get("x-workspace-id");
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined);

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 });
    }

    const db = await getDatabase();
    const teamsCollection = db.collection("teams");
    const usersCollection = db.collection("users");

    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId);
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 });
    }

    const userRole = getUserRole(workspaceMember.role);

    if (!canUserPerformAction(userRole, "team", "read")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const team = await teamsCollection.findOne({
      id: params.id,
      workspaceId: currentWorkspaceId,
    });

    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
    }

    const memberIds = team.members || [];
    const memberDetails = [];

    if (memberIds.length > 0) {
      const users = await usersCollection.find({ id: { $in: memberIds } }).toArray();

      for (const userId of memberIds) {
        const matchedUser = users.find((u) => u.id === userId);
        if (matchedUser) {
          memberDetails.push({
            id: matchedUser.id,
            username: matchedUser.username,
            email: matchedUser.email,
            profilePictureUrl: matchedUser.profilePictureUrl,
            role: workspaceMember.role,
          });
        }
      }
    }

    const teamWithMembers = {
      ...team,
      members: memberDetails,
      memberCount: memberDetails.length,
    };

    return NextResponse.json({
      success: true,
      data: teamWithMembers,
    });
  } catch (error) {
    console.error("Get team error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update team info
export async function PUT(request, { params }) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();

    const headerWorkspaceId = request.headers.get("x-workspace-id");
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined);

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 });
    }

    const db = await getDatabase();
    const teamsCollection = db.collection("teams");

    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId);
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 });
    }

    if (!canUserPerformAction(workspaceMember.role || "Member", "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const updatedTeam = await teamsCollection.findOneAndUpdate(
      {
        id: params.id,
        workspaceId: currentWorkspaceId,
      },
      {
        $set: {
          ...body,
          updatedAt: new Date().toISOString(),
        },
      },
      { returnDocument: "after" }
    );

    if (!updatedTeam?.value) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: updatedTeam.value,
      message: "Team updated successfully",
    });
  } catch (error) {
    console.error("Update team error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Remove team
export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const headerWorkspaceId = request.headers.get("x-workspace-id");
    const currentWorkspaceId = await getCurrentWorkspaceId(user.userId, headerWorkspaceId || undefined);

    if (!currentWorkspaceId) {
      return NextResponse.json({ success: false, error: "No workspace found for user" }, { status: 404 });
    }

    const db = await getDatabase();
    const teamsCollection = db.collection("teams");

    const workspaceMember = await getWorkspaceMember(user.userId, currentWorkspaceId);
    if (!workspaceMember) {
      return NextResponse.json({ success: false, error: "Not a member of current workspace" }, { status: 403 });
    }

    if (!canUserPerformAction(workspaceMember.role || "Member", "team", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    await teamsCollection.deleteOne({
      id: params.id,
      workspaceId: currentWorkspaceId,
    });

    return NextResponse.json({
      success: true,
      message: "Team deleted successfully",
    });
  } catch (error) {
    console.error("Delete team error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
