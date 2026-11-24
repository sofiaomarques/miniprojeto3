import type { FotoPortfolio } from "@/lib/descoberta/identidade-provisoria";
import { urlFotoPortfolio } from "@/lib/descoberta/fotos";

export function GaleriaPortfolio({ fotos }: { fotos: FotoPortfolio[] }) {
  if (fotos.length === 0) {
    return <p className="text-sm text-zinc-500">Esta prestadora ainda não publicou fotos de trabalhos.</p>;
  }

  return (
    // Tamanho fixo por foto: poucas fotos não esticam a grade para o resto da linha.
    <ul className="flex flex-wrap gap-2">
      {fotos.map((foto, indice) => {
        const url = urlFotoPortfolio(foto.caminho);
        return (
          <li
            key={foto.id}
            className="aspect-square w-[calc(50%-0.25rem)] overflow-hidden rounded-lg bg-zinc-200 sm:w-48"
          >
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={`Trabalho ${indice + 1} de ${fotos.length}`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                role="img"
                aria-label={`Foto de exemplo ${indice + 1} de ${fotos.length}`}
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
