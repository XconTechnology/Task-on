import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { getCurrentWorkspaceId } from "@/lib/workspace-utils";

export async function POST(
  request,
  { params }
) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { entryId } = params;

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
    const timeEntriesCollection = db.collection("timeEntries");
    const activeTimersCollection = db.collection("activeTimers");

    // Find the time entry to resume
    const timeEntry = await timeEntriesCollection.findOne({
      id: entryId,
      userId: user.userId,
      workspaceId: currentWorkspaceId,
    });

    if (!timeEntry) {
      return NextResponse.json(
        { success: false, error: "Time entry not found" },
        { status: 404 }
      );
    }

    // Stop any existing active timer for this user first
    const existingTimer = await activeTimersCollection.findOne({
      userId: user.userId,
    });
    if (existingTimer) {
      // Stop the existing timer by updating its corresponding time entry
      const endTime = new Date().toISOString();
      const startTime = new Date(existingTimer.startTime);
      const sessionDuration = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000
      );

      // Find and update the existing timer's entry
      if (existingTimer.entryId) {
        const existingEntry = await timeEntriesCollection.findOne({
          id: existingTimer.entryId,
        });
        if (existingEntry) {
          const newTotalDuration =
            (existingEntry.duration || 0) + sessionDuration;
          await timeEntriesCollection.updateOne(
            { id: existingTimer.entryId },
            {
              $set: {
                duration: newTotalDuration,
                endTime,
                isRunning: false,
                updatedAt: endTime,
              },
            }
          );
        }
      } else {
        // Create new entry for the existing timer
        const completedEntry = {
          id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskId: existingTimer.taskId,
          taskTitle: existingTimer.taskTitle,
          projectId: existingTimer.projectId,
          projectName: existingTimer.projectName,
          workspaceId: existingTimer.workspaceId,
          userId: user.userId,
          startTime: existingTimer.startTime,
          endTime,
          duration: sessionDuration,
          isRunning: false,
          description: existingTimer.description || "",
          createdAt: new Date().toISOString(),
          updatedAt: endTime,
        };
        await timeEntriesCollection.insertOne(completedEntry);
      }

      await activeTimersCollection.deleteOne({ userId: user.userId });
    }

    // UPDATE the existing time entry to make it active again
    const resumeTime = new Date().toISOString();

    // Keep the accumulated duration - don't reset it!
    await timeEntriesCollection.updateOne(
      { id: entryId, userId: user.userId, workspaceId: currentWorkspaceId },
      {
        $set: {
          isRunning: true,
          resumedAt: resumeTime,
          updatedAt: resumeTime,
          // Keep existing duration - don't reset it
        },
      }
    );

    // Create active timer that references the existing entry
    const activeTimer = {
      id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      entryId: timeEntry.id, // Reference to the original entry
      taskId: timeEntry.taskId,
      taskTitle: timeEntry.taskTitle,
      projectId: timeEntry.projectId,
      projectName: timeEntry.projectName,
      workspaceId: currentWorkspaceId,
      userId: user.userId,
      startTime: resumeTime, // New start time for this session
      elapsedTime: 0, // This session's elapsed time starts at 0
      previousDuration: timeEntry.duration || 0, // Store previous accumulated time
      description: timeEntry.description || "",
      createdAt: resumeTime,
    };

    await activeTimersCollection.insertOne(activeTimer);

    return NextResponse.json({
      success: true,
      data: activeTimer,
      message: "Timer resumed successfully",
    });
  } catch (error) {
    console.error("Resume timer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
