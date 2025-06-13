"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Users, Trash2, UserMinus, Crown, Shield, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { successToast, errorToast } from "@/lib/toast-utils"
import { teamApi } from "@/lib/api/teams"
import { workspaceApi } from "@/lib/api" // Import workspaceApi from lib/api

type EditTeamModalProps = {
  isOpen: boolean
  onClose: () => void
  team: any
  onSuccess?: (team: any) => void
  onDelete?: (teamId: string) => void
}

export default function EditTeamModal({ isOpen, onClose, team, onSuccess, onDelete }: EditTeamModalProps) {
  const [formData, setFormData] = useState({
    teamName: "",
    description: "",
  })
  const [members, setMembers] = useState<any>([])
  const [availableUsers, setAvailableUsers] = useState<any>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isOpen && team) {
      setFormData({
        teamName: team.teamName || "",
        description: team.description || "",
      })
      fetchTeamDetails()
      fetchAvailableUsers()
    }
  }, [isOpen, team])

  const fetchTeamDetails = async () => {
    if (!team?.id) return

    setIsLoadingMembers(true)
    try {
      const response = await teamApi.getTeam(team.id)
      if (response.success) {
        setMembers(response.data?.members || [])
      }
    } catch (error) {
      console.error("Failed to fetch team details:", error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const fetchAvailableUsers = async () => {
    try {
      // Using workspaceApi from lib/api instead of direct fetch
      const response = await workspaceApi.getMembers()
      if (response.success && response.data) {
        // Filter out users who are already in the team
        const available = response.data.filter(
          (user: any) => !members.some((member: any) => member.id === user.memberId),
        )
        setAvailableUsers(available)
      }
    } catch (error) {
      console.error("Failed to fetch available users:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.teamName.trim()) return

    setIsLoading(true)
    try {
      // Update team details
      const data = await teamApi.updateTeam(team.id, {
        teamName: formData.teamName,
        description: formData.description,
      })

      if (data.success) {
        // Add new members if any selected
        if (selectedUsers.length > 0) {
          try {
            await teamApi.addTeamMembers(team.id, selectedUsers)
          } catch (memberError) {
            console.error("Failed to add members:", memberError)
            // Continue with success flow even if adding members fails
          }
        }

        successToast({
          title: "Team Updated",
          description: "The team has been successfully updated.",
        })

        onSuccess?.(data.data)
        handleClose()
      } else {
        errorToast({
          title: "Update Failed",
          description: data.error || "Failed to update team. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to update team:", error)
      errorToast({
        title: "Update Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!team?.id) return

    setIsLoading(true)
    try {
      // Using teamApi instead of direct fetch
      const response = await teamApi.deleteTeam(team.id)

      if (response.success) {
        successToast({
          title: "Team Deleted",
          description: "The team has been successfully deleted.",
        })

        onDelete?.(team.id)
        handleClose()
      } else {
        errorToast({
          title: "Delete Failed",
          description: response.error || "Failed to delete team. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to delete team:", error)
      errorToast({
        title: "Delete Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    try {
      // Using teamApi instead of direct fetch
      const response = await teamApi.removeTeamMember(team.id, userId)

      if (response.success) {
        successToast({
          title: "Member Removed",
          description: "The member has been removed from the team.",
        })

        setMembers(members.filter((member: any) => member.id !== userId))
        fetchAvailableUsers() // Refresh available users
      } else {
        errorToast({
          title: "Remove Failed",
          description: response.error || "Failed to remove member. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to remove member:", error)
      errorToast({
        title: "Remove Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    }
  }

  const handleClose = () => {
    setFormData({ teamName: "", description: "" })
    setSelectedUsers([])
    setShowDeleteConfirm(false)
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleUserSelection = (userId: string, checked: boolean) => {
    if (checked) {
      setSelectedUsers((prev) => [...prev, userId])
    } else {
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
    }
  }

  if (!team) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Team</DialogTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleClose} className="p-1 h-8 w-8">
                <X size={16} />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="space-y-6">
            <div className="text-center py-6">
              <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Team</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{team.teamName}&quot;? This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteTeam}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isLoading ? "Deleting..." : "Delete Team"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Details */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="teamName" className="text-medium font-medium text-gray-900">
                  Team Name
                </label>
                <Input
                  id="teamName"
                  value={formData.teamName}
                  onChange={(e) => handleInputChange("teamName", e.target.value)}
                  placeholder="Enter team name"
                  className="w-full"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="description" className="text-medium font-medium text-gray-900">
                  Description (Optional)
                </label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Describe your team..."
                  rows={3}
                  className="w-full resize-none"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Current Members */}
            <div className="space-y-4">
              <h4 className="text-medium font-medium text-gray-900">Current Members</h4>
              <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                {isLoadingMembers ? (
                  <div className="p-4 text-center text-gray-500">Loading members...</div>
                ) : members.length > 0 ? (
                  <div className="divide-y divide-gray-200">
                    {members.map((member: any) => (
                      <div key={member.id} className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                            <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-medium font-medium text-gray-900">{member.username}</p>
                            <p className="text-small text-gray-600">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1">
                            {member.role === "Owner" && <Crown size={14} className="text-yellow-500" />}
                            {member.role === "Admin" && <Shield size={14} className="text-blue-500" />}
                            {(!member.role || member.role === "Member") && <User size={14} className="text-gray-400" />}
                            <Badge
                              variant={member.role === "Owner" ? "default" : "secondary"}
                              className={
                                member.role === "Owner"
                                  ? "bg-yellow-100 text-yellow-700"
                                  : member.role === "Admin"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                              }
                            >
                              {member.role || "Member"}
                            </Badge>
                          </div>
                          {member.role !== "Owner" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveMember(member.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8"
                            >
                              <UserMinus size={14} />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">No members in this team</div>
                )}
              </div>
            </div>

            {/* Add New Members */}
            {availableUsers.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-medium font-medium text-gray-900">Add Members</h4>
                <div className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  <div className="divide-y divide-gray-200">
                    {availableUsers.map((user: any) => (
                      <div key={user.memberId} className="p-3 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profilePictureUrl || "/placeholder.svg"} />
                            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-medium font-medium text-gray-900">{user.username}</p>
                            <p className="text-small text-gray-600">{user.email}</p>
                          </div>
                        </div>
                        <Checkbox
                          checked={selectedUsers.includes(user.memberId)}
                          onCheckedChange={(checked) => handleUserSelection(user.memberId, checked as boolean)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.teamName.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Users size={16} />
                    <span>Update Team</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
