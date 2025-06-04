// app/teams/[id]/page.tsx

import TeamsLayout from "../layout"

type PageProps = {
  params: {
    id: string
  }
}

export default async function TeamPage({ params }: PageProps) {
  return <TeamsLayout teamId={params.id} />
}
