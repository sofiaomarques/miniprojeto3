// Estados de carregamento, vazio e erro usados nas telas da descoberta.
import type { ReactNode } from "react";

export function Carregando({ texto, linhas = 3 }: { texto: string; linhas?: number }) {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">{texto}</span>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} aria-hidden="true" className="flex animate-pulse gap-3 rounded-lg border bg-white p-3">
          <div className="h-12 w-12 shrink-0 rounded-full bg-zinc-200" />
          <div className="flex-1 space-y-2 py-1">
            <div className="h-3 w-1/2 rounded bg-zinc-200" />
            <div className="h-3 w-1/3 rounded bg-zinc-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border bg-white p-4 text-sm text-zinc-600">{children}</div>;
}

export function Erro({ mensagem, onTentarDeNovo }: { mensagem: string; onTentarDeNovo?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{mensagem}</p>
      {onTentarDeNovo && (
        <button
          type="button"
          onClick={onTentarDeNovo}
          className="min-h-11 rounded border border-red-300 bg-white px-3 font-medium hover:bg-red-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-700"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
