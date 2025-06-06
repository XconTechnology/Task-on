import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { canUserPerformAction, getUserRole } from "@/lib/permissions";

export async function POST(request, context) {
  const { id } = context.params;

  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { userIds } = body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ success: false, error: "User IDs are required" }, { status: 400 });
    }

    const db = await getDatabase();
    const teamsCollection = db.collection("teams");
    const usersCollection = db.collection("users");

    const userData = await usersCollection.findOne({ id: user.userId });
    const userRole = getUserRole(userData?.role);

    if (!canUserPerformAction(userRole, "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const team = await teamsCollection.findOne({ id: id });
    if (!team) {
      return NextResponse.json({ success: false, error: "Team not found" }, { status: 404 });
    }

    await usersCollection.updateMany(
      {
        id: { $in: userIds },
        workspaceId: userData?.workspaceId,
      },
      {
        $addToSet: { teamIds: id },
        $set: { updatedAt: new Date().toISOString() },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Members added to team successfully",
    });
  } catch (error) {
    console.error("Add team members error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  const { id } = context.params;

  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    }

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const usersCollection = db.collection("users");

    const userData = await usersCollection.findOne({ id: user.userId });
    const userRole = getUserRole(userData?.role);

    if (!canUserPerformAction(userRole, "team", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    await usersCollection.updateOne(
      { id: userId },
      {
        $pull: { teamIds: id },
        $set: { updatedAt: new Date().toISOString() },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Member removed from team successfully",
    });
  } catch (error) {
    console.error("Remove team member error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
