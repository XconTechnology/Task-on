"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { OnboardingData } from "@/lib/types"
import UsageTypeStep from "./steps/usage-type-step"
import ManagementTypeStep from "./steps/management-type-step"
import FeaturesStep from "./steps/features-step"
import WorkspaceNameStep from "./steps/workspace-name-step"
import InviteTeamStep from "./steps/invite-team-step"

const TOTAL_STEPS = 5

export default function OnboardingFlow() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [onboardingData, setOnboardingData] = useState<Partial<OnboardingData>>({
    usageType: "personal",
    managementType: [],
    features: [],
    workspaceName: "",
    invitedEmails: [],
    referralSource: "",
  })

  const updateData = (data: Partial<OnboardingData>) => {
    setOnboardingData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!onboardingData.usageType
      case 2:
        return onboardingData.managementType && onboardingData.managementType.length > 0
      case 3:
        return onboardingData.features && onboardingData.features.length > 0
      case 4:
        return !!onboardingData.workspaceName?.trim()
      case 5:
        return true // Invite step is optional
      case 6:
        return !!onboardingData.referralSource
      default:
        return false
    }
  }

  const handleFinish = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(onboardingData),
      })

      const data = await response.json()

      if (data.success) {
        router.push("/dashboard")
      } else {
        console.error("Onboarding failed:", data.error)
      }
    } catch (error) {
      console.error("Onboarding error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100

  return (
    <div className="max-h-screen flex items-center justify-center  p-4 relative">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat  opacity-20"
        style={{
          backgroundImage: "url('/onboarding_Img.png')",
        }}
      ></div>
      {/* Dark overlay to dim the background further */}
      <div className="absolute inset-0 bg-gray-900/10 "></div>

      <div className="w-full max-w-3xl relative z-10 overflow-hidden">
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          {/* Header */}
          <div className="p-8 pb-6">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">PM</span>
                </div>
                <span className="text-xl font-bold text-gray-900">ProjectFlow</span>
              </div>
              <div className="text-right">
                <p className="text-small text-gray-500">Welcome, User!</p>
              </div>
            </div>

            {/* Step Content */}
            <div className="min-h-[350px]">
              {currentStep === 1 && <UsageTypeStep data={onboardingData} updateData={updateData} />}
              {currentStep === 2 && <ManagementTypeStep data={onboardingData} updateData={updateData} />}
              {currentStep === 3 && <FeaturesStep data={onboardingData} updateData={updateData} />}
              {currentStep === 4 && <WorkspaceNameStep data={onboardingData} updateData={updateData} />}
              {currentStep === 5 && <InviteTeamStep data={onboardingData} updateData={updateData} />}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="px-8 pb-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-8 pt-6 bg-gray-50/90 backdrop-blur-sm flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center space-x-2 border-gray-300 hover:bg-gray-100"
            >
              <ChevronLeft size={16} />
              <span className="text-medium">Back</span>
            </Button>

            {currentStep === TOTAL_STEPS ? (
              <Button
                onClick={handleFinish}
                disabled={!canProceed() || isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-500/20"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span className="text-medium">Setting up...</span>
                  </div>
                ) : (
                  <span className="text-medium">Finish</span>
                )}
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white flex items-center space-x-2 shadow-lg shadow-purple-500/20"
              >
                <span className="text-medium">Next</span>
                <ChevronRight size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
