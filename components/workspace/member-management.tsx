"use client"

import { useState } from "react"
import { MoreHorizontal, User, Shield, Crown, Trash2, UserCog, AlertTriangle, Check } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { workspaceApi } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface MemberManagementProps {
  member: any
  currentUserRole: string
  currentUserId: string
  onMemberUpdated: () => void
}

export default function MemberManagement({
  member,
  currentUserRole,
  currentUserId,
  onMemberUpdated,
}: MemberManagementProps) {
  const { toast } = useToast()
  const [isUpdateRoleDialogOpen, setIsUpdateRoleDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState(member.role || "Member")
  const [isLoading, setIsLoading] = useState(false)

  // Check permissions
  const canManageMember = currentUserRole === "Owner" || (currentUserRole === "Admin" && member.role !== "Owner")

  const isCurrentUser = member.memberId === currentUserId

  // Role icons mapping
  const roleIcons = {
    Owner: <Crown className="h-4 w-4 text-yellow-500" />,
    Admin: <Shield className="h-4 w-4 text-blue-500" />,
    Member: <User className="h-4 w-4 text-gray-500" />,
  }

  // Role colors mapping
  const roleColors = {
    Owner: "bg-yellow-100 text-yellow-700",
    Admin: "bg-blue-100 text-blue-700",
    Member: "bg-gray-100 text-gray-700",
  }

  const handleUpdateRole = async () => {
    if (selectedRole === member.role) {
      setIsUpdateRoleDialogOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await workspaceApi.updateMemberRole(member.memberId, selectedRole)

      if (response.success) {
        toast({
          title: "Role updated",
          description: `${member.username}'s role has been updated to ${selectedRole}`,
          variant: "default",
        })
        onMemberUpdated()
      } else {
        toast({
          title: "Failed to update role",
          description: response.error || "An error occurred while updating the role",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to update role:", error)
      toast({
        title: "Failed to update role",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsUpdateRoleDialogOpen(false)
    }
  }

  const handleRemoveMember = async () => {
    setIsLoading(true)
    try {
      const response = await workspaceApi.removeMember(member.memberId)

      if (response.success) {
        toast({
          title: "Member removed",
          description: `${member.username} has been removed from the workspace`,
          variant: "default",
        })
        onMemberUpdated()
      } else {
        toast({
          title: "Failed to remove member",
          description: response.error || "An error occurred while removing the member",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to remove member:", error)
      toast({
        title: "Failed to remove member",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsDeleteDialogOpen(false)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={!canManageMember || isCurrentUser}>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal size={16} />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => setIsUpdateRoleDialogOpen(true)}
            disabled={member.role === "Owner" && currentUserRole !== "Owner"}
            className="cursor-pointer"
          >
            <UserCog className="mr-2 h-4 w-4" />
            <span>Change Role</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={member.role === "Owner" && currentUserRole !== "Owner"}
            className="cursor-pointer text-red-600 focus:text-red-600"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Remove from Workspace</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Update Role Dialog */}
      <Dialog open={isUpdateRoleDialogOpen} onOpenChange={setIsUpdateRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Member Role</DialogTitle>
            <DialogDescription>Change the role for {member.username}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-4 py-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
              <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{member.username}</p>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Role</label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentUserRole === "Owner" && (
                    <SelectItem value="Owner" className="flex items-center">
                      <div className="flex items-center">
                        <Crown className="mr-2 h-4 w-4 text-yellow-500" />
                        <span>Owner</span>
                      </div>
                    </SelectItem>
                  )}
                  <SelectItem value="Admin">
                    <div className="flex items-center">
                      <Shield className="mr-2 h-4 w-4 text-blue-500" />
                      <span>Admin</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="Member">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4 text-gray-500" />
                      <span>Member</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-amber-50 p-3 rounded-md border border-amber-200">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Role permissions:</p>
                  <ul className="text-xs text-amber-700 mt-1 space-y-1">
                    <li>
                      <strong>Owner:</strong> Full control over workspace, can delete workspace
                    </li>
                    <li>
                      <strong>Admin:</strong> Can manage members and projects
                    </li>
                    <li>
                      <strong>Member:</strong> Can view and contribute to projects
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateRoleDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRole} disabled={isLoading || selectedRole === member.role}>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Updating...</span>
                </div>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  <span>Update Role</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {member.username} from this workspace?
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-4 rounded-md border border-red-200 my-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">This action cannot be undone</p>
                <p className="text-xs text-red-700 mt-1">
                  The member will lose access to all projects and resources in this workspace.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemoveMember} disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span>Removing...</span>
                </div>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Remove Member</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
