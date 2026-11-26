// Contrato da área de descoberta (P2). Datas em ISO 8601 UTC.
// Os nomes espelham a migration 02_descoberta.sql, em camelCase. Perfil e
// FotoPortfolio são da identidade (P1), com os nomes de coluna do banco.
import type { FotoPortfolio, Perfil } from "@/lib/identidade/types";

export type CategoriaResumo = {
  id: number;
  nome: string;
};

// Uma linha da view `prestadoras_resumo`.
export type PrestadoraResumo = {
  id: string;
  nome: string;
  avatarUrl: string | null;
  cidade: string | null;
  categorias: CategoriaResumo[]; // a "função" da prestadora (ex.: encanamento)
  notaMedia: number | null; // null quando ainda não tem avaliações; 1 casa decimal
  totalAvaliacoes: number;
  precos: PrecoCategoria[]; // preço base de cada serviço (05_precos_servicos.sql)
};

// Preço base de um serviço da prestadora. Vem do service de preços da
// identidade (P1), não da view prestadoras_resumo.
export type PrecoCategoria = {
  categoriaId: number;
  precoBase: number | null; // null = "a combinar"
  aceitaNegociar: boolean; // sempre false quando não há preço
};

export type Avaliacao = {
  id: number;
  prestadoraId: string;
  clienteId: string;
  nota: number; // 1 a 5
  comentario: string | null;
  criadaEm: string;
  // Para "Minhas indicações" (quem foi avaliada).
  prestadoraNome: string;
  prestadoraAvatarUrl: string | null;
  // Para a lista de avaliações na página da prestadora (quem avaliou).
  clienteNome: string;
  clienteAvatarUrl: string | null;
};

// "preco": do mais barato ao mais caro (ver lib/descoberta/precos.ts).
export type OrdenarPor = "nota" | "preco";

export type FiltrosBusca = {
  categoriaId?: number;
  cidade?: string; // sem diferença de acento ou maiúscula
  ordenarPor?: OrdenarPor; // padrão: "nota"
};

export type PrestadoraDetalhe = {
  perfil: Perfil;
  categorias: CategoriaResumo[];
  fotos: FotoPortfolio[];
  avaliacoes: Avaliacao[];
  notaMedia: number | null;
  totalAvaliacoes: number;
  precos: PrecoCategoria[];
};

export type DadosAvaliacao = {
  nota: number;
  comentario?: string | null;
};

export type NovaAvaliacao = DadosAvaliacao & {
  prestadoraId: string;
};
