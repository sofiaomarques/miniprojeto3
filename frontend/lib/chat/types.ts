// Contrato da área de chat (P3). Datas em ISO 8601 UTC.
// Os nomes espelham a migration 03_chat.sql, em camelCase.
import type { Papel } from "./identidade-provisoria";

// Mesmo limite do CHECK de mensagens.texto na 03.
export const LIMITE_TEXTO_MENSAGEM = 2000;

// A outra pessoa da conversa, do ponto de vista de quem está logada.
export type Participante = {
  id: string;
  nome: string;
  avatarUrl: string | null;
  papel: Papel | null;
};

// Uma linha da view `conversas_resumo`.
export type Conversa = {
  id: number;
  clienteId: string;
  prestadoraId: string;
  criadaEm: string;
  ultimaMensagemEm: string | null; // null enquanto ninguém escreveu
  outra: Participante;
  ultimaMensagem: { texto: string; autorId: string } | null;
  naoLidas: number; // mensagens recebidas nesta conversa ainda não lidas
};

// Uma linha de `mensagens`.
export type Mensagem = {
  id: number;
  conversaId: number;
  autorId: string;
  texto: string;
  criadaEm: string;
  lidaEm: string | null;
};
