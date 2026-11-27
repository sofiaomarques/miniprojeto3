"use client";

// Escolha da ordem da busca: duas pílulas no visual dos chips de serviço
// (areia, a ativa em vinho), no lugar do <select> nativo, cuja lista abria
// com as cores do sistema. São radios de verdade: setas do teclado, foco e
// leitor de tela funcionam sem código extra.
import { IconeEstrela } from "@/components/rede/icones";
import type { OrdenarPor as Ordem } from "@/lib/descoberta/types";

const OPCOES: { valor: Ordem; rotulo: string }[] = [
  { valor: "nota", rotulo: "Melhor nota" },
  { valor: "preco", rotulo: "Menor preço" },
];

type Props = { valor: Ordem; onChange: (ordem: Ordem) => void };

export function OrdenarPor({ valor, onChange }: Props) {
  return (
    <fieldset className="shrink-0">
      <legend className="sr-only">Ordenar por</legend>
      <div className="flex gap-1 rounded-full border border-borda bg-areia p-1">
        {OPCOES.map((o) => (
          <label key={o.valor} className="flex">
            <input
              type="radio"
              name="ordem"
              value={o.valor}
              checked={valor === o.valor}
              onChange={() => onChange(o.valor)}
              className="peer sr-only"
            />
            <span className="flex min-h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-[13.5px] font-medium text-corpo transition-colors hover:bg-rosa-claro peer-checked:bg-vinho peer-checked:font-bold peer-checked:text-white peer-checked:shadow-sm peer-checked:hover:bg-vinho peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-vinho">
              {o.valor === "nota" ? (
                <IconeEstrela size={13} />
              ) : (
                <span aria-hidden="true" className="text-[12px] font-bold">
                  R$
                </span>
              )}
              {o.rotulo}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
