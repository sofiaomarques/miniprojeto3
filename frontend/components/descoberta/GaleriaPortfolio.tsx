import { urlFotoPortfolio } from "@/lib/descoberta/fotos";
import type { FotoPortfolio } from "@/lib/identidade/types";

const TONS = ["bg-rosa", "bg-areia", "bg-rosa-claro"];

export function GaleriaPortfolio({ fotos, nome }: { fotos: FotoPortfolio[]; nome: string | null }) {
  if (fotos.length === 0) {
    return (
      <p className="text-[14.5px] text-suave">Esta prestadora ainda não publicou fotos de trabalhos.</p>
    );
  }

  return (
    <ul className="grid grid-cols-3 gap-2">
      {fotos.map((foto, indice) => {
        const url = urlFotoPortfolio(foto.caminho);
        const descricao = `Trabalho ${indice + 1} de ${fotos.length}${nome ? ` de ${nome}` : ""}`;
        return (
          <li key={foto.id} className={`aspect-square overflow-hidden rounded-[14px] ${TONS[indice % 3]}`}>
            {url ? (
              <a href={url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt={descricao} loading="lazy" className="h-full w-full object-cover" />
              </a>
            ) : (
              // Modo mock: os caminhos de exemplo não existem no Storage.
              <div role="img" aria-label={`Foto de exemplo: ${descricao}`} className="h-full w-full" />
            )}
          </li>
        );
      })}
    </ul>
  );
}
