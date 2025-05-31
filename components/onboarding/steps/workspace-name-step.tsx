"use client"

import type React from "react"

import type { OnboardingData } from "@/lib/types"
import { Input } from "@/components/ui/input"

type WorkspaceNameStepProps = {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
}

export default function WorkspaceNameStep({ data, updateData }: WorkspaceNameStepProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateData({ workspaceName: e.target.value })
  }

  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="header-medium mb-4">Lastly,</h1>
        <h1 className="header-medium mb-4">what would you like to</h1>
        <h1 className="header-medium mb-4">name your Workspace?</h1>
      </div>

      <div className="max-w-md mx-auto">
        <Input
          type="text"
          value={data.workspaceName || ""}
          onChange={handleChange}
          placeholder="Enter workspace name"
          className="text-center text-lg h-12 border-2 border-gray-300 focus:border-purple-500"
          maxLength={50}
        />
        <p className="text-description-small text-gray-500 mt-3">Try the name of your company or organization.</p>
      </div>
    </div>
  )
}
