import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { getCurrentWorkspaceId } from "@/lib/workspace-utils";

export async function POST(request: NextRequest) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { taskId, description } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { success: false, error: "Task ID is required" },
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
    const tasksCollection = db.collection("tasks");
    const timeEntriesCollection = db.collection("timeEntries");
    const activeTimersCollection = db.collection("activeTimers");
    const task = await tasksCollection.findOne({
      id: taskId,
      workspaceId: currentWorkspaceId,
    });
    // Get task details

    if (!task) {
      return NextResponse.json(
        { success: false, error: "Task not found" },
        { status: 404 }
      );
    }

    // Stop any existing active timer for this user
    const existingTimer = await activeTimersCollection.findOne({
      userId: user.userId,
    });
    if (existingTimer) {
      // Stop the existing timer by creating a time entry
      const endTime = new Date().toISOString();
      const startTime = new Date(existingTimer.startTime);
      const duration = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000
      );

      const timeEntry = {
        id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        taskId: existingTimer.taskId,
        taskTitle: existingTimer.taskTitle,
        projectId: existingTimer.projectId,
        projectName: existingTimer.projectName,
        workspaceId: existingTimer.workspaceId,
        userId: user.userId,
        startTime: existingTimer.startTime,
        endTime,
        duration,
        isRunning: false,
        description: existingTimer.description || "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await timeEntriesCollection.insertOne(timeEntry);
      await activeTimersCollection.deleteOne({ userId: user.userId });
    }

    // Create new active timer
    const activeTimer = {
      id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      taskId: task.id,
      taskTitle: task.title,
      projectId: task.projectId,
      projectName: task.projectName || "Unknown Project",
      workspaceId: currentWorkspaceId,
      userId: user.userId,
      startTime: new Date().toISOString(),
      elapsedTime: 0,
      description: description || "",
      createdAt: new Date().toISOString(),
    };

    await activeTimersCollection.insertOne(activeTimer);

    return NextResponse.json({
      success: true,
      data: activeTimer,
      message: "Timer started successfully",
    });
  } catch (error) {
    console.error("Start timer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
