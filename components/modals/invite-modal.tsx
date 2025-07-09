"use client"

import type React from "react"
import { useState } from "react"
import { X, Users, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { workspaceApi } from "@/lib/api"
import { useUser } from "@/lib/user-context"

type InviteModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

const POSITIONS = [
  "Customer Support",
  "Project Manager",
  "Email Marketer",
  "SEO Specialist",
  "Copywriter / Content Writer",
  "Social Media Marketer",
  "Graphic Designer",
  "UI/UX Designer",
  "Software Developer",
  "Mobile Developer",
]

export default function InviteModal({ isOpen, onClose, onSuccess }: InviteModalProps) {
  const { currentWorkspace } = useUser()
  const [emails, setEmails] = useState("")
  const [role, setRole] = useState("Member")
  const [position, setPosition] = useState("") // New position state
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!emails.trim()) return

    setIsLoading(true)
    try {
      // Parse emails (comma or space separated)
      const emailList = emails
        .split(/[,\s]+/)
        .map((email) => email.trim())
        .filter((email) => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))

      if (emailList.length === 0) {
        alert("Please enter valid email addresses")
        setIsLoading(false)
        return
      }

      // Use current workspace ID if available
      const workspaceId = currentWorkspace?.id

      // Updated to include position in the API call
      const response = await workspaceApi.inviteUsers(emailList, position, role,  workspaceId)

      if (response.success) {
        setResults(response.data || [])
        setEmails("")
        onSuccess?.()
      } else {
        alert(response.error || "Failed to send invitations")
      }
    } catch (error) {
      console.error("Failed to send invitations:", error)
      alert("Failed to send invitations")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setEmails("")
    setRole("Member")
    setPosition("") // Reset position
    setResults([])
    onClose()
  }
      console.log('position', position)

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold text-gray-900">Invite people</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose} className="p-1 h-8 w-8">
              <X size={16} />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email Input */}
          <div className="space-y-2">
            <label htmlFor="emails" className="text-medium font-medium text-gray-900">
              Invite by email
            </label>
            <Input
              id="emails"
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder="Email, comma or space separated"
              className="w-full"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">Inviting to: {currentWorkspace?.name || "Current workspace"}</p>
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <label className="text-medium font-medium text-gray-900">Invite as</label>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <Select value={role} onValueChange={setRole} disabled={isLoading}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-small text-gray-500 mt-1">Can access all public items in your Workspace.</p>
              </div>
            </div>
          </div>

          {/* Position Selection - NEW */}
          <div className="space-y-2">
            <label className="text-medium font-medium text-gray-900">Position (Optional)</label>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Briefcase size={16} className="text-gray-600" />
              </div>
              <div className="flex-1">
                <Select value={position} onValueChange={setPosition} disabled={isLoading}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select position (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No position specified">No position specified</SelectItem>
                    {POSITIONS.map((pos) => (
                      <SelectItem key={pos} value={pos}>
                        {pos}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-small text-gray-500 mt-1">
                  {position ? `Will be assigned as ${position}` : "Position can be set later"}
                </p>
              </div>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-medium font-medium text-gray-900">Invitation Results:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto custom-scrollbar">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`text-small p-2 rounded ${
                      result.status === "invited" || result.status === "added"
                        ? "bg-green-50 text-green-700"
                        : result.status === "already_member"
                          ? "bg-yellow-50 text-yellow-700"
                          : "bg-red-50 text-red-700"
                    }`}
                  >
                    <strong>{result.email}:</strong> {result.message}
                    {result.inviteToken && (
                      <div className="text-extra-small mt-1">Invitation link will be sent via email</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              <span className="text-medium">Cancel</span>
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !emails.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span className="text-medium">Sending...</span>
                </div>
              ) : (
                <span className="text-medium">Send invite</span>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
