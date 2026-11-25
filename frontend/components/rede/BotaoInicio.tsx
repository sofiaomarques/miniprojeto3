"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { IconeCasa } from "./icones";

// Casinha que leva para a página inicial, sempre no mesmo lugar (canto
// superior direito da coluna) em todas as telas que usam <Tela>. Fica presa
// ao rolar, para ninguém precisar voltar tela por tela na seta. Na própria
// página inicial não aparece.
export function BotaoInicio() {
  const caminho = usePathname();
  if (caminho === "/") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-30 mx-auto flex w-full max-w-[430px] justify-end px-3 pt-3">
      <Link
        href="/"
        aria-label="Ir para o início"
        className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full border border-borda bg-papel text-vinho shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
      >
        <IconeCasa size={22} />
      </Link>
    </div>
  );
}
