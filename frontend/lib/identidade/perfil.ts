// Edição do próprio perfil (#16): leitura do formulário, quais categorias de
// serviço adicionar ou remover e a sincronização delas. As regras de verdade
// (limites, quem pode gravar) continuam no service.ts e no banco; aqui as
// funções recebem o service pronto, e dá para testar sem Supabase. As telas
// usam pelo service.ts, que reexporta este arquivo.
import { ehErroIdentidade } from "./erros";
import type { AtualizacaoPerfil, CategoriaServico, ServicoIdentidade } from "./types";

export type EdicaoPerfil = {
  dados: AtualizacaoPerfil;
  // ids das categorias marcadas no formulário (só prestadora)
  categorias: number[];
};

function texto(valor: FormDataEntryValue | null): string {
  return typeof valor === "string" ? valor : "";
}

// Lê nome, bio, cidade e as categorias marcadas. Campo vazio de bio e cidade
// vira null (o service apaga o valor); o nome é obrigatório e o service recusa
// vazio com mensagem própria.
export function lerEdicaoPerfil(form: FormData): EdicaoPerfil {
  const bio = texto(form.get("bio")).trim();
  const cidade = texto(form.get("cidade")).trim();
  const categorias = form
    .getAll("categorias")
    .map((v) => Number(v))
    .filter((n) => Number.isSafeInteger(n) && n > 0);
  return {
    dados: {
      nome: texto(form.get("nome")),
      bio: bio === "" ? null : bio,
      cidade: cidade === "" ? null : cidade,
    },
    categorias: [...new Set(categorias)],
  };
}

// O que mudar em servicos_prestadora para ficar igual ao que foi marcado.
export function diferencaCategorias(
  atuais: readonly number[],
  escolhidas: readonly number[],
): { adicionar: number[]; remover: number[] } {
  const antes = new Set(atuais);
  const depois = new Set(escolhidas);
  return {
    adicionar: [...depois].filter((id) => !antes.has(id)).sort((a, b) => a - b),
    remover: [...antes].filter((id) => !depois.has(id)).sort((a, b) => a - b),
  };
}

// Deixa servicos_prestadora igual ao que foi marcado. Idempotente: um serviço
// que já existe (conflito) ou que já saiu (nao_encontrado) conta como feito,
// para dois envios ao mesmo tempo (duas abas) não virarem erro na tela.
export async function sincronizarMeusServicos(
  identidade: Pick<
    ServicoIdentidade,
    "listarServicosDaPrestadora" | "adicionarMeuServico" | "removerMeuServico"
  >,
  prestadoraId: string,
  escolhidas: readonly number[],
): Promise<void> {
  const atuais = (await identidade.listarServicosDaPrestadora(prestadoraId)).map(
    (s) => s.categoria_id,
  );
  const { adicionar, remover } = diferencaCategorias(atuais, escolhidas);
  for (const id of adicionar) {
    try {
      await identidade.adicionarMeuServico(id);
    } catch (erro) {
      if (!(ehErroIdentidade(erro) && erro.codigo === "conflito")) throw erro;
    }
  }
  for (const id of remover) {
    try {
      await identidade.removerMeuServico(id);
    } catch (erro) {
      if (!(ehErroIdentidade(erro) && erro.codigo === "nao_encontrado")) throw erro;
    }
  }
}

// O que a tela de edição precisa além do perfil: o catálogo e as categorias
// que a prestadora já faz. Para a cliente, tudo vazio.
export async function carregarEdicaoPerfil(
  identidade: Pick<ServicoIdentidade, "listarCategorias" | "listarServicosDaPrestadora">,
  perfil: { id: string; papel: string | null },
): Promise<{ categorias: CategoriaServico[]; marcadas: number[] }> {
  if (perfil.papel !== "prestadora") return { categorias: [], marcadas: [] };
  const [categorias, servicos] = await Promise.all([
    identidade.listarCategorias(),
    identidade.listarServicosDaPrestadora(perfil.id),
  ]);
  return { categorias, marcadas: servicos.map((s) => s.categoria_id) };
}
