import type { Avaliacao } from "@/lib/descoberta/types";

// Avaliações mais recentes primeiro (a ordem vem do service).
export function ListaAvaliacoes({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  if (avaliacoes.length === 0) {
    return <p className="text-sm text-zinc-500">Ainda não há avaliações.</p>;
  }

  return (
    <ul className="space-y-3">
      {avaliacoes.map((avaliacao) => (
        <li key={avaliacao.id} className="rounded-lg border border-zinc-200 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium">{avaliacao.clienteNome || "Cliente"}</p>
            <time dateTime={avaliacao.criadaEm} className="text-xs text-zinc-500">
              {new Date(avaliacao.criadaEm).toLocaleDateString("pt-BR")}
            </time>
          </div>
          <p
            role="img"
            aria-label={`${avaliacao.nota} de 5 estrelas`}
            className="text-amber-500"
          >
            {"★".repeat(avaliacao.nota)}
            <span className="text-zinc-300">{"★".repeat(5 - avaliacao.nota)}</span>
          </p>
          {avaliacao.comentario && (
            <p className="mt-1 text-sm text-zinc-700">{avaliacao.comentario}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
