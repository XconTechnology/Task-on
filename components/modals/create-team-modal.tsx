"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { teamApi } from "@/lib/api/teams"
import { successToast, errorToast } from "@/lib/toast-utils"

type CreateTeamModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (team: any) => void
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [formData, setFormData] = useState({
    teamName: "",
    description: "",
  })
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [availableMembers, setAvailableMembers] = useState<any>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMembers, setIsLoadingMembers] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchAvailableMembers()
    }
  }, [isOpen])

  const fetchAvailableMembers = async () => {
    setIsLoadingMembers(true)
    try {
      const response = await fetch("/api/workspace/members")
      const data = await response.json()
      if (data.success) {
        setAvailableMembers(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch members:", error)
    } finally {
      setIsLoadingMembers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.teamName.trim()) return

    setIsLoading(true)
    try {
      const response = await teamApi.createTeam(formData)

      if (response.success) {
        // If members were selected, add them to the team
        if (selectedMembers.length > 0) {
          try {
            await fetch(`/api/teams/${response.data?.id}/members`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ userIds: selectedMembers }),
            })
          } catch (memberError) {
            console.error("Failed to add members:", memberError)
            // Continue with success flow even if adding members fails
          }
        }

        successToast({
          title: "Team Created",
          description: "The team has been successfully created.",
        })

        onSuccess?.(response.data)
        handleClose()
      } else {
        errorToast({
          title: "Team Creation Failed",
          description: response.error || "Failed to create team. Please try again.",
        })
      }
    } catch (error) {
      console.error("Failed to create team:", error)
      errorToast({
        title: "Team Creation Failed",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ teamName: "", description: "" })
    setSelectedMembers([])
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleMember = (memberId: string) => {
    setSelectedMembers((prev) => (prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Create Team</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="p-1 h-8 w-8">
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Team Name */}
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

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-medium font-medium text-gray-900">
              Description (Optional)
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe what this team does..."
              rows={3}
              className="w-full resize-none"
              disabled={isLoading}
            />
          </div>

          {/* Team Members */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-medium font-medium text-gray-900">Add Team Members (Optional)</label>
              <Badge variant="secondary" className="text-small">
                {selectedMembers.length} selected
              </Badge>
            </div>

            {isLoadingMembers ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
                    <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                {availableMembers.length > 0 ? (
                  availableMembers.map((member: any) => (
                    <div
                      key={member.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                        selectedMembers.includes(member.id) ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                    >
                      <Checkbox
                        checked={selectedMembers.includes(member.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            toggleMember(member.id)
                          } else {
                            toggleMember(member.id)
                          }
                        }}
                      />
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={member.profilePictureUrl || "/placeholder.svg"} />
                        <AvatarFallback>{member.username.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-medium font-medium text-gray-900">{member.username}</p>
                        <p className="text-small text-gray-600">{member.email}</p>
                      </div>
                      {member.role && (
                        <Badge
                          variant="secondary"
                          className={
                            member.role === "Owner"
                              ? "bg-yellow-100 text-yellow-700"
                              : member.role === "Admin"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }
                        >
                          {member.role}
                        </Badge>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users size={48} className="mx-auto text-gray-300 mb-4" />
                    <p className="text-description">No members available</p>
                  </div>
                )}
              </div>
            )}

            {selectedMembers.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-small text-blue-700 mb-2">Selected members will be added to this team:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((memberId) => {
                    const member = availableMembers.find((m: any) => m.id === memberId)
                    return (
                      <div
                        key={memberId}
                        className="flex items-center space-x-2 bg-white border border-blue-200 rounded-full px-3 py-1"
                      >
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={"/placeholder.svg"} />
                          <AvatarFallback className="text-extra-small">
                            {member?.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-small text-gray-900">{member?.username}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="p-0 h-4 w-4 text-gray-400 hover:text-red-500"
                          onClick={() => toggleMember(memberId)}
                        >
                          <X size={12} />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              <span className="text-medium">Cancel</span>
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.teamName.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span className="text-medium">Creating...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Users size={16} />
                  <span className="text-medium">Create Team</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
