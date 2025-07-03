"use client";

import type { OnboardingData } from "@/lib/types";

type FeaturesStepProps = {
  data: Partial<OnboardingData>;
  updateData: (data: Partial<OnboardingData>) => void;
};

const featureOptions = [
  "Forms",
  "Tasks & Projects",
  "Automations",
  "Whiteboards",
  "Workload",
  "Scheduling",
  "Dashboards",
  "Time Tracking",
  "Ask AI",
  "Chat",
  "Calendar",
];

export default function FeaturesStep({ data, updateData }: FeaturesStepProps) {
  const handleToggle = (feature: string) => {
    const currentFeatures = data.features || [];
    const newFeatures = currentFeatures.includes(feature)
      ? currentFeatures.filter((f) => f !== feature)
      : [...currentFeatures, feature];

    updateData({ features: newFeatures });
  };

  return (
    <div className="text-center  space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Which features are you interested in
        </h1>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 text-transparent bg-clip-text">
          trying?
        </h1>
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
            <span className="text-medium font-medium">{feature}</span>
          </button>
        ))}
      </div>

      <p className="text-medium text-gray-500 max-w-md mx-auto">
        Don&apos;t worry, you&apos;ll have access to all of these in your Workspace.
      </p>
    </div>
  );
}
