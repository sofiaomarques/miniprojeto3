// Preço base dos serviços na descoberta: juntar os preços (que vêm do service
// de preços da identidade, lib/identidade/precos.ts) às prestadoras e ordenar
// do mais barato ao mais caro. Funções puras, usadas pelo mock e pelo Supabase,
// para os dois modos ordenarem igual.
import type { PrecoServico } from "@/lib/identidade/precos";

import type { PrecoCategoria, PrestadoraResumo } from "./types";

export function paraPrecosCategoria(lista: readonly PrecoServico[]): PrecoCategoria[] {
  return lista
    .map((p) => ({
      categoriaId: p.categoria_id,
      precoBase: p.preco_base,
      aceitaNegociar: p.preco_base !== null && p.aceita_negociar,
    }))
    .sort((a, b) => a.categoriaId - b.categoriaId);
}

// Agrupa por prestadora (uma consulta só para a lista inteira da busca).
export function precosPorPrestadora(lista: readonly PrecoServico[]): Map<string, PrecoCategoria[]> {
  const grupos = new Map<string, PrecoServico[]>();
  for (const p of lista) {
    const grupo = grupos.get(p.prestadora_id) ?? [];
    grupo.push(p);
    grupos.set(p.prestadora_id, grupo);
  }
  return new Map([...grupos].map(([id, precos]) => [id, paraPrecosCategoria(precos)]));
}

// O preço que vale para comparar: com filtro de serviço, o daquele serviço;
// sem filtro, o menor entre os serviços dela ("a partir de"). null = nenhum
// preço definido ("a combinar").
export function precoDeReferencia(
  prestadora: Pick<PrestadoraResumo, "precos">,
  categoriaId?: number,
): PrecoCategoria | null {
  const comPreco = prestadora.precos.filter(
    (p) => p.precoBase !== null && (!categoriaId || p.categoriaId === categoriaId),
  );
  if (comPreco.length === 0) return null;
  // Empate de valor: o que aceita negociar primeiro (o selo aparece).
  return comPreco.reduce((menor, p) =>
    p.precoBase! < menor.precoBase! || (p.precoBase === menor.precoBase && p.aceitaNegociar && !menor.aceitaNegociar)
      ? p
      : menor,
  );
}

const porNome = (a: PrestadoraResumo, b: PrestadoraResumo) => a.nome.localeCompare(b.nome, "pt-BR");

// Do mais barato ao mais caro; sem preço no fim. Empate: maior nota (sem nota
// por último), depois nome. Não muda a lista recebida.
export function ordenarPorPreco(lista: readonly PrestadoraResumo[], categoriaId?: number): PrestadoraResumo[] {
  const preco = (p: PrestadoraResumo) => precoDeReferencia(p, categoriaId)?.precoBase ?? Number.POSITIVE_INFINITY;
  return [...lista].sort(
    (a, b) => preco(a) - preco(b) || (b.notaMedia ?? -1) - (a.notaMedia ?? -1) || porNome(a, b),
  );
}
