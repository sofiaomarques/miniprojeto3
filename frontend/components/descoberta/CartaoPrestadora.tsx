import Link from "next/link";

import type { PrestadoraResumo } from "@/lib/descoberta/types";

import { Avatar } from "./Avatar";
import { Categorias } from "./Categorias";
import { Estrelas } from "./Estrelas";

export function CartaoPrestadora({ prestadora }: { prestadora: PrestadoraResumo }) {
  return (
    <Link
      href={`/prestadoras/${prestadora.id}`}
      className="flex h-full items-start gap-3 rounded-lg border bg-white p-3 transition-colors hover:border-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900 active:bg-zinc-50"
    >
      <Avatar nome={prestadora.nome} url={prestadora.avatarUrl} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="truncate font-medium">{prestadora.nome}</p>
        <p className="truncate text-sm text-zinc-500">{prestadora.cidade ?? "Cidade não informada"}</p>
        <Categorias categorias={prestadora.categorias} />
        <Estrelas nota={prestadora.notaMedia} total={prestadora.totalAvaliacoes} />
      </div>
    </Link>
  );
}
