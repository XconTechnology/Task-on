import { type NextRequest, NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";
import { getUserFromRequest } from "@/lib/auth";
import { getCurrentWorkspaceId } from "@/lib/workspace-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: { timerId: string } }
) {
  try {
    const user = getUserFromRequest(request);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { timerId } = params;

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
    const activeTimersCollection = db.collection("activeTimers");
    const timeEntriesCollection = db.collection("timeEntries");

    // Find the active timer
    const activeTimer = await activeTimersCollection.findOne({
      id: timerId,
      userId: user.userId,
    });

    if (!activeTimer) {
      return NextResponse.json(
        { success: false, error: "Active timer not found" },
        { status: 404 }
      );
    }

    const endTime = new Date().toISOString();
    const startTime = new Date(activeTimer.startTime);
    const currentSessionDuration = Math.floor(
      (new Date().getTime() - startTime.getTime()) / 1000
    );

    // Calculate total duration: previous duration + current session
    const previousDuration = activeTimer.previousDuration || 0;
    const totalDuration = previousDuration + currentSessionDuration;

    console.log("Stop Timer Debug:", {
      timerId,
      entryId: activeTimer.entryId,
      previousDuration,
      currentSessionDuration,
      totalDuration,
    });

    if (activeTimer.entryId) {
      // UPDATE existing time entry with accumulated time
      const updateResult = await timeEntriesCollection.updateOne(
        {
          id: activeTimer.entryId,
          userId: user.userId,
          workspaceId: currentWorkspaceId,
        },
        {
          $set: {
            endTime,
            duration: totalDuration, // Store the TOTAL accumulated time
            isRunning: false,
            updatedAt: endTime,
          },
        }
      );

      console.log("Update result:", updateResult);

      if (updateResult.matchedCount === 0) {
        console.error(
          "No time entry found to update with ID:",
          activeTimer.entryId
        );
        return NextResponse.json(
          { success: false, error: "Time entry not found" },
          { status: 404 }
        );
      }

      // Get the updated entry to return
      const updatedEntry = await timeEntriesCollection.findOne({
        id: activeTimer.entryId,
        userId: user.userId,
        workspaceId: currentWorkspaceId,
      });

      // Remove the active timer
      await activeTimersCollection.deleteOne({ id: timerId });

      return NextResponse.json({
        success: true,
        data: updatedEntry,
        message: "Timer stopped successfully",
      });
    } else {
      // CREATE new time entry (fallback case)
      const timeEntry = {
        id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        taskId: activeTimer.taskId,
        taskTitle: activeTimer.taskTitle,
        projectId: activeTimer.projectId,
        projectName: activeTimer.projectName,
        workspaceId: currentWorkspaceId,
        userId: user.userId,
        startTime: activeTimer.startTime,
        endTime,
        duration: totalDuration, // Store total duration even for new entries
        isRunning: false,
        description: activeTimer.description || "",
        createdAt: new Date().toISOString(),
        updatedAt: endTime,
      };

      await timeEntriesCollection.insertOne(timeEntry);
      await activeTimersCollection.deleteOne({ id: timerId });

      return NextResponse.json({
        success: true,
        data: timeEntry,
        message: "Timer stopped successfully",
      });
    }
  } catch (error) {
    console.error("Stop timer error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
