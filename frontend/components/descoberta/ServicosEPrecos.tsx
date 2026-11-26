// "Serviços e preços" na página da prestadora: o preço base de cada serviço
// e se ela aceita negociar. O valor final é combinado no chat ("Conversar e
// pedir orçamento"). A dona do perfil ganha o link para editar os preços.
import Link from "next/link";

import { Rotulo } from "@/components/rede/Tela";
import type { CategoriaResumo, PrecoCategoria } from "@/lib/descoberta/types";
import { formatarPreco } from "@/lib/identidade/dinheiro";

type Props = {
  categorias: CategoriaResumo[];
  precos: PrecoCategoria[];
  ehDona?: boolean;
};

export function ServicosEPrecos({ categorias, precos, ehDona = false }: Props) {
  if (categorias.length === 0) return null;
  const porCategoria = new Map(precos.map((p) => [p.categoriaId, p]));
  const algumNegociavel = precos.some((p) => p.aceitaNegociar);

  return (
    <section className="flex flex-col gap-2" aria-labelledby="titulo-servicos-precos">
      <div className="flex items-center justify-between gap-2">
        <h2 id="titulo-servicos-precos">
          <Rotulo>Serviços e preços</Rotulo>
        </h2>
        {ehDona && (
          <Link
            href="/perfil/precos"
            className="flex min-h-11 items-center px-1 text-[13.5px] font-bold text-vinho underline"
          >
            Editar meus preços
          </Link>
        )}
      </div>

      <ul className="flex flex-col divide-y divide-borda rounded-[20px] border border-borda bg-papel">
        {categorias.map((c) => {
          const preco = porCategoria.get(c.id);
          const valor = preco?.precoBase ?? null;
          return (
            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[15px] font-medium">{c.nome}</span>
                {valor !== null && (
                  <span className={`text-[12.5px] ${preco?.aceitaNegociar ? "font-bold text-vinho-escuro" : "text-suave"}`}>
                    {preco?.aceitaNegociar ? "Aceita negociar" : "Valor fixo"}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-right">
                {valor === null ? (
                  <span className="text-[13.5px] text-suave">A combinar</span>
                ) : (
                  <b className="text-[16px] text-vinho">{formatarPreco(valor)}</b>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-[13px] leading-[1.45] text-suave">
        {algumNegociavel
          ? "Preço base de cada serviço. Nos que aceitam negociar, combine o valor pelo chat."
          : "Preço base de cada serviço. O valor final depende do trabalho: combine pelo chat."}
      </p>
    </section>
  );
}
