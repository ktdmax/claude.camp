export default async function AgentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div>agent {id}</div>
}
