"use client"

import type { OnboardingData } from "@/lib/types"

type FeaturesStepProps = {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
}

const featureOptions = [
  "Forms",
  "Tasks & Projects",
  "Automations",
  "Whiteboards",
  "Boards & Kanban",
  "Workload",
  "Scheduling",
  "Goals & OKRs",
  "Docs & Wikis",
  "Dashboards",
  "Time Tracking",
  "Ask AI",
  "Chat",
  "Sprints",
  "Calendar",
  "Gantt Charts",
  "Clips",
  "CRM",
]

export default function FeaturesStep({ data, updateData }: FeaturesStepProps) {
  const handleToggle = (feature: string) => {
    const currentFeatures = data.features || []
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature]

    updateData({ features: newFeatures })
  }

  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="header-medium mb-4">Which features are you interested in</h1>
        <h1 className="header-medium mb-4">trying?</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto max-h-80 overflow-y-auto custom-scrollbar">
        {featureOptions.map((feature) => (
          <button
            key={feature}
            onClick={() => handleToggle(feature)}
            className={`p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
              data.features?.includes(feature)
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            <span className="text-small font-medium">{feature}</span>
          </button>
        ))}
      </div>

      <p className="text-description-small text-gray-500 max-w-md mx-auto">
        Don't worry, you'll have access to all of these in your Workspace.
      </p>
    </div>
  )
}
