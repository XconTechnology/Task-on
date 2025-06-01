import type { Metadata } from "next"
import TeamsContent from "@/components/teams/teams-content"

export const metadata: Metadata = {
  title: "Teams - ProjectFlow",
  description: "Manage your teams, members, and collaboration settings.",
}

export default function TeamsPage() {
  return <TeamsContent />
}
