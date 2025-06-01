import type { Metadata } from "next"
import CalendarContent from "@/components/calendar/calendar-content"

export const metadata: Metadata = {
  title: "Calendar - ProjectFlow",
  description: "View and manage your tasks, deadlines, and events in a beautiful calendar interface.",
}

export default function CalendarPage() {
  return <CalendarContent />
}
