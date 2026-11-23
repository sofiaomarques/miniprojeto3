import type { Mensagem } from "@/lib/chat/types";

type Props = { mensagem: Mensagem; minha: boolean };

const HORA = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Fortaleza", // João Pessoa
});

// Mensagem enviada fica à direita; recebida, à esquerda.
export function BolhaMensagem({ mensagem, minha }: Props) {
  return (
    <div className={`flex ${minha ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
          minha ? "bg-rose-600 text-white" : "border bg-white text-zinc-900"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">{mensagem.texto}</p>
        <p className={`mt-1 text-right text-[11px] ${minha ? "text-rose-100" : "text-zinc-400"}`}>
          {HORA.format(new Date(mensagem.criadaEm))}
        </p>
      </div>
    </div>
  );
}
