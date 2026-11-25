"use client";

// Quem está logada, pelo service da identidade (P1). Em modo mock é a conta
// definida em lib/identidade/mocks (definirUsuariaMock).
//   undefined = ainda descobrindo; null = ninguém logada; "erro" = não deu para
//   ler a sessão (não é o mesmo que estar deslogada).
import { useEffect, useState } from "react";

import { servicoIdentidade } from "@/lib/identidade/service";
import type { Perfil } from "@/lib/identidade/types";
import { criarClienteNavegador } from "@/lib/supabase/client";

export type MinhaSessao = Perfil | null | undefined | "erro";

export function useMeuPerfil(): MinhaSessao {
  const [perfil, setPerfil] = useState<MinhaSessao>(undefined);

  useEffect(() => {
    let cancelado = false;
    (async () => servicoIdentidade(criarClienteNavegador()).obterMeuPerfil())().then(
      (p) => !cancelado && setPerfil(p),
      (err) => {
        if (cancelado) return;
        console.error("Erro ao ler a sessão:", err);
        setPerfil("erro");
      },
    );
    return () => {
      cancelado = true;
    };
  }, []);

  return perfil;
}
