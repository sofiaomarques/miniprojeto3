import Link from "next/link";

import { Aviso } from "@/components/ui/Aviso";

// Estado deslogado das telas do chat: leva para o login (P1) e volta depois.
export function AvisoDeslogada({ voltarPara }: { voltarPara: string }) {
  return (
    <Aviso tipo="info">
      Entre na sua conta para ver suas conversas.{" "}
      <Link
        href={`/entrar?next=${encodeURIComponent(voltarPara)}`}
        className="font-bold text-vinho underline"
      >
        Entrar
      </Link>
    </Aviso>
  );
}
