import Link from "next/link";
import { notFound } from "next/navigation";

import { IconeEstrela, IconeInfo, IconeVoltar } from "@/components/rede/icones";
import { Avatar, classeBotao, Tela } from "@/components/rede/Tela";
import { buscarPrestadora } from "@/lib/rede/dados";
import { exigirConta } from "@/lib/rede/sessao";

const NOTA_EXEMPLO = 4;
const ROTULOS = ["Ruim", "Regular", "Boa", "Muito boa", "Excelente"];

// Só visual: a nota de exemplo é fixa; a escolha de estrelas entra na ligação com o banco.
export default async function AvaliarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = buscarPrestadora(slug);
  if (!p) notFound();
  await exigirConta(`/avaliar/${p.slug}`);

  return (
    <Tela className="gap-[22px] px-6 pb-8 pt-5">
      <Link
        href={`/chat/${p.slug}`}
        aria-label="Voltar para a conversa"
        className="-ml-2.5 flex h-11 w-11 items-center justify-center"
      >
        <IconeVoltar size={24} />
      </Link>

      <div className="flex flex-col items-center gap-2.5 text-center">
        <Avatar iniciais={p.iniciais} tamanho={84} fundo="rosa" />
        <h1 className="font-display text-[28px] font-semibold leading-[1.15]">
          Como foi o serviço com {p.primeiroNome}?
        </h1>
        <span className="text-sm text-suave">
          {p.servico} · {p.cidade}
        </span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <div role="img" aria-label={`${NOTA_EXEMPLO} de 5 estrelas`} className="flex gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => (
            <IconeEstrela key={n} size={40} preenchida={n <= NOTA_EXEMPLO} className="text-vinho" />
          ))}
        </div>
        <span className="text-sm font-bold text-vinho">{ROTULOS[NOTA_EXEMPLO - 1]}</span>
      </div>

      <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
        Seu comentário
        <textarea
          placeholder="Conte como foi a experiência, a pontualidade e se você se sentiu segura."
          className="h-[140px] resize-none rounded-2xl border border-campo bg-papel p-3.5 text-[15px] leading-[1.45] placeholder:text-suave"
        />
      </label>

      <div className="flex items-start gap-2.5 rounded-2xl bg-areia p-3.5">
        <IconeInfo size={22} className="shrink-0 text-vinho" />
        <span className="text-[13.5px] leading-[1.45] text-corpo">
          Sua avaliação é pública e fica no perfil de {p.primeiroNome} e no seu. Cada cliente avalia
          uma prestadora uma única vez.
        </span>
      </div>

      <Link href="/perfil" className={`${classeBotao} mt-auto`}>
        Publicar avaliação
      </Link>
    </Tela>
  );
}
