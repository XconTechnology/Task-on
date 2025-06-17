import { NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"

export async function DELETE(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { entryId } = params

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")

    // Delete time entry (only if it belongs to the user)
    const result = await timeEntriesCollection.deleteOne({ id: entryId, userId: user.userId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Time entry not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Time entry deleted successfully",
    })
  } catch (error) {
    console.error("Delete time entry error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const { entryId } = params
    const updates = await request.json()

    const db = await getDatabase()
    const timeEntriesCollection = db.collection("timeEntries")

    // Update time entry (only if it belongs to the user)
    const result = await timeEntriesCollection.updateOne(
      { id: entryId, userId: user.userId },
      {
        $set: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "Time entry not found" }, { status: 404 })
    }

    // Get updated entry
    const updatedEntry = await timeEntriesCollection.findOne({ id: entryId, userId: user.userId })

    return NextResponse.json({
      success: true,
      data: updatedEntry,
      message: "Time entry updated successfully",
    })
  } catch (error) {
    console.error("Update time entry error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
