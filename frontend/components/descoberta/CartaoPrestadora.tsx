import Link from "next/link";

import type { PrestadoraResumo } from "@/lib/descoberta/types";

import { Estrelas } from "./Estrelas";

export function CartaoPrestadora({ prestadora }: { prestadora: PrestadoraResumo }) {
  return (
    <Link
      href={`/prestadoras/${prestadora.id}`}
      className="flex items-start gap-3 rounded-lg border bg-white p-3 hover:border-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-900"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-semibold">
        {prestadora.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={prestadora.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          prestadora.nome[0]?.toUpperCase()
        )}
      </div>
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium">{prestadora.nome}</p>
        <p className="truncate text-sm text-zinc-500">{prestadora.cidade ?? "Cidade não informada"}</p>
        {prestadora.categorias.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {prestadora.categorias.map((c) => (
              <li key={c.id} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                {c.nome}
              </li>
            ))}
          </ul>
        )}
        <Estrelas nota={prestadora.notaMedia} total={prestadora.totalAvaliacoes} />
      </div>
    </Link>
  );
}
