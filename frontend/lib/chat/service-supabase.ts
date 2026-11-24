// Implementação real do service (NEXT_PUBLIC_USE_MOCKS=false), sobre o banco
// criado por 03_chat.sql. A segurança de verdade está na RLS e nos GRANTs;
// daqui só saem as queries e mensagens de erro claras.
//
// Só para Client Components: usa o cliente do navegador (a sessão vem dos
// cookies do navegador). As telas do chat são todas "use client".
import { servicoIdentidade } from "@/lib/identidade/service";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { type Conversa, ERRO_DESLOGADA, type Mensagem } from "./types";

type LinhaConversaResumo = {
  id: number;
  cliente_id: string;
  prestadora_id: string;
  criada_em: string;
  ultima_mensagem_em: string | null;
  outra_id: string;
  outra_nome: string | null;
  outra_avatar_url: string | null;
  outra_papel: "cliente" | "prestadora" | null;
  ultima_mensagem_texto: string | null;
  ultima_mensagem_autor_id: string | null;
  nao_lidas: number;
};

type LinhaMensagem = {
  id: number;
  conversa_id: number;
  autor_id: string;
  texto: string;
  criada_em: string;
  lida_em: string | null;
};

const COLUNAS_MENSAGEM = "id, conversa_id, autor_id, texto, criada_em, lida_em";

// Códigos que a 03 devolve, traduzidos para a tela.
const ERROS: Record<string, string> = {
  "28000": ERRO_DESLOGADA,
  "42501": "Você não tem permissão para fazer isso.",
  P0002: "Prestadora não encontrada.",
  "23514": "A mensagem está vazia ou passou de 2000 caracteres.",
};

function falha(erro: { code?: string; message: string }): never {
  // A 03 manda "Só clientes podem iniciar uma conversa." com 42501.
  if (erro.code === "42501" && erro.message.startsWith("Só clientes")) {
    throw new Error(erro.message);
  }
  throw new Error((erro.code && ERROS[erro.code]) || "Algo deu errado. Tente de novo.");
}

function cliente() {
  const supabase = criarClienteNavegador();
  if (!supabase) throw new Error("Supabase desligado (NEXT_PUBLIC_USE_MOCKS=true).");
  return supabase;
}

function paraConversa(l: LinhaConversaResumo): Conversa {
  return {
    id: l.id,
    clienteId: l.cliente_id,
    prestadoraId: l.prestadora_id,
    criadaEm: l.criada_em,
    ultimaMensagemEm: l.ultima_mensagem_em,
    outra: {
      id: l.outra_id,
      nome: l.outra_nome ?? "",
      avatarUrl: l.outra_avatar_url,
      papel: l.outra_papel,
    },
    ultimaMensagem:
      l.ultima_mensagem_texto !== null && l.ultima_mensagem_autor_id !== null
        ? { texto: l.ultima_mensagem_texto, autorId: l.ultima_mensagem_autor_id }
        : null,
    naoLidas: l.nao_lidas,
  };
}

function paraMensagem(l: LinhaMensagem): Mensagem {
  return {
    id: l.id,
    conversaId: l.conversa_id,
    autorId: l.autor_id,
    texto: l.texto,
    criadaEm: l.criada_em,
    lidaEm: l.lida_em,
  };
}

// null = deslogada. Falha de rede ou do Supabase lança ErroIdentidade (P1),
// para a tela mostrar erro em vez de "entre na sua conta".
export async function obterUsuariaAtualId(): Promise<string | null> {
  const perfil = await servicoIdentidade(cliente()).obterMeuPerfil();
  return perfil?.id ?? null;
}

export async function listarConversas(): Promise<Conversa[]> {
  const { data, error } = await cliente()
    .from("conversas_resumo")
    .select("*")
    .order("ultima_mensagem_em", { ascending: false, nullsFirst: false })
    .order("criada_em", { ascending: false });
  if (error) falha(error);
  return (data as LinhaConversaResumo[]).map(paraConversa);
}

export async function obterConversa(id: number): Promise<Conversa | null> {
  const { data, error } = await cliente()
    .from("conversas_resumo")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) falha(error);
  return data ? paraConversa(data as LinhaConversaResumo) : null;
}

export async function listarMensagens(conversaId: number): Promise<Mensagem[]> {
  const { data, error } = await cliente()
    .from("mensagens")
    .select(COLUNAS_MENSAGEM)
    .eq("conversa_id", conversaId)
    .order("criada_em", { ascending: true })
    .order("id", { ascending: true });
  if (error) falha(error);
  return (data as LinhaMensagem[]).map(paraMensagem);
}

export async function enviarMensagem(conversaId: number, texto: string): Promise<Mensagem> {
  const autorId = await obterUsuariaAtualId();
  if (!autorId) throw new Error(ERRO_DESLOGADA);
  const { data, error } = await cliente()
    .from("mensagens")
    .insert({ conversa_id: conversaId, autor_id: autorId, texto })
    .select(COLUNAS_MENSAGEM)
    .single();
  if (error) falha(error);
  return paraMensagem(data as LinhaMensagem);
}

// iniciar_conversa(prestadora_id uuid) devolve uma linha de `conversas`; o
// PostgREST manda um objeto (não array). Conferido contra a 03 do #43.
export async function iniciarConversa(prestadoraId: string): Promise<Conversa> {
  const { data, error } = await cliente().rpc("iniciar_conversa", {
    prestadora_id: prestadoraId,
  });
  if (error) falha(error);
  const id = (data as { id?: unknown } | null)?.id;
  if (typeof id !== "number") throw new Error("Não consegui abrir a conversa. Tente de novo.");
  const conversa = await obterConversa(id);
  if (!conversa) throw new Error("Não consegui abrir a conversa. Tente de novo.");
  return conversa;
}

export async function marcarLidas(conversaId: number): Promise<number> {
  const { data, error } = await cliente().rpc("marcar_lidas", { conversa_id: conversaId });
  if (error) falha(error);
  return data as number;
}

export async function contarNaoLidas(): Promise<number> {
  const { data, error } = await cliente().rpc("nao_lidas");
  if (error) falha(error);
  return data as number;
}
