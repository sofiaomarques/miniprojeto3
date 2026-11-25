"use client";

// Erro inesperado no /perfil (e /perfil/editar, /perfil/fotos) (#20): em vez
// da tela de erro do Next, um aviso no visual do protótipo com "Tentar de
// novo". O detalhe vai só para o console; a mensagem é fixa em português.
import { useRouter } from "next/navigation";
import { startTransition, useEffect } from "react";

import { Erro } from "@/components/descoberta/Estados";
import { BarraAbas, Tela } from "@/components/rede/Tela";

export default function ErroPerfil({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("Erro no perfil:", error);
  }, [error]);

  // As páginas do perfil são Server Components: só reset() renderizaria o
  // mesmo erro de novo; o refresh pede os dados ao servidor outra vez.
  function tentarDeNovo() {
    startTransition(() => {
      router.refresh();
      reset();
    });
  }

  return (
    <Tela className="h-dvh">
      <div className="flex flex-1 flex-col gap-4 px-5 pt-8">
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">Meu perfil</h1>
        <Erro
          mensagem="Não foi possível abrir seu perfil agora. Tente de novo em alguns instantes."
          onTentarDeNovo={tentarDeNovo}
        />
      </div>
      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
