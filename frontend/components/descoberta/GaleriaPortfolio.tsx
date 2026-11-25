import { urlFotoPortfolio } from "@/lib/descoberta/fotos";
import type { FotoPortfolio } from "@/lib/identidade/types";

export function GaleriaPortfolio({ fotos, nome }: { fotos: FotoPortfolio[]; nome: string | null }) {
  if (fotos.length === 0) {
    return (
      <p className="rounded-lg border bg-white p-4 text-sm text-zinc-500">
        Esta prestadora ainda não publicou fotos de trabalhos.
      </p>
    );
  }

  return (
    // Tamanho fixo por foto: poucas fotos não esticam a grade para o resto da linha.
    <ul className="flex flex-wrap gap-2">
      {fotos.map((foto, indice) => {
        const url = urlFotoPortfolio(foto.caminho);
        const descricao = `Trabalho ${indice + 1} de ${fotos.length}${nome ? ` de ${nome}` : ""}`;
        return (
          <li
            key={foto.id}
            className="aspect-square w-[calc(50%-0.25rem)] overflow-hidden rounded-lg bg-zinc-200 sm:w-48"
          >
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={descricao} loading="lazy" className="h-full w-full object-cover" />
              </a>
            ) : (
              <div
                role="img"
                aria-label={`Foto de exemplo: ${descricao}`}
                className="flex h-full w-full items-center justify-center text-xs text-zinc-500"
              >
                foto de exemplo
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
