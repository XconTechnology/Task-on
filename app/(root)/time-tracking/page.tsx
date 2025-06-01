import type { Metadata } from "next"
import TimeTrackingContent from "@/components/time-tracking/time-tracking-content"

export const metadata: Metadata = {
  title: "Time Tracking - ProjectFlow",
  description: "Track time spent on tasks and projects. Monitor productivity and generate time reports.",
}

export default function TimeTrackingPage() {
  return <TimeTrackingContent />
}
