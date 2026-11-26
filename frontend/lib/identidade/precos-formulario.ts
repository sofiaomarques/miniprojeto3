// Tela "Preços dos serviços" (/perfil/precos): o que ela mostra (serviços da
// prestadora com nome, preço e negociação) e a leitura do formulário. Funções
// puras, que recebem os services prontos: dá para testar sem Supabase.
import { lerPreco } from "./dinheiro";
import type { AlteracaoPreco, ServicoPrecos } from "./precos";
import type { ServicoIdentidade } from "./types";

export type LinhaPreco = {
  categoria_id: number;
  nome: string;
  preco_base: number | null;
  aceita_negociar: boolean;
};

// O que a pessoa digitou, para devolver ao formulário quando há erro.
export type ValorDigitado = { preco: string; negocia: boolean };

export type LeituraPrecos = {
  alteracoes: AlteracaoPreco[];
  erros: Record<number, string>; // por categoria_id
  valores: Record<number, ValorDigitado>;
};

// Nomes dos campos: "servico" (repetido, um por categoria), "preco-<id>" e
// "negocia-<id>" (checkbox; só vem marcado).
export const campoPreco = (categoriaId: number) => `preco-${categoriaId}`;
export const campoNegocia = (categoriaId: number) => `negocia-${categoriaId}`;

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor : "";
}

export function lerFormularioPrecos(form: FormData): LeituraPrecos {
  const ids = [
    ...new Set(
      form
        .getAll("servico")
        .map((v) => Number(v))
        .filter((n) => Number.isSafeInteger(n) && n > 0),
    ),
  ];
  const leitura: LeituraPrecos = { alteracoes: [], erros: {}, valores: {} };
  for (const id of ids) {
    const preco = texto(form.get(campoPreco(id))).slice(0, 30);
    const negocia = form.get(campoNegocia(id)) !== null;
    leitura.valores[id] = { preco, negocia };
    const lido = lerPreco(preco);
    if (!lido.ok) {
      leitura.erros[id] = lido.erro;
      continue;
    }
    // Sem preço ("a combinar") não há o que negociar.
    leitura.alteracoes.push({
      categoria_id: id,
      preco_base: lido.valor,
      aceita_negociar: lido.valor !== null && negocia,
    });
  }
  return leitura;
}

// Serviços da prestadora com o nome da categoria e o preço atual, em ordem
// alfabética (a mesma dos chips da busca).
export async function carregarMeusPrecos(
  identidade: Pick<ServicoIdentidade, "listarCategorias" | "listarServicosDaPrestadora">,
  precos: Pick<ServicoPrecos, "listarPrecos">,
  prestadoraId: string,
): Promise<LinhaPreco[]> {
  const [categorias, servicos, lista] = await Promise.all([
    identidade.listarCategorias(),
    identidade.listarServicosDaPrestadora(prestadoraId),
    precos.listarPrecos({ prestadoraId }),
  ]);
  const nomes = new Map(categorias.map((c) => [c.id, c.nome]));
  const porCategoria = new Map(lista.map((p) => [p.categoria_id, p]));
  return servicos
    .map((s) => ({
      categoria_id: s.categoria_id,
      nome: nomes.get(s.categoria_id) ?? "Serviço",
      preco_base: porCategoria.get(s.categoria_id)?.preco_base ?? null,
      aceita_negociar: porCategoria.get(s.categoria_id)?.aceita_negociar ?? false,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
