import type { Mensagem } from "@/lib/chat/types";

type Props = { mensagem: Mensagem; minha: boolean };

const HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Fortaleza", // João Pessoa
});

// Balões no visual do protótipo: enviada à direita (rosa), recebida à esquerda.
export function BolhaMensagem({ mensagem, minha }: Props) {
  return (
    <div
      className={`max-w-[78%] border px-3.5 py-[11px] text-[14.5px] leading-[1.4] ${
        minha
          ? "self-end rounded-[18px_18px_6px_18px] border-msg bg-msg"
          : "self-start rounded-[18px_18px_18px_6px] border-borda bg-papel"
      }`}
    >
      <p className="whitespace-pre-wrap break-words">{mensagem.texto}</p>
      <p className="mt-1 text-right text-[11px] text-suave">
        {HORA.format(new Date(mensagem.criadaEm))}
      </p>
    </div>
  );
}
