import Link from "next/link";
import { notFound } from "next/navigation";

import { IconeChat, IconeEstrela, IconeVoltar } from "@/components/rede/icones";
import { Avatar, classeBotao, Rotulo, Tela } from "@/components/rede/Tela";
import { buscarPrestadora } from "@/lib/rede/dados";

const FOTOS = ["bg-rosa", "bg-areia", "bg-rosa-claro", "bg-areia", "bg-rosa-claro", "bg-rosa"];

export default async function PerfilPrestadoraPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = buscarPrestadora(slug);
  if (!p) notFound();

  return (
    <Tela>
      <div className="flex flex-col gap-3.5 rounded-b-[28px] bg-rosa px-5 pb-[22px] pt-5">
        <Link
          href="/"
          aria-label="Voltar para a busca"
          className="-ml-2 flex h-11 w-11 items-center justify-center"
        >
          <IconeVoltar size={24} />
        </Link>
        <div className="flex items-center gap-3.5">
          <Avatar iniciais={p.iniciais} tamanho={72} fundo="papel" />
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-[25px] font-semibold leading-[1.1]">{p.nome}</h1>
            <span className="text-sm text-corpo">
              {p.servico} · {p.cidade}
            </span>
            <div className="flex items-center gap-1.5 text-sm">
              <IconeEstrela size={15} className="text-vinho" />
              <b>{p.nota}</b>
              <span className="text-corpo">· {p.avaliacoes} avaliações</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 px-5 pt-[18px]">
        <p className="text-[14.5px] leading-normal text-corpo">{p.bio}</p>

        <section className="flex flex-col gap-2">
          <Rotulo>Trabalhos realizados</Rotulo>
          <div className="grid grid-cols-3 gap-2" aria-hidden="true">
            {FOTOS.map((t, i) => (
              <div key={i} className={`h-[92px] rounded-[14px] ${t}`} />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-2 pb-4">
          <Rotulo>Avaliações</Rotulo>
          <div className="flex flex-col gap-1.5 rounded-[18px] border border-borda bg-papel p-3.5">
            <div className="flex items-center justify-between text-sm">
              <b>Ana P.</b>
              <span
                role="img"
                aria-label="5 de 5 estrelas"
                className="font-bold tracking-[2px] text-vinho"
              >
                ★★★★★
              </span>
            </div>
            <p className="text-sm leading-[1.45] text-corpo">
              Pontual, explicou tudo e deixou tudo limpo. Me senti segura o tempo todo.
            </p>
          </div>
        </section>
      </div>

      <div className="border-t border-borda bg-papel px-5 pb-[26px] pt-3">
        <Link href={`/chat/${p.slug}`} className={classeBotao}>
          <IconeChat size={20} />
          Conversar e pedir orçamento
        </Link>
      </div>
    </Tela>
  );
}
