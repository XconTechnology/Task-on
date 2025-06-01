import type { Metadata } from "next"
import DashboardContent from "@/components/dashboard/dashboard-content"

export const metadata: Metadata = {
  title: "Dashboard - ProjectFlow",
  description: "Your project management dashboard with insights, analytics, and task overview.",
}

export default function DashboardPage() {
  return <DashboardContent />
}
