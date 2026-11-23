import Link from "next/link";
import { notFound } from "next/navigation";

import { IconeEnviar, IconeVoltar } from "@/components/rede/icones";
import { Avatar, Tela } from "@/components/rede/Tela";
import { buscarPrestadora } from "@/lib/rede/dados";
import { exigirConta } from "@/lib/rede/sessao";

// Só visual: mensagens de exemplo, sem envio.
export default async function ChatPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = buscarPrestadora(slug);
  if (!p) notFound();
  await exigirConta(`/chat/${p.slug}`);

  return (
    <Tela className="h-screen">
      <div className="flex items-center gap-2 bg-rosa px-3 py-4">
        <Link
          href={`/p/${p.slug}`}
          aria-label="Voltar ao perfil"
          className="flex h-11 w-11 items-center justify-center"
        >
          <IconeVoltar size={24} />
        </Link>
        <Avatar iniciais={p.iniciais} tamanho={42} fundo="papel" />
        <div className="flex flex-1 flex-col gap-px">
          <b className="text-base">{p.nome}</b>
          <span className="text-[12.5px] text-corpo">
            {p.servico} · {p.cidade}
          </span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col justify-end gap-2.5 overflow-y-auto px-4 pb-2 pt-5">
        <div className="max-w-[78%] self-end rounded-[18px_18px_6px_18px] border border-msg bg-msg px-3.5 py-[11px] text-[14.5px] leading-[1.4]">
          Oi, {p.primeiroNome}! Qual o valor?
        </div>
        <div className="max-w-[78%] self-start rounded-[18px_18px_18px_6px] border border-borda bg-papel px-3.5 py-[11px] text-[14.5px] leading-[1.4]">
          Oi! Combino o valor depois de ver o serviço. Pode ser uma visita na quinta à tarde?
        </div>

        <div className="mt-1.5 flex flex-wrap gap-2">
          {["Qual o valor?", "Pode visitar na quinta à tarde?"].map((q) => (
            <button
              key={q}
              type="button"
              className="min-h-10 rounded-full border border-campo bg-papel px-3.5 text-[13.5px]"
            >
              {q}
            </button>
          ))}
        </div>

        <div className="mt-1.5 flex flex-col gap-2.5 rounded-[18px] bg-areia p-3.5">
          <span className="text-sm leading-snug text-corpo">
            Serviço concluído? Sua avaliação ajuda outras mulheres a escolher com segurança.
          </span>
          <Link
            href={`/avaliar/${p.slug}`}
            className="flex h-11 items-center justify-center rounded-full bg-vinho text-[14.5px] font-bold text-white"
          >
            Avaliar {p.primeiroNome}
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2.5 border-t border-borda bg-papel px-4 pb-[26px] pt-2.5">
        <input
          type="text"
          aria-label="Mensagem"
          placeholder="Escreva uma mensagem"
          className="h-[46px] min-w-0 flex-1 rounded-3xl border border-campo bg-crema px-4 text-[15px] placeholder:text-suave"
        />
        <button
          type="button"
          aria-label="Enviar"
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-vinho text-white"
        >
          <IconeEnviar size={20} />
        </button>
      </div>
    </Tela>
  );
}
