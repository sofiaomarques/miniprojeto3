"use client";

import type { CategoriaResumo, FiltrosBusca, OrdenarPor } from "@/lib/descoberta/types";

type Props = {
  categorias: CategoriaResumo[];
  filtros: FiltrosBusca;
  onChange: (filtros: FiltrosBusca) => void;
};

const CAMPO = "w-full rounded border bg-white px-2 py-1.5 text-sm";

export function FiltrosBuscaForm({ categorias, filtros, onChange }: Props) {
  return (
    <form
      role="search"
      onSubmit={(e) => e.preventDefault()}
      className="grid gap-3 rounded-lg border bg-white p-3 sm:grid-cols-3"
    >
      <label className="flex flex-col gap-1 text-sm">
        Serviço
        <select
          className={CAMPO}
          value={filtros.categoriaId ?? ""}
          onChange={(e) =>
            onChange({ ...filtros, categoriaId: e.target.value ? Number(e.target.value) : undefined })
          }
        >
          <option value="">Todos os serviços</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Cidade
        <input
          type="search"
          className={CAMPO}
          placeholder="Ex.: João Pessoa"
          value={filtros.cidade ?? ""}
          onChange={(e) => onChange({ ...filtros, cidade: e.target.value })}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Ordenar por
        <select
          className={CAMPO}
          value={filtros.ordenarPor ?? "nota"}
          onChange={(e) => onChange({ ...filtros, ordenarPor: e.target.value as OrdenarPor })}
        >
          <option value="nota">Melhor nota</option>
          <option value="nome">Nome (A–Z)</option>
        </select>
      </label>
    </form>
  );
}
