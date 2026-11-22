// Dados de mentira do chat (NEXT_PUBLIC_USE_MOCKS=true), no nicho real:
// mulheres em João Pessoa combinando serviços domésticos.
import type { Perfil } from "./identidade-provisoria";
import type { Mensagem } from "./types";

// Quem está "logada" em modo mock. Troque para PERFIS_MOCK[2].id para ver o
// chat do lado da prestadora.
export const USUARIA_MOCK_ID = "a0000000-0000-0000-0000-000000000001";

export const PERFIS_MOCK: Perfil[] = [
  {
    id: "a0000000-0000-0000-0000-000000000001",
    papel: "cliente",
    nome: "Ana Souza",
    avatarUrl: null,
    bio: "Moro sozinha em Manaíra e prefiro contratar mulheres.",
    cidade: "João Pessoa",
  },
  {
    id: "b0000000-0000-0000-0000-000000000002",
    papel: "cliente",
    nome: "Bia Lima",
    avatarUrl: null,
    bio: null,
    cidade: "João Pessoa",
  },
  {
    id: "c0000000-0000-0000-0000-000000000003",
    papel: "prestadora",
    nome: "Carla Ar-Condicionado",
    avatarUrl: null,
    bio: "Instalação e limpeza de split há 8 anos.",
    cidade: "João Pessoa",
  },
  {
    id: "d0000000-0000-0000-0000-000000000004",
    papel: "prestadora",
    nome: "Dani Encanadora",
    avatarUrl: null,
    bio: "Vazamentos, torneiras e caixas d'água.",
    cidade: "João Pessoa",
  },
  {
    id: "e0000000-0000-0000-0000-000000000005",
    papel: "prestadora",
    nome: "Eva Montagem de Móveis",
    avatarUrl: null,
    bio: "Monto guarda-roupa, cama e estante no mesmo dia.",
    cidade: "João Pessoa",
  },
];

export type ConversaMock = {
  id: number;
  clienteId: string;
  prestadoraId: string;
  criadaEm: string;
};

export const CONVERSAS_MOCK: ConversaMock[] = [
  {
    id: 1,
    clienteId: "a0000000-0000-0000-0000-000000000001",
    prestadoraId: "c0000000-0000-0000-0000-000000000003",
    criadaEm: "2026-11-20T13:00:00Z",
  },
  {
    id: 2,
    clienteId: "a0000000-0000-0000-0000-000000000001",
    prestadoraId: "d0000000-0000-0000-0000-000000000004",
    criadaEm: "2026-11-21T18:30:00Z",
  },
  {
    id: 3,
    clienteId: "b0000000-0000-0000-0000-000000000002",
    prestadoraId: "c0000000-0000-0000-0000-000000000003",
    criadaEm: "2026-11-22T09:00:00Z",
  },
];

export const MENSAGENS_MOCK: Mensagem[] = [
  {
    id: 1,
    conversaId: 1,
    autorId: "a0000000-0000-0000-0000-000000000001",
    texto: "Oi, Carla! Quanto fica a limpeza de um split de 12 mil BTUs?",
    criadaEm: "2026-11-20T13:01:00Z",
    lidaEm: "2026-11-20T13:05:00Z",
  },
  {
    id: 2,
    conversaId: 1,
    autorId: "c0000000-0000-0000-0000-000000000003",
    texto: "Oi, Ana! Fica R$ 150 com a higienização. Posso ir quinta de manhã.",
    criadaEm: "2026-11-20T13:06:00Z",
    lidaEm: "2026-11-20T13:10:00Z",
  },
  {
    id: 3,
    conversaId: 1,
    autorId: "a0000000-0000-0000-0000-000000000001",
    texto: "Fechado! Moro em Manaíra, te mando o endereço certinho na quarta.",
    criadaEm: "2026-11-20T13:11:00Z",
    lidaEm: "2026-11-20T14:00:00Z",
  },
  {
    id: 4,
    conversaId: 1,
    autorId: "c0000000-0000-0000-0000-000000000003",
    texto: "Combinado. Até quinta!",
    criadaEm: "2026-11-21T08:00:00Z",
    lidaEm: null,
  },
  {
    id: 5,
    conversaId: 2,
    autorId: "a0000000-0000-0000-0000-000000000001",
    texto: "Oi, Dani! A torneira da cozinha está pingando. Você atende no Bessa?",
    criadaEm: "2026-11-21T18:31:00Z",
    lidaEm: null,
  },
  {
    id: 6,
    conversaId: 3,
    autorId: "b0000000-0000-0000-0000-000000000002",
    texto: "Oi! Você instala ar-condicionado em apartamento?",
    criadaEm: "2026-11-22T09:01:00Z",
    lidaEm: null,
  },
];
