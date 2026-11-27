import { redirect } from "next/navigation";

import { PaginaPessoa } from "@/components/seguidores/PaginaPessoa";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { exigirConta } from "@/lib/rede/sessao";

// Perfil de outra pessoa da rede. O meu fica em /perfil.
export default async function PessoaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const perfil = await exigirConta(`/pessoas/${id}`);
  if (perfil?.id === id) redirect("/perfil");

  return (
    <Tela>
      {perfil ? (
        <PaginaPessoa id={id} usuaria={perfil} />
      ) : (
        <div className="flex-1 px-5 pt-8">
          <Aviso tipo="erro">Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.</Aviso>
        </div>
      )}
      <BarraAbas />
    </Tela>
  );
}
