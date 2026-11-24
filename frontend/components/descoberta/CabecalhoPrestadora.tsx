import type { PrestadoraDetalhe } from "@/lib/descoberta/types";

import { BotaoConversar } from "./BotaoConversar";
import { Estrelas } from "./Estrelas";

export function CabecalhoPrestadora({ prestadora }: { prestadora: PrestadoraDetalhe }) {
  const { perfil, categorias, notaMedia, totalAvaliacoes } = prestadora;

  return (
    <header className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-start">
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-2xl font-semibold">
        {perfil.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={perfil.avatarUrl} alt="" className="h-20 w-20 rounded-full object-cover" />
        ) : (
          perfil.nome[0]?.toUpperCase()
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <h1 className="text-2xl font-bold">{perfil.nome}</h1>
        <p className="text-sm text-zinc-500">{perfil.cidade ?? "Cidade não informada"}</p>
        <Estrelas nota={notaMedia} total={totalAvaliacoes} />

        {categorias.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {categorias.map((c) => (
              <li key={c.id} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
                {c.nome}
              </li>
            ))}
          </ul>
        )}

        {perfil.bio && <p className="text-sm text-zinc-700">{perfil.bio}</p>}

        <div className="pt-1">
          <BotaoConversar prestadoraId={perfil.id} />
        </div>
      </div>
    </header>
  );
}
