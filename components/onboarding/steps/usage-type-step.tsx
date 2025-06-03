"use client"

import { Briefcase, User, GraduationCap } from "lucide-react"
import type { OnboardingData } from "@/lib/types"

type UsageTypeStepProps = {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
}

const usageOptions = [
  {
    id: "work",
    name: "Work",
    description: "For professional teams and organizations",
    icon: Briefcase,
  },
  {
    id: "personal",
    name: "Personal",
    description: "For individual projects and personal use",
    icon: User,
  },
  {
    id: "school",
    name: "School",
    description: "For educational projects and assignments",
    icon: GraduationCap,
  },
]

export default function UsageTypeStep({ data, updateData }: UsageTypeStepProps) {
  const handleSelect = (usageType: string) => {
    updateData({ usageType })
  }

  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">What would you like to use</h1>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
          ProjectFlow for?
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {usageOptions.map((option) => {
          const Icon = option.icon
          const isSelected = data.usageType === option.id
          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={`flex flex-col items-center p-6 rounded-xl transition-all duration-300 ${
                isSelected
                  ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500 shadow-lg shadow-purple-500/10"
                  : "bg-white border-2 border-gray-200 hover:border-gray-300 hover:shadow-md"
              }`}
            >
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  isSelected ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white" : "bg-gray-100 text-gray-600"
                }`}
              >
                <Icon size={24} />
              </div>
              <h3 className={`text-lg font-semibold mb-2 ${isSelected ? "text-purple-700" : "text-gray-800"}`}>
                {option.name}
              </h3>
              <p className="text-sm text-gray-500">{option.description}</p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
