// Início de conversa com uma prestadora (botão "Conversar" da #25).
// A função de verdade é `iniciarConversa` da P3 (lib/chat/service.ts, #35), que
// ainda não está no main. Até lá, o mock devolve uma conversa de exemplo e o
// modo real avisa que o chat não está disponível.
// TODO: quando lib/chat entrar no main, apagar este arquivo e importar
// `iniciarConversa` de "@/lib/chat/service" no BotaoConversar.
import { USAR_MOCKS } from "./service";

export type ConversaIniciada = { id: number };

export async function iniciarConversa(prestadoraId: string): Promise<ConversaIniciada> {
  if (!USAR_MOCKS) {
    throw new Error("O chat ainda não está disponível neste ambiente.");
  }
  if (!prestadoraId) throw new Error("Prestadora inválida.");
  return { id: 1 };
}
