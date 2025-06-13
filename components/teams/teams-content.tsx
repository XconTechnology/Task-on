"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Users, Crown, Shield, User, Mail, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import InviteModal from "@/components/modals/invite-modal"
import CreateTeamModal from "@/components/modals/create-team-modal"
import EditTeamModal from "@/components/modals/edit-team-modal"
import { teamApi } from "@/lib/api/teams"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { workspaceApi } from "@/lib/api"
import Link from "next/link"
import type { Team, WorkspaceMember } from "@/lib/types"
import MemberActionsDropdown from "@/components/workspace/member-actions-dropdown"
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

export default function TeamsContent() {
  const { user } = useUser()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<WorkspaceMember[]>([])
  const [isLoadingTeams, setIsLoadingTeams] = useState(true)
  const [isLoadingMembers, setIsLoadingMembers] = useState(true)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState(null)
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false)
  const [workspaceSettings, setWorkspaceSettings] = useState<any>({
    workspaceName: "",
    defaultRole: "Member",
    allowMemberInvites: true,
  })
  const [isLoadingSettings, setIsLoadingSettings] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>("Member")

  // Member role update state
  const [isUpdateRoleDialogOpen, setIsUpdateRoleDialogOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember>()
  const [selectedRole, setSelectedRole] = useState<string>("Member")
  const [isLoading, setIsLoading] = useState(false)

  // Member delete state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    fetchTeams()
    fetchMembers()
    fetchWorkspaceSettings()
  }, [])

  const fetchTeams = async () => {
    try {
      const response = await teamApi.getTeams()
      if (response.success) {
        setTeams(response.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
    } finally {
      setIsLoadingTeams(false)
    }
  }

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

  const fetchWorkspaceSettings = async () => {
    setIsLoadingSettings(true)
    try {
      const data = await workspaceApi.getSettings()
      if (data.success) {
        setWorkspaceSettings(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch workspace settings:", error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoadingSettings(true)
    try {
      const data = await workspaceApi.updateSettings(workspaceSettings)
      if (data.success) {
        toast({
          title: "Settings saved",
          description: "Workspace settings have been updated successfully",
        })
      } else {
        toast({
          title: "Failed to save settings",
          description: data.error || "An error occurred",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      toast({
        title: "Failed to save settings",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const handleEditTeam = (team: any) => {
    setEditingTeam(team)
    setIsEditTeamModalOpen(true)
  }

  const handleTeamCreated = (newTeam: any) => {
    setTeams((prev) => [newTeam, ...prev])
  }

  const handleTeamUpdated = (updatedTeam: any) => {
    setTeams((prev) => prev.map((team: any) => (team.id === updatedTeam.id ? updatedTeam : team)))
  }

  const handleTeamDeleted = (teamId: string) => {
    setTeams((prev) => prev.filter((team: any) => team.id !== teamId))
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

  const filteredTeams = teams.filter((team: any) => team.teamName.toLowerCase().includes(searchQuery.toLowerCase()))

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

  return (
    <>
      <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="header-large">Teams</h1>
            <p className="text-description mt-1">Manage your teams and collaborate with members.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setIsInviteModalOpen(true)}>
              <Mail size={16} className="mr-2" />
              <span className="text-medium">Invite Members</span>
            </Button>
            <Button className=" " onClick={() => setIsCreateTeamModalOpen(true)}>
              <Plus size={16} className="mr-2" />
              <span className="text-sm">Create Team</span>
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
        <Tabs defaultValue="teams" className="space-y-6">
          <TabsList className="bg-white">
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="members">All Members</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="teams" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingTeams ? (
                // Skeleton loading for teams
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="bg-white shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-4 w-48" />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredTeams.length > 0 ? (
                filteredTeams.map((team: any) => (
                  <Card
                    key={team.id}
                    className="bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-gradient-to-r from-green-600 to-emerald-300 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">{team.teamName.charAt(0)}</span>
                          </div>
                          <div>
                            <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors">
                              {team.teamName}
                            </CardTitle>
                            <p className="text-description">{team.description || "No description"}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditTeam(team)}
                        >
                          <Settings size={16} />
                        </Button>
                      </div>
                    </CardHeader>
                    <Link href={`/chat/${team.id}`}>
                      <CardContent className="pt-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Users size={14} className="text-gray-400" />
                              <span className="text-small text-gray-600">{team.memberCount || 0} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Settings size={14} className="text-gray-400" />
                              <span className="text-small text-gray-600">0 projects</span>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-700">
                            Active
                          </Badge>
                        </div>
                      </CardContent>
                    </Link>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <Users size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="header-small mb-2">No teams found</h3>
                  <p className="text-description mb-4">Create your first team to get started.</p>
                  <Button className="bg-primary hover:bg-bg_hovered" onClick={() => setIsCreateTeamModalOpen(true)}>
                    <Plus size={16} className="mr-2" />
                    <span className="text-medium text-white">Create Team</span>
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
                <p className="text-description">Manage your workspace members and their permissions.</p>
              </div>
              <div className="divide-y divide-gray-200">
                {isLoadingMembers ? (
                  // Skeleton loading for members
                  Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right space-y-2">
                            <Skeleton className="h-5 w-16" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </div>
                    </div>
                  ))
                ) : filteredMembers.length > 0 ? (
                  filteredMembers.map((member: any) => (
                    <div key={member.memberId} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                              <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-green-500" />
                          </div>
                          <div>
                            <h4 className="text-medium font-semibold text-gray-900">{member.username}</h4>
                            <p className="text-small text-gray-600">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
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

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Team Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-label mb-2">Workspace Name</h4>
                  <Input
                    value={workspaceSettings.workspaceName}
                    onChange={(e) =>
                      setWorkspaceSettings((prev: any) => ({
                        ...prev,
                        workspaceName: e.target.value,
                      }))
                    }
                    disabled={isLoadingSettings}
                  />
                </div>
                <div>
                  <h4 className="text-label mb-2">Default Role for New Members</h4>
                  <Select
                    value={workspaceSettings.defaultRole}
                    onValueChange={(value) =>
                      setWorkspaceSettings((prev: any) => ({
                        ...prev,
                        defaultRole: value,
                      }))
                    }
                    disabled={isLoadingSettings}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Member">Member</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-label">Allow members to invite others</h4>
                    <p className="text-description-small">Members can send invitations to join the workspace</p>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={workspaceSettings.allowMemberInvites}
                    onChange={(e) =>
                      setWorkspaceSettings((prev: any) => ({
                        ...prev,
                        allowMemberInvites: e.target.checked,
                      }))
                    }
                    disabled={isLoadingSettings}
                  />
                </div>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={handleSaveSettings}
                  disabled={isLoadingSettings}
                >
                  {isLoadingSettings ? "Saving..." : "Save Changes"}
                </Button>
              </CardContent>
            </Card>
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
              <AvatarImage src={ "/placeholder.svg"} />
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

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={handleInviteSuccess}
      />
      <CreateTeamModal
        isOpen={isCreateTeamModalOpen}
        onClose={() => setIsCreateTeamModalOpen(false)}
        onSuccess={handleTeamCreated}
      />
      <EditTeamModal
        isOpen={isEditTeamModalOpen}
        onClose={() => setIsEditTeamModalOpen(false)}
        team={editingTeam}
        onSuccess={handleTeamUpdated}
        onDelete={handleTeamDeleted}
      />
    </>
  )
}
