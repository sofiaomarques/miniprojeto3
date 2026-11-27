// Estados de carregamento, vazio e erro, no visual do protótipo.
import type { ReactNode } from "react";

export function Carregando({ texto, linhas = 3 }: { texto: string; linhas?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{texto}</span>
      {Array.from({ length: linhas }, (_, i) => (
        <div
          key={i}
          aria-hidden="true"
          className="flex animate-pulse items-center gap-3 rounded-[20px] border border-borda bg-papel p-3.5"
        >
          <div className="h-[52px] w-[52px] shrink-0 rounded-full bg-areia" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="h-3.5 w-1/2 rounded bg-areia" />
            <div className="h-3 w-1/3 rounded bg-areia" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function Vazio({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[18px] border border-borda bg-papel p-4 text-[14.5px] leading-[1.45] text-corpo">
      {children}
    </div>
  );
}

export function Erro({ mensagem, onTentarDeNovo }: { mensagem: string; onTentarDeNovo?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-[18px] border border-vinho/30 bg-rosa-claro p-3.5 text-sm text-vinho-escuro"
    >
      <p>{mensagem}</p>
      {onTentarDeNovo && (
        <button
          type="button"
          onClick={onTentarDeNovo}
          className="min-h-11 self-start rounded-full border border-vinho px-4 font-bold text-vinho focus-visible:outline-2 focus-visible:outline-vinho"
        >
          Tentar de novo
        </button>
      )}
    </div>
  );
}
