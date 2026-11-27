// Quem segue quem no modo mock (NEXT_PUBLIC_USE_MOCKS=true). Os perfis vêm
// do mock da identidade (P1), com os mesmos ids.
import {
  ID_CLIENTE_BEATRIZ,
  ID_CLIENTE_FERNANDA,
  ID_PRESTADORA_CAMILA,
  ID_PRESTADORA_JOANA,
  ID_PRESTADORA_MARINA,
} from "@/lib/identidade/mocks";

export type SeguimentoMock = {
  seguidoraId: string;
  seguidaId: string;
  criadoEm: string;
};

export const SEGUIDORES_MOCK: readonly SeguimentoMock[] = [
  // Amigas que se seguem e veem as indicações uma da outra.
  { seguidoraId: ID_CLIENTE_BEATRIZ, seguidaId: ID_CLIENTE_FERNANDA, criadoEm: "2026-11-08T10:00:00Z" },
  { seguidoraId: ID_CLIENTE_FERNANDA, seguidaId: ID_CLIENTE_BEATRIZ, criadoEm: "2026-11-08T11:00:00Z" },
  // Clientes que acompanham prestadoras.
  { seguidoraId: ID_CLIENTE_BEATRIZ, seguidaId: ID_PRESTADORA_MARINA, criadoEm: "2026-11-10T15:00:00Z" },
  { seguidoraId: ID_CLIENTE_FERNANDA, seguidaId: ID_PRESTADORA_MARINA, criadoEm: "2026-11-12T09:30:00Z" },
  { seguidoraId: ID_CLIENTE_FERNANDA, seguidaId: ID_PRESTADORA_CAMILA, criadoEm: "2026-11-15T18:00:00Z" },
  // Prestadoras também se seguem (indicam umas às outras).
  { seguidoraId: ID_PRESTADORA_MARINA, seguidaId: ID_PRESTADORA_JOANA, criadoEm: "2026-11-09T08:00:00Z" },
];
