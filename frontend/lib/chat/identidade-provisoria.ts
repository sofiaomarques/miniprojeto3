// PROVISÓRIO: espelha o que a P1 vai publicar em lib/identidade/types.ts (#13).
// Quando a #13 estiver no main, apague este arquivo e troque os imports por:
//   import type { Papel, Perfil } from "@/lib/identidade/types";
// (a issue #35 pede para não redefinir esses tipos).

export type Papel = "cliente" | "prestadora";

export type Perfil = {
  id: string; // uuid = auth.users.id
  papel: Papel | null; // null até o onboarding
  nome: string;
  avatarUrl: string | null;
  bio: string | null;
  cidade: string | null;
};
