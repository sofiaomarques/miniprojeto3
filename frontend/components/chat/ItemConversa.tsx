import Link from "next/link";

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
      className="flex items-center gap-3 rounded border bg-white p-3 hover:bg-zinc-50"
    >
      <div
        aria-hidden
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 font-semibold text-rose-700"
      >
        {outra.nome.charAt(0).toUpperCase() || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{outra.nome || "Participante"}</p>
        <p className={`truncate text-sm ${naoLidas > 0 ? "font-semibold text-zinc-900" : "text-zinc-500"}`}>
          {previa}
        </p>
      </div>
      {naoLidas > 0 && (
        <span
          aria-label={`${naoLidas} não lida${naoLidas > 1 ? "s" : ""}`}
          className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white"
        >
          {naoLidas}
        </span>
      )}
    </Link>
  );
}
