import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { getUserFromRequest } from "@/lib/auth"
import { canUserPerformAction, getUserRole } from "@/lib/permissions"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { role, username, email } = body

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get current user's role
    const currentUserData = await usersCollection.findOne({ id: user.userId })
    const currentUserRole = getUserRole(currentUserData?.role)

    // Get target user
    const targetUser = await usersCollection.findOne({ id: params.id })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check permissions for role change
    if (role && role !== targetUser.role) {
      if (!canUserPerformAction(currentUserRole, "user", "role_change")) {
        return NextResponse.json({ success: false, error: "Insufficient permissions to change roles" }, { status: 403 })
      }

      // Prevent changing owner role unless you are the owner
      if (targetUser.role === "Owner" && currentUserRole !== "Owner") {
        return NextResponse.json({ success: false, error: "Cannot change owner role" }, { status: 403 })
      }

      // Prevent making someone owner unless you are the owner
      if (role === "Owner" && currentUserRole !== "Owner") {
        return NextResponse.json({ success: false, error: "Only owners can assign owner role" }, { status: 403 })
      }
    }

    // Check permissions for general user update
    if (!canUserPerformAction(currentUserRole, "user", "update")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Build update object
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (role && role !== targetUser.role) {
      updateData.role = role
    }

    if (username && username !== targetUser.username) {
      updateData.username = username
    }

    if (email && email !== targetUser.email) {
      updateData.email = email.toLowerCase()
    }

    // Update user
    const updatedUser = await usersCollection.findOneAndUpdate(
      { id: params.id },
      { $set: updateData },
      { returnDocument: "after" },
    )

    if (!updatedUser?.value) {
      return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 })
    }

    // Remove password from response
    const { password: _, ...userResponse } = updatedUser.value

    return NextResponse.json({
      success: true,
      data: userResponse,
      message: "User updated successfully",
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = getUserFromRequest(request)

    if (!user) {
      return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
    }

    const db = await getDatabase()
    const usersCollection = db.collection("users")

    // Get current user's role
    const currentUserData = await usersCollection.findOne({ id: user.userId })
    const currentUserRole = getUserRole(currentUserData?.role)

    if (!canUserPerformAction(currentUserRole, "user", "delete")) {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 })
    }

    // Get target user
    const targetUser = await usersCollection.findOne({ id: params.id })
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Prevent deleting owner
    if (targetUser.role === "Owner") {
      return NextResponse.json({ success: false, error: "Cannot delete workspace owner" }, { status: 403 })
    }

    // Prevent self-deletion
    if (params.id === user.userId) {
      return NextResponse.json({ success: false, error: "Cannot delete yourself" }, { status: 403 })
    }

    // Delete user
    await usersCollection.deleteOne({ id: params.id })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
