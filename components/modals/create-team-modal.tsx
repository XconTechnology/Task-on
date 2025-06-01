"use client"

import type React from "react"

import { useState } from "react"
import { X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { teamApi } from "@/lib/api/teams"

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
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.teamName.trim()) return

    setIsLoading(true)
    try {
      const response = await teamApi.createTeam(formData)

      if (response.success) {
        onSuccess?.(response.data)
        handleClose()
      } else {
        alert(response.error || "Failed to create team")
      }
    } catch (error) {
      console.error("Failed to create team:", error)
      alert("Failed to create team")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ teamName: "", description: "" })
    onClose()
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
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

          {/* Actions */}
          <div className="flex justify-end space-x-3">
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
