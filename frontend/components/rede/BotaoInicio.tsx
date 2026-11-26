import Link from "next/link";

import { IconeCasa } from "./icones";

// Casinha que leva para a página inicial. Vai no canto direito do topo das
// telas em que a seta de voltar não leva para o início (conversa e avaliar),
// para ninguém precisar voltar tela por tela.
export function BotaoInicio({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Ir para o início"
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-vinho ${className}`}
    >
      <IconeCasa size={22} />
    </Link>
  );
}
