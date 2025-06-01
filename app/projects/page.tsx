import type { Metadata } from "next"
import ProjectsContent from "@/components/projects/projects-content"

export const metadata: Metadata = {
  title: "Projects - ProjectFlow",
  description: "Manage all your projects in one place. Create, organize, and track project progress.",
}

export default function ProjectsPage() {
  return <ProjectsContent />
}
