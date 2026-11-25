import type { CategoriaResumo } from "@/lib/descoberta/types";

export function Categorias({ categorias }: { categorias: CategoriaResumo[] }) {
  if (categorias.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1" aria-label="Serviços">
      {categorias.map((c) => (
        <li key={c.id} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">
          {c.nome}
        </li>
      ))}
    </ul>
  );
}
