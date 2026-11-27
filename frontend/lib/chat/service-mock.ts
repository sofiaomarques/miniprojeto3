// Implementação em memória do service (NEXT_PUBLIC_USE_MOCKS=true).
// Replica as regras da 03_chat.sql: uma conversa por par, só cliente inicia,
// só com prestadora, só as participantes leem e escrevem, marcar_lidas só
// marca o que a usuária recebeu.
//
// Quem está logada vem do mock da identidade (P1); ver mocks.ts.
import { perfisMockAtuais } from "@/lib/identidade/mocks";
import { servicoIdentidade } from "@/lib/identidade/service";
import type { Perfil } from "@/lib/identidade/types";
import { CONVERSAS_MOCK, type ConversaMock, MENSAGENS_MOCK } from "./mocks";
import {
  type AoChegarMensagem,
  type AoMudarNaoLidas,
  type CancelarAssinatura,
  type Conversa,
  ERRO_DESLOGADA,
  type Mensagem,
  ordenarConversas,
} from "./types";

const conversas: ConversaMock[] = CONVERSAS_MOCK.map((c) => ({ ...c }));
const mensagens: Mensagem[] = MENSAGENS_MOCK.map((m) => ({ ...m }));
let proximaConversaId = Math.max(0, ...conversas.map((c) => c.id)) + 1;

// Ids de mensagens novas a partir do relógio: cada aba tem a própria memória,
// e um contador por aba repetiria ids (a mensagem da outra aba seria descartada
// como duplicada). Cabe com folga no limite seguro de inteiros do JS.
let ultimoIdGerado = 0;
function novoIdMensagem(): number {
  ultimoIdGerado = Math.max(ultimoIdGerado + 1, Date.now() * 1000 + Math.floor(Math.random() * 1000));
  return ultimoIdGerado;
}

// Tempo real no mock (#37): avisa quem assinou nesta aba e, pelo
// BroadcastChannel, as outras abas abertas do mesmo site. Assim dá para ver
// uma mensagem enviada numa aba aparecer na outra sem o Supabase.
type Ouvinte = { conversaId: number; aoChegar: AoChegarMensagem };
const ouvintes = new Set<Ouvinte>();
const outrasAbas =
  typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel("rede-chat-mock");

// Não lidas (#38): quem assina é avisado quando o total pode ter mudado.
const ouvintesNaoLidas = new Set<AoMudarNaoLidas>();

function avisarNaoLidas() {
  for (const aoMudar of ouvintesNaoLidas) aoMudar();
}

function avisar(mensagem: Mensagem) {
  for (const o of ouvintes) {
    if (o.conversaId === mensagem.conversaId) o.aoChegar({ ...mensagem });
  }
  avisarNaoLidas();
}

outrasAbas?.addEventListener("message", (evento: MessageEvent<Mensagem>) => {
  const mensagem = evento.data;
  if (mensagens.some((m) => m.id === mensagem.id)) return;
  mensagens.push(mensagem);
  avisar(mensagem);
});

// Estado atual da identidade mock: nome e avatar mudados no perfil aparecem
// no chat, como na conversas_resumo real.
function perfil(id: string): Perfil | undefined {
  return perfisMockAtuais().find((p) => p.id === id);
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
    id: novoIdMensagem(),
    conversaId,
    autorId: id,
    texto,
    criadaEm: new Date().toISOString(),
    lidaEm: null,
  };
  mensagens.push(nova);
  avisar(nova);
  outrasAbas?.postMessage(nova);
  return { ...nova };
}

export function assinarMensagens(
  conversaId: number,
  _ultimoIdConhecido: number,
  aoChegar: AoChegarMensagem,
): CancelarAssinatura {
  const ouvinte: Ouvinte = { conversaId, aoChegar };
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
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
  if (marcadas > 0) avisarNaoLidas();
  return marcadas;
}

export async function contarNaoLidas(): Promise<number> {
  return (await listarConversas()).reduce((total, c) => total + c.naoLidas, 0);
}

export function assinarNaoLidas(aoMudar: AoMudarNaoLidas): CancelarAssinatura {
  ouvintesNaoLidas.add(aoMudar);
  return () => {
    ouvintesNaoLidas.delete(aoMudar);
  };
}
