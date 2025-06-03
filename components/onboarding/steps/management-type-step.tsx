"use client"
import { Check } from "lucide-react"
import type { OnboardingData } from "@/lib/types"

type ManagementTypeStepProps = {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
}

const managementOptions = [
  {
    id: "personal-use",
    name: "Personal Use",
    icon: "👤",
  },
  {
    id: "operations",
    name: "Operations",
    icon: "⚙️",
  },
  {
    id: "startup",
    name: "Startup",
    icon: "🚀",
  },
  {
    id: "software-development",
    name: "Software Development",
    icon: "💻",
  },
  {
    id: "sales-crm",
    name: "Sales & CRM",
    icon: "📊",
  },
  {
    id: "finance-accounting",
    name: "Finance & Accounting",
    icon: "💰",
  },
  {
    id: "creative-design",
    name: "Creative & Design",
    icon: "🎨",
  },
 
  {
    id: "hr-recruiting",
    name: "HR & Recruiting",
    icon: "👥",
  },

  {
    id: "marketing",
    name: "Marketing",
    icon: "📣",
  },
  {
    id: "professional-services",
    name: "Professional Services",
    icon: "👔",
  },

  {
    id: "other",
    name: "Other",
    icon: "✨",
  },
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">What would you like to</h1>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
          manage?
        </h1>
      </div>

      <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
        {managementOptions.map((option) => {
          const isSelected = data.managementType?.includes(option.name)
          return (
            <button
              key={option.id}
              onClick={() => handleToggle(option.name)}
              className={`relative group flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
                isSelected
                  ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-2 border-purple-500"
                  : "bg-white border-2 border-gray-200 hover:border-gray-300"
              }`}
            >
              {isSelected && (
                <div className="absolute -top-2 -right-2 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-xl">{option.icon}</span>
                <span className={`text-medium font-medium ${isSelected ? "text-purple-700" : "text-gray-700"}`}>
                  {option.name}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-description-small text-gray-500 max-w-md mx-auto">
        Don't worry, you can always add more in the future.
      </p>
    </div>
  )
}
