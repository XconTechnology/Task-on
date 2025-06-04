import ProjectLayout from "@/components/project-layout";

export const dynamicParams = true;

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProjectPage({ params }: PageProps) {
  const { id } = await params; // ✅ Wait for params
  return <ProjectLayout projectId={id} />;
}
