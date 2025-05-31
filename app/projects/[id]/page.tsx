import ProjectLayout from "@/components/project-layout"

type PageProps = {
  params: {
    id: string
  }
}

export default function ProjectPage({ params }: PageProps) {
  return <ProjectLayout projectId={params.id} />
}
