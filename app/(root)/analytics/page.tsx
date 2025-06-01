import type { Metadata } from "next"
import AnalyticsContent from "@/components/analytics/analytics-content"

export const metadata: Metadata = {
  title: "Analytics - ProjectFlow",
  description: "Comprehensive analytics and insights for your projects, teams, and productivity.",
}

export default function AnalyticsPage() {
  return <AnalyticsContent />
}
