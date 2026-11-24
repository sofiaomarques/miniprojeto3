// Implementação em memória do service (NEXT_PUBLIC_USE_MOCKS=true).
// Replica as regras da 03_chat.sql: uma conversa por par, só cliente inicia,
// só com prestadora, só as participantes leem e escrevem, marcar_lidas só
// marca o que a usuária recebeu.
//
// Quem está logada vem do mock da identidade (P1); ver mocks.ts.
import { PERFIS_MOCK } from "@/lib/identidade/mocks";
import { servicoIdentidade } from "@/lib/identidade/service";
import type { Perfil } from "@/lib/identidade/types";
import { CONVERSAS_MOCK, type ConversaMock, MENSAGENS_MOCK } from "./mocks";
import { type Conversa, ERRO_DESLOGADA, type Mensagem, ordenarConversas } from "./types";

const conversas: ConversaMock[] = CONVERSAS_MOCK.map((c) => ({ ...c }));
const mensagens: Mensagem[] = MENSAGENS_MOCK.map((m) => ({ ...m }));
let proximaConversaId = Math.max(0, ...conversas.map((c) => c.id)) + 1;
let proximaMensagemId = Math.max(0, ...mensagens.map((m) => m.id)) + 1;

function perfil(id: string): Perfil | undefined {
  return PERFIS_MOCK.find((p) => p.id === id);
}

async function eu(): Promise<Perfil | null> {
  return servicoIdentidade(null).obterMeuPerfil();
}

async function exigirEu(): Promise<Perfil> {
  const quem = await eu();
  if (!quem) throw new Error(ERRO_DESLOGADA);
  return quem;
}

function participa(c: ConversaMock, usuariaId: string): boolean {
  return c.clienteId === usuariaId || c.prestadoraId === usuariaId;
}

function daConversa(conversaId: number): Mensagem[] {
  return mensagens
    .filter((m) => m.conversaId === conversaId)
    .sort((a, b) => a.criadaEm.localeCompare(b.criadaEm) || a.id - b.id);
}

function resumir(c: ConversaMock, usuariaId: string): Conversa {
  const outraId = c.clienteId === usuariaId ? c.prestadoraId : c.clienteId;
  const outra = perfil(outraId);
  const doChat = daConversa(c.id);
  const ultima = doChat.at(-1) ?? null;
  return {
    id: c.id,
    clienteId: c.clienteId,
    prestadoraId: c.prestadoraId,
    criadaEm: c.criadaEm,
    ultimaMensagemEm: ultima?.criadaEm ?? null,
    outra: {
      id: outraId,
      nome: outra?.nome ?? "",
      avatarUrl: outra?.avatar_url ?? null,
      papel: outra?.papel ?? null,
    },
    ultimaMensagem: ultima ? { texto: ultima.texto, autorId: ultima.autorId } : null,
    naoLidas: doChat.filter((m) => m.autorId !== usuariaId && m.lidaEm === null).length,
  };
}

function minhaConversa(conversaId: number, usuariaId: string): ConversaMock | undefined {
  return conversas.find((c) => c.id === conversaId && participa(c, usuariaId));
}

export async function obterUsuariaAtualId(): Promise<string | null> {
  return (await eu())?.id ?? null;
}

export async function listarConversas(): Promise<Conversa[]> {
  const { id } = await exigirEu();
  return ordenarConversas(conversas.filter((c) => participa(c, id)).map((c) => resumir(c, id)));
}

export async function obterConversa(conversaId: number): Promise<Conversa | null> {
  const { id } = await exigirEu();
  const c = minhaConversa(conversaId, id);
  return c ? resumir(c, id) : null;
}

export async function listarMensagens(conversaId: number): Promise<Mensagem[]> {
  const { id } = await exigirEu();
  return minhaConversa(conversaId, id) ? daConversa(conversaId).map((m) => ({ ...m })) : [];
}

export async function enviarMensagem(conversaId: number, texto: string): Promise<Mensagem> {
  const { id } = await exigirEu();
  if (!minhaConversa(conversaId, id)) throw new Error("Conversa não encontrada.");
  const nova: Mensagem = {
    id: proximaMensagemId++,
    conversaId,
    autorId: id,
    texto,
    criadaEm: new Date().toISOString(),
    lidaEm: null,
  };
  mensagens.push(nova);
  return { ...nova };
}

export async function iniciarConversa(prestadoraId: string): Promise<Conversa> {
  const quem = await exigirEu();
  if (quem.papel !== "cliente") throw new Error("Só clientes podem iniciar uma conversa.");
  if (perfil(prestadoraId)?.papel !== "prestadora") throw new Error("Prestadora não encontrada.");
  let c = conversas.find((x) => x.clienteId === quem.id && x.prestadoraId === prestadoraId);
  if (!c) {
    c = {
      id: proximaConversaId++,
      clienteId: quem.id,
      prestadoraId,
      criadaEm: new Date().toISOString(),
    };
    conversas.push(c);
  }
  return resumir(c, quem.id);
}

export async function marcarLidas(conversaId: number): Promise<number> {
  const { id } = await exigirEu();
  if (!minhaConversa(conversaId, id)) return 0;
  const agora = new Date().toISOString();
  let marcadas = 0;
  for (const m of mensagens) {
    if (m.conversaId === conversaId && m.autorId !== id && m.lidaEm === null) {
      m.lidaEm = agora;
      marcadas++;
    }
  }
  return marcadas;
}

export async function contarNaoLidas(): Promise<number> {
  return (await listarConversas()).reduce((total, c) => total + c.naoLidas, 0);
}
