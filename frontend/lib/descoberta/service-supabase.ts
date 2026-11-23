// Implementação real do service (NEXT_PUBLIC_USE_MOCKS=false), sobre o banco
// criado por 02_descoberta.sql. A segurança de verdade está na RLS; as
// checagens daqui só dão mensagens claras.
import type { FotoPortfolio, Perfil } from "./identidade-provisoria";
import { normalizarTexto } from "./texto";
import type {
  Avaliacao,
  CategoriaResumo,
  DadosAvaliacao,
  FiltrosBusca,
  NovaAvaliacao,
  PrestadoraDetalhe,
  PrestadoraResumo,
} from "./types";

// Tipo mínimo do cliente Supabase, para não depender de pacote que ainda não
// está no main.
// TODO: quando a #11 (lib/supabase) entrar no main, trocar por
//   import { criarClienteNavegador } from "@/lib/supabase/client";
// e apagar este tipo e `clienteSupabase`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ClienteSupabase = { from(tabela: string): any };

function clienteSupabase(): ClienteSupabase {
  throw new Error(
    "Modo real indisponível: lib/supabase (#11) ainda não está no main. " +
      "Use NEXT_PUBLIC_USE_MOCKS=true por enquanto.",
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ou<T>(resposta: { data: T; error: { message: string } | null }): T {
  if (resposta.error) throw new Error(resposta.error.message);
  return resposta.data;
}

const COLUNAS_AVALIACAO =
  "id, prestadora_id, cliente_id, nota, comentario, criada_em, " +
  "cliente:perfis!avaliacoes_cliente_id_fkey(nome, avatar_url), " +
  "prestadora:perfis!avaliacoes_prestadora_id_fkey(nome, avatar_url)";

// Linha da view `avaliacoes_publicas` (02): traz o nome e o avatar de quem avaliou,
// que `perfis` não mostra para outras clientes (a 01 só deixa prestadoras públicas).
function paraAvaliacaoPublica(l: any): Avaliacao {
  return {
    id: l.id,
    prestadoraId: l.prestadora_id,
    clienteId: l.cliente_id,
    nota: l.nota,
    comentario: l.comentario,
    criadaEm: l.criada_em,
    prestadoraNome: l.prestadora_nome ?? "",
    prestadoraAvatarUrl: l.prestadora_avatar_url ?? null,
    clienteNome: l.cliente_nome ?? "",
    clienteAvatarUrl: l.cliente_avatar_url ?? null,
  };
}

function paraAvaliacao(l: any): Avaliacao {
  return {
    id: l.id,
    prestadoraId: l.prestadora_id,
    clienteId: l.cliente_id,
    nota: l.nota,
    comentario: l.comentario,
    criadaEm: l.criada_em,
    prestadoraNome: l.prestadora?.nome ?? "",
    prestadoraAvatarUrl: l.prestadora?.avatar_url ?? null,
    clienteNome: l.cliente?.nome ?? "",
    clienteAvatarUrl: l.cliente?.avatar_url ?? null,
  };
}

function paraResumo(l: any): PrestadoraResumo {
  return {
    id: l.id,
    nome: l.nome,
    avatarUrl: l.avatar_url,
    cidade: l.cidade,
    categorias: (l.categorias ?? []) as CategoriaResumo[],
    notaMedia: l.nota_media === null ? null : Number(l.nota_media),
    totalAvaliacoes: l.total_avaliacoes ?? 0,
  };
}

export async function listarCategorias(): Promise<CategoriaResumo[]> {
  const linhas = ou(
    await clienteSupabase().from("categorias_servico").select("id, nome").order("nome"),
  ) as any[];
  return linhas.map((l) => ({ id: l.id, nome: l.nome }));
}

export async function buscarPrestadoras(filtros: FiltrosBusca): Promise<PrestadoraResumo[]> {
  let consulta = clienteSupabase().from("prestadoras_resumo").select("*");
  if (filtros.categoriaId) {
    consulta = consulta.contains("categorias", [{ id: filtros.categoriaId }]);
  }
  if (filtros.cidade?.trim()) {
    const termo = normalizarTexto(filtros.cidade).replace(/[%_,]/g, " ");
    consulta = consulta.ilike("cidade_normalizada", `%${termo}%`);
  }
  consulta =
    filtros.ordenarPor === "nome"
      ? consulta.order("nome", { ascending: true })
      : consulta.order("nota_media", { ascending: false, nullsFirst: false });
  return (ou(await consulta) as any[]).map(paraResumo);
}

export async function listarAvaliacoes(prestadoraId: string): Promise<Avaliacao[]> {
  const linhas = ou(
    await clienteSupabase()
      .from("avaliacoes_publicas")
      .select("*")
      .eq("prestadora_id", prestadoraId)
      .order("criada_em", { ascending: false }),
  );
  return (linhas as any[]).map(paraAvaliacaoPublica);
}

export async function obterPrestadora(id: string): Promise<PrestadoraDetalhe | null> {
  const db = clienteSupabase();
  const resumo = ou(await db.from("prestadoras_resumo").select("*").eq("id", id).maybeSingle());
  if (!resumo) return null;
  const perfil = ou(
    await db.from("perfis").select("id, papel, nome, avatar_url, bio, cidade").eq("id", id).single(),
  ) as any;
  const fotos = ou(
    await db.from("fotos_portfolio").select("*").eq("prestadora_id", id),
  ) as any[];
  const base = paraResumo(resumo);
  return {
    perfil: {
      id: perfil.id,
      papel: perfil.papel,
      nome: perfil.nome,
      avatarUrl: perfil.avatar_url,
      bio: perfil.bio,
      cidade: perfil.cidade,
    } satisfies Perfil,
    categorias: base.categorias,
    // TODO: ajustar ao formato real de `fotos_portfolio` da 01 (#12).
    fotos: fotos.map(
      (f): FotoPortfolio => ({ id: f.id, prestadoraId: f.prestadora_id, caminho: f.caminho }),
    ),
    avaliacoes: await listarAvaliacoes(id),
    notaMedia: base.notaMedia,
    totalAvaliacoes: base.totalAvaliacoes,
  };
}

export async function criarAvaliacao(clienteId: string, dados: NovaAvaliacao): Promise<Avaliacao> {
  const linha = ou(
    await clienteSupabase()
      .from("avaliacoes")
      .insert({
        prestadora_id: dados.prestadoraId,
        cliente_id: clienteId,
        nota: dados.nota,
        comentario: dados.comentario ?? null,
      })
      .select(COLUNAS_AVALIACAO)
      .single(),
  );
  return paraAvaliacao(linha);
}

export async function editarAvaliacao(
  clienteId: string,
  id: number,
  dados: DadosAvaliacao,
): Promise<Avaliacao> {
  const linha = ou(
    await clienteSupabase()
      .from("avaliacoes")
      .update({ nota: dados.nota, comentario: dados.comentario ?? null })
      .eq("id", id)
      .eq("cliente_id", clienteId)
      .select(COLUNAS_AVALIACAO)
      .maybeSingle(),
  );
  if (!linha) throw new Error("Avaliação não encontrada ou não é sua.");
  return paraAvaliacao(linha);
}

export async function apagarAvaliacao(clienteId: string, id: number): Promise<void> {
  const apagadas = ou(
    await clienteSupabase()
      .from("avaliacoes")
      .delete()
      .eq("id", id)
      .eq("cliente_id", clienteId)
      .select("id"),
  ) as any[];
  if (apagadas.length === 0) throw new Error("Avaliação não encontrada ou não é sua.");
}

export async function listarIndicacoesDaCliente(clienteId: string): Promise<Avaliacao[]> {
  const linhas = ou(
    await clienteSupabase()
      .from("avaliacoes_publicas")
      .select("*")
      .eq("cliente_id", clienteId)
      .order("criada_em", { ascending: false }),
  );
  return (linhas as any[]).map(paraAvaliacaoPublica);
}
