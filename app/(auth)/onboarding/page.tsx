import type { Metadata } from "next"
import OnboardingFlow from "@/components/onboarding/onboarding-flow"

export const metadata: Metadata = {
  title: "Welcome to ProjectFlow - Setup Your Workspace",
  description:
    "Complete your ProjectFlow setup and create your first workspace to start managing projects efficiently.",
  robots: "noindex, nofollow",
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <OnboardingFlow />
    </div>
  )
}
