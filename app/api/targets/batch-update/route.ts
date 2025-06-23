import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { processBatchTargetUpdates } from "@/lib/target-utils"

// POST /api/targets/batch-update - Daily batch job to update target statuses
export async function POST() {
  try {
    // This should be called by a cron job or scheduled task
    // You might want to add authentication for this endpoint

    const db = await getDatabase()
    const targetsCollection = db.collection("targets")

    // Get all active targets that might need status updates
    const activeTargets = await targetsCollection
      .find({
        status: { $in: ["active", "failed"] }, // Include failed in case deadlines were extended
      })
      .toArray()

    if (activeTargets.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No targets to update",
        updatedCount: 0,
      })
    }

    // Process batch updates
    const updates = processBatchTargetUpdates(activeTargets)

    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No status changes needed",
        updatedCount: 0,
      })
    }

    // Apply updates to database
    const bulkOperations = updates.map((update) => ({
      updateOne: {
        filter: { id: update.id },
        update: {
          $set: {
            status: update.newStatus,
            updatedAt: new Date().toISOString(),
            ...(update.newStatus === "completed" ? { completedAt: new Date().toISOString() } : {}),
          },
        },
      },
    }))

    const result = await targetsCollection.bulkWrite(bulkOperations)

    return NextResponse.json({
      success: true,
      message: `Batch update completed: ${result.modifiedCount} targets updated`,
      updatedCount: result.modifiedCount,
      updates: updates.map((u) => ({
        targetId: u.id,
        statusChange: `${u.currentStatus} → ${u.newStatus}`,
        reason: u.reason,
      })),
    })
  } catch (error: any) {
    console.error("Batch update error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Batch update failed",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
