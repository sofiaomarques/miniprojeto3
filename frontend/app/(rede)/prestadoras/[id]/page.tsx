import { PaginaPrestadora } from "@/components/descoberta/PaginaPrestadora";
import { BarraTopo, Tela } from "@/components/rede/Tela";

export default async function PrestadoraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Tela largura="larga">
      <BarraTopo />
      <PaginaPrestadora id={id} />
    </Tela>
  );
}
