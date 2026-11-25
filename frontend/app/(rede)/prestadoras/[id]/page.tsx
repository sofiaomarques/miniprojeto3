import { PaginaPrestadora } from "@/components/descoberta/PaginaPrestadora";
import { Tela } from "@/components/rede/Tela";

export default async function PrestadoraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Tela>
      <PaginaPrestadora id={id} />
    </Tela>
  );
}
