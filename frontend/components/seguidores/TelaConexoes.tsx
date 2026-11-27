import { ListaConexoes } from "./ListaConexoes";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { exigirConta } from "@/lib/rede/sessao";
import type { TipoLista } from "@/lib/seguidores/types";

// Corpo comum de /pessoas/[id]/seguidores e /pessoas/[id]/seguindo.
// Só com conta: a lista mostra nomes de clientes.
export async function TelaConexoes({ id, tipo }: { id: string; tipo: TipoLista }) {
  const perfil = await exigirConta(`/pessoas/${id}/${tipo}`);

  return (
    <Tela>
      {perfil ? (
        <ListaConexoes perfilId={id} tipo={tipo} minhaId={perfil.id} />
      ) : (
        <div className="flex-1 px-5 pt-8">
          <Aviso tipo="erro">Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.</Aviso>
        </div>
      )}
      <BarraAbas ativa={perfil?.id === id ? "perfil" : undefined} />
    </Tela>
  );
}
