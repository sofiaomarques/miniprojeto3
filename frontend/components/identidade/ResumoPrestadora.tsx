// O que a prestadora já publicou, no /perfil (#20): serviços, quantas fotos e
// o link para o perfil público da busca (#62). Mostra o que falta para ela
// aparecer bem na busca, sem repetir os botões "Editar perfil" e "Minhas
// fotos" do cabeçalho. Server Component: lê os dados pelo service da identidade.
import Link from "next/link";

import { Vazio } from "@/components/descoberta/Estados";
import { Rotulo } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { nomesDosServicos } from "@/lib/identidade/perfil";
import { servicoIdentidade } from "@/lib/identidade/service";
import { criarClienteServidor } from "@/lib/supabase/server";

type Publicado = { servicos: string[]; totalFotos: number };

// Serviços (com o nome da categoria) e fotos da prestadora. null se o
// Supabase falhar: a tela mostra um aviso só neste bloco.
async function publicadoPela(prestadoraId: string): Promise<Publicado | null> {
  try {
    const identidade = servicoIdentidade(await criarClienteServidor());
    const [categorias, servicos, fotos] = await Promise.all([
      identidade.listarCategorias(),
      identidade.listarServicosDaPrestadora(prestadoraId),
      identidade.listarFotosDaPrestadora(prestadoraId),
    ]);
    return { servicos: nomesDosServicos(categorias, servicos), totalFotos: fotos.length };
  } catch {
    return null;
  }
}

export async function ResumoPrestadora({ prestadoraId }: { prestadoraId: string }) {
  const publicado = await publicadoPela(prestadoraId);
  if (!publicado) {
    return (
      <Aviso tipo="erro">
        Não foi possível carregar seus serviços e fotos agora. Recarregue a página em alguns
        instantes.
      </Aviso>
    );
  }
  const { servicos, totalFotos } = publicado;

  return (
    <div className="flex flex-col gap-4">
      <section className="flex flex-col gap-2" aria-labelledby="titulo-servicos">
        <h2 id="titulo-servicos">
          <Rotulo>Seus serviços</Rotulo>
        </h2>
        {servicos.length === 0 ? (
          <Vazio>
            Você ainda não escolheu nenhum serviço. Sem eles, você não aparece quando a cliente
            filtra por serviço: escolha em <b>Editar perfil</b>.
          </Vazio>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {servicos.map((nome) => (
              <li key={nome} className="rounded-full bg-areia px-3.5 py-2 text-[13.5px] font-medium">
                {nome}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="titulo-fotos">
        <h2 id="titulo-fotos">
          <Rotulo>Fotos de trabalhos</Rotulo>
        </h2>
        {totalFotos === 0 ? (
          <Vazio>
            Nenhuma foto publicada ainda. Fotos de trabalhos passam confiança: envie em{" "}
            <b>Minhas fotos</b>.
          </Vazio>
        ) : (
          <p className="text-[14.5px] text-corpo">
            {totalFotos} {totalFotos === 1 ? "foto publicada" : "fotos publicadas"}
          </p>
        )}
      </section>

      <Link
        href={`/prestadoras/${prestadoraId}`}
        className="flex min-h-11 items-center justify-center rounded-full bg-vinho px-5 text-[14.5px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
      >
        Ver meu perfil público
      </Link>
    </div>
  );
}
