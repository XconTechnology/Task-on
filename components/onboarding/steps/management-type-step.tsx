"use client"

import type { OnboardingData } from "@/lib/types"

type ManagementTypeStepProps = {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
}

const managementOptions = [
  "Personal Use",
  "Operations",
  "Startup",
  "Software Development",
  "Sales & CRM",
  "Finance & Accounting",
  "Creative & Design",
  "Support",
  "HR & Recruiting",
  "IT",
  "Marketing",
  "Professional Services",
  "PMO",
  "Other",
]

export default function ManagementTypeStep({ data, updateData }: ManagementTypeStepProps) {
  const handleToggle = (option: string) => {
    const currentTypes = data.managementType || []
    const newTypes = currentTypes.includes(option)
      ? currentTypes.filter((type) => type !== option)
      : [...currentTypes, option]

    updateData({ managementType: newTypes })
  }

  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="header-medium mb-4">What would you like to</h1>
        <h1 className="header-medium mb-4">manage?</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
        {managementOptions.map((option) => (
          <button
            key={option}
            onClick={() => handleToggle(option)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
              data.managementType?.includes(option)
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            <span className="text-medium font-medium">{option}</span>
          </button>
        ))}
      </div>

      <p className="text-description-small text-gray-500 max-w-md mx-auto">
        Don't worry, you can always add more in the future.
      </p>
    </div>
  )
}
