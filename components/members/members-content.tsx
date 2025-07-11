"use client"

import { useState, useEffect } from "react"
import { Search, Users, Crown, Shield, User, Mail, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import InviteModal from "@/components/modals/invite-modal"
import SalaryModal from "@/components/modals/salary-modal"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { workspaceApi } from "@/lib/api"
import Link from "next/link"
import type { WorkspaceMember } from "@/lib/types"
import { useUser } from "@/lib/user-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { AlertTriangle, Check, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import MemberActionsDropdown from "../workspace/member-actions-dropdown"

export default function MembersContent() {
  const { user } = useUser()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>("Member")

  // Member role update state
  const [isUpdateRoleDialogOpen, setIsUpdateRoleDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember>()
  const [selectedRole, setSelectedRole] = useState<string>("Member")
  const [isLoading, setIsLoading] = useState(false)

  // Member delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  // Salary modal state
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const data = await workspaceApi.getMembers()
      if (data.success) {
        setMembers(data.data || [])
        // Find current user's role
        if (user && data.data) {
          const currentMember = data.data.find((member: any) => member.memberId === user.id)
          if (currentMember) {
            setCurrentUserRole(currentMember.role || "Member")
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleInviteSuccess = () => {
    fetchMembers() // Refresh members list
  }

  // Handle opening the update role dialog
  const handleUpdateRole = (member: WorkspaceMember) => {
    setSelectedMember(member)
    setSelectedRole(member.role || "Member")
    setIsUpdateRoleDialogOpen(true)
  }

  // Handle opening the salary modal
  const handleUpdateSalary = (member: WorkspaceMember) => {
    setSelectedMember(member)
    setIsSalaryModalOpen(true)
  }

  // Handle opening the delete member dialog
  const handleRemoveMember = (member: WorkspaceMember) => {
    setSelectedMember(member)
    setIsDeleteDialogOpen(true)
  }

  // Handle saving the role update
  const handleSaveRoleUpdate = async () => {
    if (!selectedMember || selectedRole === selectedMember.role) {
      setIsUpdateRoleDialogOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await workspaceApi.updateMemberRole(selectedMember.memberId, selectedRole)
      if (response.success) {
        toast({
          title: "Role updated",
          description: `${selectedMember.username}'s role has been updated to ${selectedRole}`,
          variant: "default",
        })
        fetchMembers() // Refresh the members list
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

  // Handle confirming member removal
  const handleConfirmRemoveMember = async () => {
    if (!selectedMember) {
      setIsDeleteDialogOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await workspaceApi.removeMember(selectedMember.memberId)
      if (response.success) {
        toast({
          title: "Member removed",
          description: `${selectedMember.username} has been removed from the workspace`,
          variant: "default",
        })
        fetchMembers() // Refresh the members list
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

  const filteredMembers = members?.filter(
    (member: any) =>
      member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Role icons mapping
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "Owner":
        return <Crown size={14} className="text-yellow-500" />
      case "Admin":
        return <Shield size={14} className="text-blue-500" />
      default:
        return <User size={14} className="text-gray-400" />
    }
  }

  // Role badge styling
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case "Owner":
        return "bg-yellow-100 text-yellow-700"
      case "Admin":
        return "bg-blue-100 text-blue-700"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  // Check if current user can see salaries
  const canViewSalaries = currentUserRole === "Owner" || currentUserRole === "Admin"

  // Format salary display
   const formatSalarySymbol = (salary: any) => {
    if (!salary) return "$"
    const currencySymbols: { [key: string]: string } = {
      USD: "$",
      PKR: "RS",
      EUR: "€",
      GBP: "£",
      CAD: "C$",
      AUD: "A$",
      JPY: "¥",
    }
    const symbol = currencySymbols[salary.currency] || salary.currency
    return `${symbol}`
  }

  const formatSalary = (salary: any) => {
    if (!salary) return "Not set"
    return `${salary.amount.toLocaleString()}`
  }

  return (
    <>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between ">
          <div>
            <h1 className="header-large">Workspace Members</h1>
            <p className="text-description mt-1">Manage your workspace members and their permissions.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
              <Mail size={16} className="mr-2" />
              <span className="text-medium">Invite Members</span>
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Search teams or members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="members" className="space-y-6">
          <TabsContent value="members" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Table Header */}
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700">
                  <div className="col-span-4">Person</div>
                  <div className="col-span-3">Email</div>
                  {canViewSalaries && <div className="col-span-2">Salary</div>}
                  <div className={canViewSalaries ? "col-span-2" : "col-span-4"}>Role</div>
                  <div className="col-span-1"></div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {isLoadingMembers ? (
                  // Skeleton loading for members
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-6 py-4">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                          </div>
                        </div>
                        <div className="col-span-3">
                          <Skeleton className="h-4 w-48" />
                        </div>
                        {canViewSalaries && (
                          <div className="col-span-2">
                            <Skeleton className="h-4 w-20" />
                          </div>
                        )}
                        <div className={canViewSalaries ? "col-span-2" : "col-span-4"}>
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="col-span-1">
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member: any) => (
                    <div key={member.memberId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Person */}
                        <div className="col-span-4">
                          <Link href={`/profile/${member.memberId}`}>
                            <div className="flex items-center space-x-3 cursor-pointer">
                              <div className="relative">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                    {member.username.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
                              </div>
                              <div>
                                <h4 className="text-medium font-semibold text-gray-900">{member.username}</h4>
                              </div>
                            </div>
                          </Link>
                        </div>

                        {/* Email */}
                        <div className="col-span-3">
                          <p className="text-medium text-gray-600">{member.email}</p>
                        </div>

                        {/* Salary (only visible to admins/owners) */}
                        {canViewSalaries && (
                          <div className="col-span-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-green-600">{formatSalarySymbol(member.salary)}</span>
                              <span className="text-sm font-medium text-gray-900">{formatSalary(member.salary)}</span>
                            </div>
                            {member.salary && (
                              <p className="text-small text-gray-500 mt-1">
                                Updated {new Date(member.salary.lastUpdated).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Role */}
                        <div className={canViewSalaries ? "col-span-2" : "col-span-4"}>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(member.role)}
                            <Badge variant="secondary" className={getRoleBadgeClass(member.role)}>
                              {member.role || "Member"}
                            </Badge>
                          </div>
                          <p className="text-small text-gray-500 mt-1">
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="col-span-1 flex items-center justify-end space-x-2">
                          {/* Salary Button (only for admins/owners) */}
                          {canViewSalaries && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleUpdateSalary(member)}
                              className="h-8 w-8 p-0 hover:bg-green-100"
                            >
                              <DollarSign size={14} className="text-green-600" />
                            </Button>
                          )}

                          {/* Member Actions Dropdown */}
                          <MemberActionsDropdown
                            member={member}
                            currentUserRole={currentUserRole}
                            currentUserId={user?.id || ""}
                            onUpdateRole={handleUpdateRole}
                            onRemoveMember={handleRemoveMember}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="header-small mb-2">No members found</h3>
                    <p className="text-description mb-4">Invite people to join your workspace.</p>
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsInviteModalOpen(true)}>
                      <Mail size={16} className="mr-2" />
                      <span className="text-medium text-white">Invite Members</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Update Role Dialog */}
      <Dialog open={isUpdateRoleDialogOpen} onOpenChange={setIsUpdateRoleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Member Role</DialogTitle>
            <DialogDescription>Change the role for {selectedMember?.username}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-4 py-4">
            <Avatar className="h-10 w-10">
              <AvatarImage src={selectedMember?.profilePictureUrl || "/placeholder.svg"} />
              <AvatarFallback>{selectedMember?.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{selectedMember?.username}</p>
              <p className="text-sm text-gray-500">{selectedMember?.email}</p>
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
            <Button
              onClick={handleSaveRoleUpdate}
              disabled={isLoading || (selectedMember && selectedRole === selectedMember.role)}
            >
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
              Are you sure you want to remove {selectedMember?.username} from this workspace?
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
            <Button variant="destructive" onClick={handleConfirmRemoveMember} disabled={isLoading}>
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

      {/* Salary Modal */}
      <SalaryModal
        isOpen={isSalaryModalOpen}
        onClose={() => setIsSalaryModalOpen(false)}
        member={selectedMember}
        onSuccess={fetchMembers}
      />

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />
    </>
  )
}
