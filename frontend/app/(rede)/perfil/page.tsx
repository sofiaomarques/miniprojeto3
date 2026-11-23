import Link from "next/link";

import { Avatar, BarraAbas, Rotulo, Tela } from "@/components/rede/Tela";
import { buscarPrestadora, INDICACOES } from "@/lib/rede/dados";

export default function PerfilClientePage() {
  const itens = INDICACOES.flatMap((i) => {
    const p = buscarPrestadora(i.slug);
    return p ? [{ ...i, p }] : [];
  });

  return (
    <Tela className="h-screen">
      <div className="flex flex-col items-center gap-2 rounded-b-[28px] bg-rosa px-5 pb-6 pt-8 text-center">
        <Avatar iniciais="AP" tamanho={84} fundo="papel" />
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">Ana Paula</h1>
        <span className="text-sm text-corpo">Cliente · João Pessoa</span>
        <p className="mt-1 max-w-[300px] text-[14.5px] leading-[1.45] text-corpo">
          Moro sozinha e prefiro contratar quem já foi avaliada por outras mulheres.
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-5">
        <div className="flex items-baseline justify-between">
          <Rotulo>Minhas indicações</Rotulo>
          <span className="text-[13px] text-suave">
            {itens.length} {itens.length === 1 ? "prestadora" : "prestadoras"}
          </span>
        </div>
        {itens.map(({ p, estrelas, comentario }) => (
          <Link
            key={p.slug}
            href={`/p/${p.slug}`}
            className="flex w-full flex-col gap-2.5 rounded-[18px] border border-borda bg-papel p-3.5"
          >
            <div className="flex w-full items-center gap-3">
              <Avatar iniciais={p.iniciais} tamanho={44} fundo={p.tom} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <b className="text-[15.5px]">{p.nome}</b>
                <span className="text-[13px] text-suave">{p.servico}</span>
              </div>
              <span
                role="img"
                aria-label={`${estrelas} de 5 estrelas`}
                className="text-sm font-bold tracking-[1px] text-vinho"
              >
                {"★".repeat(estrelas) + "☆".repeat(5 - estrelas)}
              </span>
            </div>
            <p className="text-[13.5px] leading-[1.45] text-corpo">{comentario}</p>
          </Link>
        ))}
      </div>

      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
