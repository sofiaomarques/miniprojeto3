import Link from "next/link";

import type { Avaliacao } from "@/lib/descoberta/types";

import { NotaAvaliacao } from "./Estrelas";

// Avaliações mais recentes primeiro (a ordem vem do service).
export function ListaAvaliacoes({ avaliacoes }: { avaliacoes: Avaliacao[] }) {
  if (avaliacoes.length === 0) {
    return <p className="text-[14.5px] text-suave">Ainda não há avaliações. Seja a primeira!</p>;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {avaliacoes.map((a) => (
        <li
          key={a.id}
          className="flex flex-col gap-1.5 rounded-[18px] border border-borda bg-papel p-3.5"
        >
          <div className="flex items-center justify-between gap-2 text-sm">
            {/* O nome abre o perfil de quem avaliou, para seguir e ver as indicações dela. */}
            <Link
              href={`/pessoas/${a.clienteId}`}
              className="min-w-0 truncate font-bold hover:underline focus-visible:outline-2 focus-visible:outline-vinho"
            >
              {a.clienteNome || "Cliente"}
            </Link>
            <NotaAvaliacao nota={a.nota} />
          </div>
          {a.comentario && (
            <p className="whitespace-pre-line break-words text-sm leading-[1.45] text-corpo">
              {a.comentario}
            </p>
          )}
          <time dateTime={a.criadaEm} className="text-xs text-suave">
            {new Date(a.criadaEm).toLocaleDateString("pt-BR")}
          </time>
        </li>
      ))}
    </ul>
  );
}
