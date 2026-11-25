"use client";

// Quem está logada, pelo service da identidade (P1). Em modo mock é a conta
// definida em lib/identidade/mocks (definirUsuariaMock).
//   undefined = ainda descobrindo; null = ninguém logada (ou falha ao ler).
import { useEffect, useState } from "react";

import { servicoIdentidade } from "@/lib/identidade/service";
import type { Perfil } from "@/lib/identidade/types";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function useMeuPerfil(): Perfil | null | undefined {
  const [perfil, setPerfil] = useState<Perfil | null | undefined>(undefined);

  useEffect(() => {
    let cancelado = false;
    (async () => servicoIdentidade(criarClienteNavegador()).obterMeuPerfil())().then(
      (p) => !cancelado && setPerfil(p),
      (err) => {
        if (cancelado) return;
        console.error("Erro ao ler a sessão:", err);
        setPerfil(null);
      },
    );
    return () => {
      cancelado = true;
    };
  }, []);

  return perfil;
}
