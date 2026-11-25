// Página inicial = busca de prestadoras. A sessão é lida no servidor (para o
// "Entrar"/"Olá" não piscar); a busca em si roda no navegador.
import { BuscaPrestadoras } from "@/components/descoberta/BuscaPrestadoras";
import { BarraAbas, BarraTopo, Tela } from "@/components/rede/Tela";
import type { FiltrosBusca } from "@/lib/descoberta/types";
import { perfilOuNull } from "@/lib/rede/sessao";

type Params = { categoria?: string; cidade?: string; ordem?: string };

function lerFiltros({ categoria, cidade, ordem }: Params): FiltrosBusca {
  const categoriaId = Number(categoria);
  return {
    categoriaId: Number.isSafeInteger(categoriaId) && categoriaId > 0 ? categoriaId : undefined,
    cidade: typeof cidade === "string" ? cidade.slice(0, 100) : undefined,
    ordenarPor: ordem === "nome" ? "nome" : "nota",
  };
}

export default async function HomePage({ searchParams }: { searchParams: Promise<Params> }) {
  const [params, perfil] = await Promise.all([searchParams, perfilOuNull()]);
  const filtros = lerFiltros(params);

  return (
    // No celular a tela tem a altura da janela e só a lista rola; no computador a página rola.
    <Tela largura="larga" className="h-dvh md:h-auto">
      <BarraTopo ativa="buscar" />
      {/* key: uma navegação para outros filtros (ex.: aba "Buscar" -> "/") recria a busca. */}
      <BuscaPrestadoras key={JSON.stringify(filtros)} perfil={perfil} filtrosIniciais={filtros} />
      <BarraAbas ativa="buscar" className="md:hidden" />
    </Tela>
  );
}
