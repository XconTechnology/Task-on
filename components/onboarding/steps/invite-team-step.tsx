"use client"

import type React from "react"

import { useState } from "react"
import type { OnboardingData } from "@/lib/types"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X, Plus } from "lucide-react"

type InviteTeamStepProps = {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
}

export default function InviteTeamStep({ data, updateData }: InviteTeamStepProps) {
  const [emailInput, setEmailInput] = useState("")

  const handleAddEmail = () => {
    if (emailInput.trim() && isValidEmail(emailInput)) {
      const currentEmails = data.invitedEmails || []
      if (!currentEmails.includes(emailInput.trim())) {
        updateData({ invitedEmails: [...currentEmails, emailInput.trim()] })
      }
      setEmailInput("")
    }
  }

  const handleRemoveEmail = (emailToRemove: string) => {
    const currentEmails = data.invitedEmails || []
    updateData({ invitedEmails: currentEmails.filter((email) => email !== emailToRemove) })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddEmail()
    }
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="header-medium mb-4">Invite people to your</h1>
        <h1 className="header-medium mb-4">Workspace:</h1>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="flex space-x-2">
          <Input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter email addresses (or paste multiple)"
            className="flex-1"
          />
          <Button
            onClick={handleAddEmail}
            disabled={!emailInput.trim() || !isValidEmail(emailInput)}
            variant="outline"
            size="sm"
          >
            <Plus size={16} />
          </Button>
        </div>

        {data.invitedEmails && data.invitedEmails.length > 0 && (
          <div className="space-y-2">
            <p className="text-label">Invited emails:</p>
            <div className="space-y-2">
              {data.invitedEmails.map((email, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-medium">{email}</span>
                  <button
                    onClick={() => handleRemoveEmail(email)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-description-small text-gray-500">You can skip this step and invite people later.</p>
      </div>
    </div>
  )
}
