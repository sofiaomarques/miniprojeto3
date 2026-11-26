import { PaginaPrestadora } from "@/components/descoberta/PaginaPrestadora";
import { BarraAbas, Tela } from "@/components/rede/Tela";

export default async function PrestadoraPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Tela>
      <PaginaPrestadora id={id} />
      {/* No celular o botão "Conversar" fica embaixo; as abas aparecem só no computador. */}
      <BarraAbas className="hidden md:flex" />
    </Tela>
  );
}
