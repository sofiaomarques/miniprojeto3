// PROVISÓRIO: espelha o que a P1 vai publicar em lib/identidade/types.ts (#13).
// Quando a #13 estiver no main, apague este arquivo e troque os imports em
// types.ts por:  import type { Perfil, FotoPortfolio } from "@/lib/identidade/types";
// (a issue #23 pede para não redefinir esses tipos).

export type Papel = "cliente" | "prestadora";

export type Perfil = {
  id: string; // uuid = auth.users.id
  papel: Papel;
  nome: string;
  avatarUrl: string | null;
  bio: string | null;
  cidade: string | null;
};

export type FotoPortfolio = {
  id: number;
  prestadoraId: string;
  caminho: string; // caminho no bucket `portfolio`
};
