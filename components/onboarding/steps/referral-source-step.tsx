"use client"

import type { OnboardingData } from "@/lib/types"

type ReferralSourceStepProps = {
  data: Partial<OnboardingData>
  updateData: (data: Partial<OnboardingData>) => void
}

const referralOptions = [
  "YouTube",
  "Search Engine (Google, Bing, etc.)",
  "Reddit",
  "Friend / Colleague",
  "Facebook / Instagram",
  "Software Review Sites",
  "TV / Streaming (Hulu, NBC, etc.)",
  "LinkedIn",
  "AI Tools (ChatGPT, Perplexity, etc.)",
  "TikTok",
  "Other",
]

export default function ReferralSourceStep({ data, updateData }: ReferralSourceStepProps) {
  const handleSelect = (source: string) => {
    updateData({ referralSource: source })
  }

  return (
    <div className="text-center space-y-8">
      <div>
        <h1 className="header-medium mb-4">How did you hear</h1>
        <h1 className="header-medium mb-4">about us?</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-3xl mx-auto">
        {referralOptions.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md text-left ${
              data.referralSource === option
                ? "border-purple-500 bg-purple-50 text-purple-700"
                : "border-gray-200 hover:border-gray-300 text-gray-700"
            }`}
          >
            <span className="text-medium font-medium">{option}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
