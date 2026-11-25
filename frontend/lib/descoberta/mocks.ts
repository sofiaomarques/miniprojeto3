// Avaliações de exemplo (NEXT_PUBLIC_USE_MOCKS=true). Perfis, categorias,
// serviços e fotos vêm dos mocks da identidade (P1), com os mesmos ids.
import {
  ID_CLIENTE_BEATRIZ,
  ID_CLIENTE_FERNANDA,
  ID_PRESTADORA_CAMILA,
  ID_PRESTADORA_MARINA,
} from "@/lib/identidade/mocks";

export type AvaliacaoMock = {
  id: number;
  prestadoraId: string;
  clienteId: string;
  nota: number;
  comentario: string | null;
  criadaEm: string;
};

export const AVALIACOES_MOCK: readonly AvaliacaoMock[] = [
  {
    id: 1,
    prestadoraId: ID_PRESTADORA_MARINA,
    clienteId: ID_CLIENTE_BEATRIZ,
    nota: 5,
    comentario: "Instalou o split no mesmo dia e deixou tudo limpo.",
    criadaEm: "2026-11-10T14:30:00Z",
  },
  {
    id: 2,
    prestadoraId: ID_PRESTADORA_MARINA,
    clienteId: ID_CLIENTE_FERNANDA,
    nota: 4,
    comentario: null,
    criadaEm: "2026-11-12T09:00:00Z",
  },
  {
    id: 3,
    prestadoraId: ID_PRESTADORA_CAMILA,
    clienteId: ID_CLIENTE_FERNANDA,
    nota: 5,
    comentario: "Resolveu o vazamento da pia rapidinho.",
    criadaEm: "2026-11-15T17:45:00Z",
  },
];
