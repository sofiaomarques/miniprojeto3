// Preço no cartão da busca: o do serviço filtrado, ou "a partir de" o menor
// quando ela faz mais de um serviço, e o selo "Negociável". Sem preço,
// "Preço a combinar".
import { precoDeReferencia } from "@/lib/descoberta/precos";
import type { PrecoCategoria } from "@/lib/descoberta/types";
import { formatarPreco } from "@/lib/identidade/dinheiro";

type Props = { precos: PrecoCategoria[]; categoriaId?: number };

export function PrecoNoCartao({ precos, categoriaId }: Props) {
  const ref = precoDeReferencia({ precos }, categoriaId);
  if (!ref || ref.precoBase === null) {
    return <span className="text-[13px] text-suave">Preço a combinar</span>;
  }
  const aPartirDe = !categoriaId && precos.length > 1;
  return (
    <span className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
      <span className="text-[14px] font-bold text-vinho">
        {aPartirDe && <span className="font-medium text-suave">a partir de </span>}
        {formatarPreco(ref.precoBase)}
      </span>
      {ref.aceitaNegociar && (
        <span className="rounded-full bg-rosa px-2 py-px text-[11.5px] font-bold text-vinho-escuro">
          Negociável
        </span>
      )}
    </span>
  );
}
