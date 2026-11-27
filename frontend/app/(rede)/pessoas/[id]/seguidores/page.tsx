import { TelaConexoes } from "@/components/seguidores/TelaConexoes";

export default async function SeguidoresPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TelaConexoes id={id} tipo="seguidores" />;
}
