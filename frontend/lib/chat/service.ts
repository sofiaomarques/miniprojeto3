// Ponto único de acesso da área de chat. As telas importam só daqui;
// NEXT_PUBLIC_USE_MOCKS troca mock e banco real sem mexer em componente.
// Só para Client Components (o modo real usa o cliente do navegador).
//
// Contrato para as outras pessoas:
//   P2 (#25): o botão "Conversar" chama iniciarConversa(prestadoraId) e
//             navega para `/chat/${conversa.id}`.
//   P1 (#15): a navbar mostra <UnreadBadge /> (#38), que usa contarNaoLidas().
import { usarMocks } from "@/lib/supabase/config";
import * as mock from "./service-mock";
import * as real from "./service-supabase";
import { type Conversa, LIMITE_TEXTO_MENSAGEM, type Mensagem } from "./types";

const impl = usarMocks ? mock : real;

// Quantos caracteres o Postgres conta (char_length): um emoji vale 1, não 2.
export function contarCaracteres(texto: string): number {
  return [...texto].length;
}

// Mesma regra do CHECK da 03: não vazio (nem só espaços/quebras) e até 2000.
export function validarTexto(texto: string): string {
  const limpo = texto.trim();
  if (!limpo) throw new Error("Escreva uma mensagem antes de enviar.");
  if (contarCaracteres(limpo) > LIMITE_TEXTO_MENSAGEM) {
    throw new Error(`A mensagem pode ter no máximo ${LIMITE_TEXTO_MENSAGEM} caracteres.`);
  }
  return limpo;
}

// id de quem está logada (para saber de que lado fica cada mensagem).
export function obterUsuariaAtualId(): Promise<string | null> {
  return impl.obterUsuariaAtualId();
}

// Conversas da usuária, a mais recente primeiro.
export function listarConversas(): Promise<Conversa[]> {
  return impl.listarConversas();
}

// null se a conversa não existe ou não é da usuária.
export function obterConversa(id: number): Promise<Conversa | null> {
  return impl.obterConversa(id);
}

// Mensagens da conversa, da mais antiga para a mais nova.
export function listarMensagens(conversaId: number): Promise<Mensagem[]> {
  return impl.listarMensagens(conversaId);
}

export function enviarMensagem(conversaId: number, texto: string): Promise<Mensagem> {
  return impl.enviarMensagem(conversaId, validarTexto(texto));
}

// Devolve a conversa existente com a prestadora ou cria. Só cliente chama.
export function iniciarConversa(prestadoraId: string): Promise<Conversa> {
  return impl.iniciarConversa(prestadoraId);
}

// Marca como lidas as mensagens recebidas na conversa; devolve quantas.
export function marcarLidas(conversaId: number): Promise<number> {
  return impl.marcarLidas(conversaId);
}

// Total de mensagens não lidas da usuária (para o <UnreadBadge />).
export function contarNaoLidas(): Promise<number> {
  return impl.contarNaoLidas();
}
