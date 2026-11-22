// Implementação em memória do service (NEXT_PUBLIC_USE_MOCKS=true).
// Replica as regras da 03_chat.sql: uma conversa por par, só cliente inicia,
// só com prestadora, só as participantes leem e escrevem, marcar_lidas só
// marca o que a usuária recebeu.
import type { Perfil } from "./identidade-provisoria";
import {
  CONVERSAS_MOCK,
  type ConversaMock,
  MENSAGENS_MOCK,
  PERFIS_MOCK,
  USUARIA_MOCK_ID,
} from "./mocks";
import type { Conversa, Mensagem } from "./types";

const conversas: ConversaMock[] = CONVERSAS_MOCK.map((c) => ({ ...c }));
const mensagens: Mensagem[] = MENSAGENS_MOCK.map((m) => ({ ...m }));
let proximaConversaId = Math.max(0, ...conversas.map((c) => c.id)) + 1;
let proximaMensagemId = Math.max(0, ...mensagens.map((m) => m.id)) + 1;

function perfil(id: string): Perfil | undefined {
  return PERFIS_MOCK.find((p) => p.id === id);
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
      avatarUrl: outra?.avatarUrl ?? null,
      papel: outra?.papel ?? null,
    },
    ultimaMensagem: ultima ? { texto: ultima.texto, autorId: ultima.autorId } : null,
    naoLidas: doChat.filter((m) => m.autorId !== usuariaId && m.lidaEm === null).length,
  };
}

function minhaConversa(conversaId: number): ConversaMock | undefined {
  return conversas.find((c) => c.id === conversaId && participa(c, USUARIA_MOCK_ID));
}

export async function obterUsuariaAtualId(): Promise<string | null> {
  return USUARIA_MOCK_ID;
}

export async function listarConversas(): Promise<Conversa[]> {
  return conversas
    .filter((c) => participa(c, USUARIA_MOCK_ID))
    .map((c) => resumir(c, USUARIA_MOCK_ID))
    .sort((a, b) =>
      (b.ultimaMensagemEm ?? b.criadaEm).localeCompare(a.ultimaMensagemEm ?? a.criadaEm),
    );
}

export async function obterConversa(id: number): Promise<Conversa | null> {
  const c = minhaConversa(id);
  return c ? resumir(c, USUARIA_MOCK_ID) : null;
}

export async function listarMensagens(conversaId: number): Promise<Mensagem[]> {
  return minhaConversa(conversaId) ? daConversa(conversaId).map((m) => ({ ...m })) : [];
}

export async function enviarMensagem(conversaId: number, texto: string): Promise<Mensagem> {
  if (!minhaConversa(conversaId)) throw new Error("Conversa não encontrada.");
  const nova: Mensagem = {
    id: proximaMensagemId++,
    conversaId,
    autorId: USUARIA_MOCK_ID,
    texto,
    criadaEm: new Date().toISOString(),
    lidaEm: null,
  };
  mensagens.push(nova);
  return { ...nova };
}

export async function iniciarConversa(prestadoraId: string): Promise<Conversa> {
  if (perfil(USUARIA_MOCK_ID)?.papel !== "cliente") {
    throw new Error("Só clientes podem iniciar uma conversa.");
  }
  if (perfil(prestadoraId)?.papel !== "prestadora") {
    throw new Error("Prestadora não encontrada.");
  }
  let c = conversas.find(
    (x) => x.clienteId === USUARIA_MOCK_ID && x.prestadoraId === prestadoraId,
  );
  if (!c) {
    c = {
      id: proximaConversaId++,
      clienteId: USUARIA_MOCK_ID,
      prestadoraId,
      criadaEm: new Date().toISOString(),
    };
    conversas.push(c);
  }
  return resumir(c, USUARIA_MOCK_ID);
}

export async function marcarLidas(conversaId: number): Promise<number> {
  if (!minhaConversa(conversaId)) return 0;
  const agora = new Date().toISOString();
  let marcadas = 0;
  for (const m of mensagens) {
    if (m.conversaId === conversaId && m.autorId !== USUARIA_MOCK_ID && m.lidaEm === null) {
      m.lidaEm = agora;
      marcadas++;
    }
  }
  return marcadas;
}

export async function contarNaoLidas(): Promise<number> {
  return (await listarConversas()).reduce((total, c) => total + c.naoLidas, 0);
}
