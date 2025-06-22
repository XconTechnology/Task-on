"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, FolderOpen, Calendar, Trash2, Users, User, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { projectApi, workspaceApi } from "@/lib/api"
import { successToast, errorToast } from "@/lib/toast-utils"
import type { Team } from "@/lib/types"
import { teamApi } from "@/lib/api/teams"

type EditProjectModalProps = {
  isOpen: boolean
  onClose: () => void
  project: any
  onSuccess?: (project: any) => void
  onDelete?: (projectId: string) => void
}

export default function EditProjectModal({ isOpen, onClose, project, onSuccess, onDelete }: EditProjectModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    teamId: "none",
    assignedMembers: [] as string[],
    status: "ongoing",
  })
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [assignmentType, setAssignmentType] = useState<"team" | "members">("team")

  useEffect(() => {
    if (isOpen && project) {
      // Determine assignment type based on existing data
      const hasMembers = project.assignedMembers && project.assignedMembers.length > 0

      setFormData({
        name: project.name || "",
        description: project.description || "",
        startDate: project.startDate || "",
        endDate: project.endDate || "",
        teamId: project.teamId || "none",
        assignedMembers: project.assignedMembers || [],
        status: project.status || "ongoing",
      })

      // Set assignment type based on existing data
      if (hasMembers) {
        setAssignmentType("members")
      } else {
        setAssignmentType("team")
      }

      fetchTeams()
      fetchMembers()
    }
  }, [isOpen, project])

  const fetchTeams = async () => {
    setIsLoadingTeams(true)
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
    setIsLoadingMembers(true)
    try {
      const response = await workspaceApi.getMembers()
      if (response.success) {
        setMembers(response.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    setIsLoading(true)
    try {
      const projectData: any = {
        ...formData,
        // Only include teamId if assignment type is team
        teamId: assignmentType === "team" ? formData.teamId : "none",
        // Only include assignedMembers if assignment type is members and there are selected members
        assignedMembers: assignmentType === "members" ? formData.assignedMembers : [],
      }

      const response = await projectApi.updateProject(project.id, projectData)

      if (response.success) {
        successToast({
          title: "Project Updated",
          description: "The project has been successfully updated.",
        })
        onSuccess?.(response.data)
        handleClose()
      } else {
        errorToast({
          title: "Update Failed",
          description: response.error || "Failed to update project. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to update project:", error)
      errorToast({
        title: "Update Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteProject = async () => {
    if (!project?.id) return

    setIsLoading(true)
    try {
      const response = await projectApi.deleteProject(project.id)

      if (response.success) {
        successToast({
          title: "Project Deleted",
          description: "The project has been successfully deleted.",
        })
        onDelete?.(project.id)
        handleClose()
      } else {
        errorToast({
          title: "Delete Failed",
          description: response.error || "Failed to delete project. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to delete project:", error)
      errorToast({
        title: "Delete Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      startDate: "",
      endDate: "",
      teamId: "none",
      assignedMembers: [],
      status: "ongoing",
    })
    setShowDeleteConfirm(false)
    setAssignmentType("team")
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleMemberAssignment = (memberId: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberId)
        ? prev.assignedMembers.filter((id) => id !== memberId)
        : [...prev.assignedMembers, memberId],
    }))
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const getSelectedMembersInfo = () => {
    const selectedMembers = members.filter((member) => formData.assignedMembers.includes(member.memberId))
    return selectedMembers
  }

  if (!project) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Edit Project</DialogTitle>
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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Project</h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to delete &quot;{project.name}&quot;? This will also delete all associated tasks.
                This action cannot be undone.
              </p>
              <div className="flex justify-center space-x-3">
                <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteProject}
                  disabled={isLoading}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  {isLoading ? "Deleting..." : "Delete Project"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {/* Project Name */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-medium font-medium text-gray-900">
                Project Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter project name"
                className="w-full"
                disabled={isLoading}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="text-medium font-medium text-gray-900">
                Description (Optional)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder="Describe your project..."
                rows={3}
                className="w-full resize-none"
                disabled={isLoading}
              />
            </div>

            {/* Project Status */}
            <div className="space-y-2">
              <label className="text-medium font-medium text-gray-900">Project Status</label>
              <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                <SelectTrigger className="w-full" disabled={isLoading}>
                  <SelectValue placeholder="Select project status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ongoing">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span>Ongoing</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="completed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span>Completed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="delayed">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span>Delayed</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="archived">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                      <span>Archived</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assignment Type Selection */}
            <div className="space-y-4">
              <label className="text-medium font-medium text-gray-900">Assignment</label>
              <Tabs value={assignmentType} onValueChange={(value) => setAssignmentType(value as "team" | "members")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="team" className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Assign to Team
                  </TabsTrigger>
                  <TabsTrigger value="members" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Assign to Members
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="team" className="space-y-2 mt-4">
                  <Select value={formData.teamId} onValueChange={(value) => handleInputChange("teamId", value)}>
                    <SelectTrigger className="w-full" disabled={isLoadingTeams || isLoading}>
                      <SelectValue placeholder={isLoadingTeams ? "Loading teams..." : "Select a team"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No team</SelectItem>
                      {teams.map((team: any) => (
                        <SelectItem key={team.id} value={team.id}>
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            {team.teamName}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TabsContent>

                <TabsContent value="members" className="space-y-4 mt-4">
                  {/* Selected Members Summary */}
                  {formData.assignedMembers.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">
                          {formData.assignedMembers.length} member(s) selected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {getSelectedMembersInfo().map((member) => (
                          <Badge key={member.memberId} variant="secondary" className="bg-blue-100 text-blue-800">
                            {member.username}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Members List */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Select Members</label>
                    <ScrollArea className="h-48 border rounded-lg p-2">
                      {isLoadingMembers ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        </div>
                      ) : members.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No members found</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {members.map((member) => (
                            <div
                              key={member.memberId}
                              onClick={() => toggleMemberAssignment(member.memberId)}
                              className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                formData.assignedMembers.includes(member.memberId)
                                  ? "bg-blue-50 border-2 border-blue-200 shadow-sm"
                                  : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-200"
                              }`}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                                <AvatarFallback className="text-xs font-medium bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                                  {getInitials(member.username)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{member.username}</p>
                                <p className="text-xs text-gray-500 truncate">{member.email}</p>
                              </div>
                              {formData.assignedMembers.includes(member.memberId) && (
                                <div className="flex-shrink-0">
                                  <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="startDate" className="text-medium font-medium text-gray-900">
                  Start Date
                </label>
                <div className="relative">
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="endDate" className="text-medium font-medium text-gray-900">
                  End Date
                </label>
                <div className="relative">
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange("endDate", e.target.value)}
                    className="w-full"
                    disabled={isLoading}
                    min={formData.startDate}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                    size={16}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formData.name.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Updating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <FolderOpen size={16} />
                    <span>Update Project</span>
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
