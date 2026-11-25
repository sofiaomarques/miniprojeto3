// Conversas de mentira do chat (NEXT_PUBLIC_USE_MOCKS=true), no nicho real:
// mulheres em João Pessoa e Recife combinando serviços domésticos.
//
// Os perfis e a conta "logada" vêm dos mocks da identidade (P1), com os mesmos
// ids da descoberta (P2). A conta padrão é a prestadora Marina; para ver o
// lado da cliente, use definirUsuariaMock(ID_CLIENTE_BEATRIZ) de
// "@/lib/identidade/mocks" (e definirUsuariaMock(null) para deslogada).
import {
  ID_CLIENTE_BEATRIZ,
  ID_CLIENTE_FERNANDA,
  ID_PRESTADORA_CAMILA,
  ID_PRESTADORA_JOANA,
  ID_PRESTADORA_MARINA,
} from "@/lib/identidade/mocks";
import type { Mensagem } from "./types";

export type ConversaMock = {
  id: number;
  clienteId: string;
  prestadoraId: string;
  criadaEm: string;
};

export const CONVERSAS_MOCK: readonly ConversaMock[] = [
  // id 1 = Beatriz × Marina: é a conversa que o botão "Conversar" da P2 abre
  // no mock quando Beatriz está logada (iniciarConversa devolve a existente).
  {
    id: 1,
    clienteId: ID_CLIENTE_BEATRIZ,
    prestadoraId: ID_PRESTADORA_MARINA,
    criadaEm: "2026-11-20T13:00:00.000Z",
  },
  {
    id: 2,
    clienteId: ID_CLIENTE_FERNANDA,
    prestadoraId: ID_PRESTADORA_MARINA,
    criadaEm: "2026-11-22T09:00:00.000Z",
  },
  {
    id: 3,
    clienteId: ID_CLIENTE_BEATRIZ,
    prestadoraId: ID_PRESTADORA_JOANA,
    criadaEm: "2026-11-21T18:30:00.000Z",
  },
  // A Marina não participa desta: /chat/4 mostra "Conversa não encontrada" para ela.
  {
    id: 4,
    clienteId: ID_CLIENTE_FERNANDA,
    prestadoraId: ID_PRESTADORA_CAMILA,
    criadaEm: "2026-11-22T10:00:00.000Z",
  },
];

export const MENSAGENS_MOCK: readonly Mensagem[] = [
  {
    id: 1,
    conversaId: 1,
    autorId: ID_CLIENTE_BEATRIZ,
    texto: "Oi, Marina! Quanto fica a limpeza de um split de 12 mil BTUs?",
    criadaEm: "2026-11-20T13:01:00.000Z",
    lidaEm: "2026-11-20T13:05:00.000Z",
  },
  {
    id: 2,
    conversaId: 1,
    autorId: ID_PRESTADORA_MARINA,
    texto: "Oi, Beatriz! Fica R$ 150 com a higienização. Posso ir quinta de manhã.",
    criadaEm: "2026-11-20T13:06:00.000Z",
    lidaEm: "2026-11-20T13:10:00.000Z",
  },
  {
    id: 3,
    conversaId: 1,
    autorId: ID_CLIENTE_BEATRIZ,
    texto: "Fechado! Moro em Manaíra, te mando o endereço certinho na quarta.",
    criadaEm: "2026-11-20T13:11:00.000Z",
    lidaEm: "2026-11-20T14:00:00.000Z",
  },
  {
    id: 4,
    conversaId: 1,
    autorId: ID_PRESTADORA_MARINA,
    texto: "Combinado. Até quinta!",
    criadaEm: "2026-11-21T08:00:00.000Z",
    lidaEm: null,
  },
  {
    id: 5,
    conversaId: 2,
    autorId: ID_CLIENTE_FERNANDA,
    texto: "Oi! Você instala ar-condicionado em apartamento? É um 9 mil BTUs.",
    criadaEm: "2026-11-22T09:01:00.000Z",
    lidaEm: null,
  },
  {
    id: 6,
    conversaId: 2,
    autorId: ID_CLIENTE_FERNANDA,
    texto: "Já tenho o suporte, falta só a instalação.",
    criadaEm: "2026-11-22T09:02:00.000Z",
    lidaEm: null,
  },
  {
    id: 7,
    conversaId: 3,
    autorId: ID_CLIENTE_BEATRIZ,
    texto: "Oi, Joana! Preciso montar um guarda-roupa de 6 portas. Você tem horário sábado?",
    criadaEm: "2026-11-21T18:31:00.000Z",
    lidaEm: null,
  },
  {
    id: 8,
    conversaId: 4,
    autorId: ID_CLIENTE_FERNANDA,
    texto: "Oi, Camila! A torneira da cozinha está pingando. Você atende em Boa Viagem?",
    criadaEm: "2026-11-22T10:01:00.000Z",
    lidaEm: null,
  },
];
