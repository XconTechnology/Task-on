"use client"

import type { OnboardingData } from "@/lib/types"

type UsageTypeStepProps = {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
}

const usageOptions = [
  {
    id: "work" as const,
    title: "Work",
    description: "For professional teams and organizations",
    icon: "💼",
  },
  {
    id: "personal" as const,
    title: "Personal",
    description: "For individual projects and personal use",
    icon: "👤",
  },
  {
    id: "school" as const,
    title: "School",
    description: "For educational projects and assignments",
    icon: "🎓",
  },
]

export default function UsageTypeStep({ data, updateData }: UsageTypeStepProps) {
  const handleSelect = (usageType: "work" | "personal" | "school") => {
    updateData({ usageType })
  }

  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="header-medium mb-4">What would you like to use</h1>
        <h1 className="header-medium mb-4">ProjectFlow for?</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        {usageOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSelect(option.id)}
            className={`p-6 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
              data.usageType === option.id
                ? "border-purple-500 bg-purple-50 shadow-lg"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="text-4xl mb-3">{option.icon}</div>
            <h3 className="text-label mb-2">{option.title}</h3>
            <p className="text-description-small">{option.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
