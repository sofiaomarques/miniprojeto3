import Link from "next/link";

import { Avatar } from "@/components/descoberta/Avatar";
import type { Conversa } from "@/lib/chat/types";

type Props = { conversa: Conversa; usuariaId: string | null };

// Uma linha da lista de conversas: quem é, prévia da última mensagem e não lidas.
export function ItemConversa({ conversa, usuariaId }: Props) {
  const { outra, ultimaMensagem, naoLidas } = conversa;
  const previa = ultimaMensagem
    ? `${ultimaMensagem.autorId === usuariaId ? "Você: " : ""}${ultimaMensagem.texto}`
    : "Nenhuma mensagem ainda";

  return (
    <Link
      href={`/chat/${conversa.id}`}
      className="flex items-center gap-3 rounded-[18px] border border-borda bg-papel p-3 focus-visible:outline-2 focus-visible:outline-vinho"
    >
      <Avatar nome={outra.nome} url={outra.avatarUrl} tamanho={46} fundo="rosa" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-bold">{outra.nome || "Participante"}</p>
        <p className={`truncate text-[13.5px] ${naoLidas > 0 ? "font-bold text-texto" : "text-corpo"}`}>
          {previa}
        </p>
      </div>
      {naoLidas > 0 && (
        <span
          aria-label={`${naoLidas} não lida${naoLidas > 1 ? "s" : ""}`}
          className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-full bg-vinho px-1.5 text-xs font-bold text-white"
        >
          {naoLidas}
        </span>
      )}
    </Link>
  );
}
