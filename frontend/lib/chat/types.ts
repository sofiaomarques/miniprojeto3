// Contrato da área de chat (P3). Datas em ISO 8601 UTC.
// Os nomes espelham a migration 03_chat.sql, em camelCase.
import type { Papel } from "@/lib/identidade/types";

// Mesmo limite do CHECK de mensagens.texto na 03 (em caracteres, não em
// unidades UTF-16: um emoji conta 1).
export const LIMITE_TEXTO_MENSAGEM = 2000;

// A outra pessoa da conversa, do ponto de vista de quem está logada.
export type Participante = {
  id: string;
  nome: string; // "" se o perfil não estiver visível
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

export const ERRO_DESLOGADA = "Entre na sua conta para conversar.";

// Mesma ordem nos dois modos (e na view): a conversa com mensagem mais
// recente primeiro; conversas ainda sem mensagem no fim, mais novas antes.
export function ordenarConversas(lista: Conversa[]): Conversa[] {
  return [...lista].sort((a, b) => {
    if (a.ultimaMensagemEm !== b.ultimaMensagemEm) {
      if (a.ultimaMensagemEm === null) return 1;
      if (b.ultimaMensagemEm === null) return -1;
      return b.ultimaMensagemEm.localeCompare(a.ultimaMensagemEm);
    }
    return b.criadaEm.localeCompare(a.criadaEm) || b.id - a.id;
  });
}

// Tempo real (#37): quem assina recebe cada mensagem nova da conversa e
// chama a função devolvida para parar (ao sair da tela ou trocar de conversa).
export type AoChegarMensagem = (mensagem: Mensagem) => void;
export type CancelarAssinatura = () => void;

// Plano B quando o Realtime não conecta: consulta o banco nesse intervalo.
export const INTERVALO_CONSULTA_MS = 2500;

// Junta uma mensagem à lista sem duplicar: a própria mensagem enviada chega
// duas vezes (resposta do insert e evento do Realtime). Mantém a ordem.
export function juntarMensagens(lista: Mensagem[], nova: Mensagem): Mensagem[] {
  if (lista.some((m) => m.id === nova.id)) return lista;
  return [...lista, nova].sort((a, b) => a.criadaEm.localeCompare(b.criadaEm) || a.id - b.id);
}

// Uma linha de `mensagens`.
export type Mensagem = {
  id: number;
  conversaId: number;
  autorId: string;
  texto: string;
  criadaEm: string;
  lidaEm: string | null;
};
