// Dados de exemplo do nicho (ar-condicionado, encanamento, montagem de móveis).
// Usados quando NEXT_PUBLIC_USE_MOCKS=true. As listas são mutáveis para o
// service mock conseguir criar, editar e apagar avaliações durante a sessão.
import type { FotoPortfolio, Perfil } from "./identidade-provisoria";
import type { Avaliacao, CategoriaResumo } from "./types";

export const CATEGORIAS_MOCK: CategoriaResumo[] = [
  { id: 1, nome: "Ar-condicionado" },
  { id: 2, nome: "Encanamento" },
  { id: 3, nome: "Elétrica" },
  { id: 4, nome: "Montagem de móveis" },
];

export const PRESTADORAS_MOCK: Perfil[] = [
  {
    id: "00000000-0000-4000-8000-0000000000a1",
    papel: "prestadora",
    nome: "Marina Souza",
    avatarUrl: null,
    bio: "Instalação e limpeza de ar-condicionado split. Atendo com hora marcada.",
    cidade: "João Pessoa",
  },
  {
    id: "00000000-0000-4000-8000-0000000000a2",
    papel: "prestadora",
    nome: "Camila Ribeiro",
    avatarUrl: null,
    bio: "Encanadora: vazamentos, torneiras, descargas e chuveiros.",
    cidade: "Recife",
  },
  {
    id: "00000000-0000-4000-8000-0000000000a3",
    papel: "prestadora",
    nome: "Joana Lima",
    avatarUrl: null,
    bio: "Monto guarda-roupas, camas, estantes e prateleiras.",
    cidade: "João Pessoa",
  },
  {
    id: "00000000-0000-4000-8000-0000000000a4",
    papel: "prestadora",
    nome: "Aline Costa",
    avatarUrl: null,
    bio: "Eletricista: tomadas, chuveiro elétrico e troca de fiação.",
    cidade: "Natal",
  },
];

export const CLIENTES_MOCK: Perfil[] = [
  {
    id: "00000000-0000-4000-8000-0000000000c1",
    papel: "cliente",
    nome: "Beatriz Alves",
    avatarUrl: null,
    bio: null,
    cidade: "João Pessoa",
  },
  {
    id: "00000000-0000-4000-8000-0000000000c2",
    papel: "cliente",
    nome: "Fernanda Dias",
    avatarUrl: null,
    bio: null,
    cidade: "Recife",
  },
];

// prestadora -> ids das categorias (equivale a `servicos_prestadora`)
export const SERVICOS_MOCK: Record<string, number[]> = {
  "00000000-0000-4000-8000-0000000000a1": [1],
  "00000000-0000-4000-8000-0000000000a2": [2],
  "00000000-0000-4000-8000-0000000000a3": [4],
  "00000000-0000-4000-8000-0000000000a4": [3, 2],
};

export const FOTOS_MOCK: FotoPortfolio[] = [
  { id: 1, prestadoraId: "00000000-0000-4000-8000-0000000000a1", caminho: "mock/ar-1.jpg" },
  { id: 2, prestadoraId: "00000000-0000-4000-8000-0000000000a1", caminho: "mock/ar-2.jpg" },
  { id: 3, prestadoraId: "00000000-0000-4000-8000-0000000000a2", caminho: "mock/cano-1.jpg" },
  { id: 4, prestadoraId: "00000000-0000-4000-8000-0000000000a3", caminho: "mock/movel-1.jpg" },
];

export const AVALIACOES_MOCK: Avaliacao[] = [
  {
    id: 1,
    prestadoraId: "00000000-0000-4000-8000-0000000000a1",
    clienteId: "00000000-0000-4000-8000-0000000000c1",
    nota: 5,
    comentario: "Instalou o split no mesmo dia e deixou tudo limpo.",
    criadaEm: "2026-11-10T14:30:00Z",
    prestadoraNome: "Marina Souza",
    prestadoraAvatarUrl: null,
    clienteNome: "Beatriz Alves",
    clienteAvatarUrl: null,
  },
  {
    id: 2,
    prestadoraId: "00000000-0000-4000-8000-0000000000a1",
    clienteId: "00000000-0000-4000-8000-0000000000c2",
    nota: 4,
    comentario: null,
    criadaEm: "2026-11-12T09:00:00Z",
    prestadoraNome: "Marina Souza",
    prestadoraAvatarUrl: null,
    clienteNome: "Fernanda Dias",
    clienteAvatarUrl: null,
  },
  {
    id: 3,
    prestadoraId: "00000000-0000-4000-8000-0000000000a2",
    clienteId: "00000000-0000-4000-8000-0000000000c2",
    nota: 5,
    comentario: "Resolveu o vazamento da pia rapidinho.",
    criadaEm: "2026-11-15T17:45:00Z",
    prestadoraNome: "Camila Ribeiro",
    prestadoraAvatarUrl: null,
    clienteNome: "Fernanda Dias",
    clienteAvatarUrl: null,
  },
];
