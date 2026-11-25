// Página inicial = busca de prestadoras. A sessão é lida no servidor (para o
// "Entrar"/"Olá" não piscar); a busca em si roda no navegador.
import { BuscaPrestadoras } from "@/components/descoberta/BuscaPrestadoras";
import { BarraAbas, Tela } from "@/components/rede/Tela";
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

  return (
    <Tela className="h-dvh">
      <BuscaPrestadoras perfil={perfil} filtrosIniciais={lerFiltros(params)} />
      <BarraAbas ativa="buscar" />
    </Tela>
  );
}
