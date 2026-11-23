"use client";

import { type FormEvent, useState } from "react";

import { contarCaracteres } from "@/lib/chat/service";
import { LIMITE_TEXTO_MENSAGEM } from "@/lib/chat/types";

type Props = { onEnviar: (texto: string) => Promise<void> };

// Caixa de texto + botão. Enter envia; Shift+Enter quebra a linha.
// Sem maxLength no textarea: ele conta unidades UTF-16 (emoji = 2) e o banco
// conta caracteres. O limite é checado por validarTexto ao enviar.
export function CampoMensagem({ onEnviar }: Props) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const caracteres = contarCaracteres(texto);
  const perto = caracteres > LIMITE_TEXTO_MENSAGEM - 200;

  async function enviar(e?: FormEvent) {
    e?.preventDefault();
    if (enviando || !texto.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await onEnviar(texto);
      setTexto("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-1">
      {erro && (
        <p role="alert" className="text-sm text-red-700">
          {erro}
        </p>
      )}
      <div className="flex items-end gap-2">
        <label htmlFor="campo-mensagem" className="sr-only">
          Mensagem
        </label>
        <textarea
          id="campo-mensagem"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            // isComposing: o Enter que confirma uma palavra no teclado do
            // celular (ou IME) não pode enviar a mensagem pela metade.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void enviar();
            }
          }}
          rows={2}
          aria-describedby={perto ? "contador-mensagem" : undefined}
          placeholder="Escreva sua mensagem…"
          className="min-h-[44px] flex-1 resize-none rounded border bg-white p-2 text-sm"
        />
        <button
          type="submit"
          disabled={enviando || !texto.trim()}
          className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {enviando ? "Enviando…" : "Enviar"}
        </button>
      </div>
      {perto && (
        <p
          id="contador-mensagem"
          className={`text-right text-xs ${
            caracteres > LIMITE_TEXTO_MENSAGEM ? "text-red-700" : "text-zinc-500"
          }`}
        >
          {caracteres}/{LIMITE_TEXTO_MENSAGEM}
        </p>
      )}
    </form>
  );
}
