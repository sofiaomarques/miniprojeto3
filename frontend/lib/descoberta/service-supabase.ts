// Implementação real do service (NEXT_PUBLIC_USE_MOCKS=false), sobre o banco
// criado por 02_descoberta.sql. A segurança de verdade está na RLS; as
// checagens daqui só dão mensagens claras.
import { servicoPrecos } from "@/lib/identidade/precos";
import { servicoIdentidade } from "@/lib/identidade/service";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { ordenarPorPreco, paraPrecosCategoria, precosPorPrestadora } from "./precos";
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

function clienteSupabase() {
  const cliente = criarClienteNavegador();
  if (!cliente) throw new Error("Supabase desligado (modo mock).");
  return cliente;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
// Traduz os erros do Postgres/PostgREST para mensagens seguras: a mensagem
// crua traz nome de policy, constraint e valores.
function mensagemDoErro(erro: { code?: string }): string {
  switch (erro.code) {
    case "23505":
      return "Você já avaliou esta prestadora.";
    case "42501":
      return "Você não tem permissão para fazer isso.";
    case "23514":
    case "22P02":
      return "Dados inválidos.";
    case "23503":
      return "Registro relacionado não encontrado.";
    default:
      return "Não foi possível concluir a operação. Tente novamente.";
  }
}

function ou<T>(resposta: { data: T; error: { message: string; code?: string } | null }): T {
  if (resposta.error) throw new Error(mensagemDoErro(resposta.error));
  return resposta.data;
}

const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    precos: [], // preenchido com o service de preços (P1)
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
    // `categorias` é jsonb: o valor vai como texto JSON (cs.[{"id":3}]). Um
    // array de objetos viraria cs.{[object Object]} e o Postgres recusa.
    consulta = consulta.contains("categorias", JSON.stringify([{ id: filtros.categoriaId }]));
  }
  if (filtros.cidade?.trim()) {
    const termo = normalizarTexto(filtros.cidade).replace(/[%_,*\\]/g, " ");
    consulta = consulta.ilike("cidade_normalizada", `%${termo}%`);
  }
  // Por preço, a ordem é feita aqui (ordenarPorPreco), igual ao mock: com
  // filtro de serviço vale o preço daquele serviço, e ele não está na view.
  consulta =
    filtros.ordenarPor === "preco"
      ? consulta.order("nome", { ascending: true })
      : consulta
          .order("nota_media", { ascending: false, nullsFirst: false })
          .order("nome", { ascending: true });
  // Preços pelo service da P1, numa consulta só (só o serviço filtrado, se houver).
  // Opcionais: se falharem (ex.: banco ainda sem a 05), todas aparecem "a
  // combinar" e a busca por nota continua; só a ordem por preço vira erro.
  const [resposta, precos] = await Promise.all([
    consulta,
    servicoPrecos(clienteSupabase())
      .listarPrecos({ categoriaId: filtros.categoriaId })
      .catch((err) => {
        if (filtros.ordenarPor === "preco") throw err;
        console.error("Erro ao carregar os preços:", err);
        return [];
      }),
  ]);
  const porPrestadora = precosPorPrestadora(precos);
  const resumos = (ou(resposta) as any[]).map((l) => ({
    ...paraResumo(l),
    precos: porPrestadora.get(l.id) ?? [],
  }));
  return filtros.ordenarPor === "preco" ? ordenarPorPreco(resumos, filtros.categoriaId) : resumos;
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
  // id que não é uuid vira "não encontrada", não erro 22P02 do Postgres.
  if (!REGEX_UUID.test(id)) return null;
  const db = clienteSupabase();
  // Perfil e fotos vêm do service da identidade (P1); nota e categorias, da view da 02.
  const identidade = servicoIdentidade(db);
  const [resumo, perfil, fotos, avaliacoes, precos] = await Promise.all([
    db.from("prestadoras_resumo").select("*").eq("id", id).maybeSingle(),
    identidade.obterPerfil(id),
    identidade.listarFotosDaPrestadora(id),
    listarAvaliacoes(id),
    // Opcional, como na busca: sem preços a página continua, tudo "a combinar".
    servicoPrecos(db)
      .listarPrecos({ prestadoraId: id })
      .catch((err) => {
        console.error("Erro ao carregar os preços:", err);
        return [];
      }),
  ]);
  const linhaResumo = ou(resumo);
  if (!linhaResumo || !perfil || perfil.papel !== "prestadora") return null;
  const base = paraResumo(linhaResumo);
  return {
    perfil,
    categorias: base.categorias,
    fotos,
    avaliacoes,
    notaMedia: base.notaMedia,
    totalAvaliacoes: base.totalAvaliacoes,
    precos: paraPrecosCategoria(precos),
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

export async function listarIndicacoesDasClientes(
  clienteIds: string[],
  limite: number,
): Promise<Avaliacao[]> {
  // Só uuids: um id inválido no `in` derrubaria a consulta inteira (22P02).
  const ids = clienteIds.filter((id) => REGEX_UUID.test(id));
  if (ids.length === 0) return [];
  const linhas = ou(
    await clienteSupabase()
      .from("avaliacoes_publicas")
      .select("*")
      .in("cliente_id", ids)
      .order("criada_em", { ascending: false })
      .limit(limite),
  );
  return (linhas as any[]).map(paraAvaliacaoPublica);
}
