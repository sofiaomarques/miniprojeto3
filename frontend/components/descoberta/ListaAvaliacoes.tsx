import type { Avaliacao } from "@/lib/descoberta/types";

import { NotaAvaliacao } from "./Estrelas";

// Avaliações mais recentes primeiro (a ordem vem do service).
export function ListaAvaliacoes({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  if (avaliacoes.length === 0) {
    return (
      <p className="rounded-lg border bg-white p-4 text-sm text-zinc-500">
        Ainda não há avaliações. Seja a primeira a avaliar!
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {avaliacoes.map((avaliacao) => (
        <li key={avaliacao.id} className="space-y-1 rounded-lg border border-zinc-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-x-2">
            <p className="min-w-0 truncate font-medium">{avaliacao.clienteNome || "Cliente"}</p>
            <time dateTime={avaliacao.criadaEm} className="text-xs text-zinc-500">
              {new Date(avaliacao.criadaEm).toLocaleDateString("pt-BR")}
            </time>
          </div>
          <NotaAvaliacao nota={avaliacao.nota} />
          {avaliacao.comentario && (
            <p className="whitespace-pre-line break-words text-sm text-zinc-700">{avaliacao.comentario}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
