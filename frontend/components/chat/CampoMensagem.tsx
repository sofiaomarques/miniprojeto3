"use client";

import { type FormEvent, useState } from "react";

import { IconeEnviar } from "@/components/rede/icones";
import { contarCaracteres } from "@/lib/chat/service";
import { LIMITE_TEXTO_MENSAGEM } from "@/lib/chat/types";

type Props = {
  // Controlado pela página: as respostas rápidas preenchem o texto.
  texto: string;
  aoMudar: (texto: string) => void;
  onEnviar: (texto: string) => Promise<void>;
};

// Barra de mensagem do protótipo. Enter envia; Shift+Enter quebra a linha.
// Sem maxLength no textarea: ele conta unidades UTF-16 (emoji = 2) e o banco
// conta caracteres. O limite é checado por validarTexto ao enviar.
export function CampoMensagem({ texto, aoMudar, onEnviar }: Props) {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const caracteres = contarCaracteres(texto);
  const perto = caracteres > LIMITE_TEXTO_MENSAGEM - 200;
  // Mensagem de várias linhas (ex.: orçamento) ganha mais altura.
  const linhas = Math.min(5, Math.max(1, texto.split("\n").length));

  async function enviar(e?: FormEvent) {
    e?.preventDefault();
    if (enviando || !texto.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await onEnviar(texto);
      aoMudar("");
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="border-t border-borda bg-papel px-4 pb-[max(14px,env(safe-area-inset-bottom))] pt-2.5">
      {erro && (
        <p role="alert" className="mb-2 text-[13px] text-red-800">
          {erro}
        </p>
      )}
      <div className="flex items-end gap-2.5">
        <label htmlFor="campo-mensagem" className="sr-only">
          Mensagem
        </label>
        <textarea
          id="campo-mensagem"
          value={texto}
          onChange={(e) => aoMudar(e.target.value)}
          onKeyDown={(e) => {
            // isComposing: o Enter que confirma uma palavra no teclado do
            // celular (ou IME) não pode enviar a mensagem pela metade.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void enviar();
            }
          }}
          rows={linhas}
          aria-describedby={perto ? "contador-mensagem" : undefined}
          placeholder="Escreva uma mensagem"
          className="min-h-[46px] min-w-0 flex-1 resize-none rounded-3xl border border-campo bg-crema px-4 py-3 text-[15px] leading-[1.35] placeholder:text-suave focus-visible:outline-2 focus-visible:outline-vinho"
        />
        <button
          type="submit"
          aria-label={enviando ? "Enviando" : "Enviar"}
          disabled={enviando || !texto.trim()}
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-vinho text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho disabled:opacity-50"
        >
          <IconeEnviar size={20} />
        </button>
      </div>
      {perto && (
        <p
          id="contador-mensagem"
          className={`mt-1 text-right text-xs ${
            caracteres > LIMITE_TEXTO_MENSAGEM ? "text-red-800" : "text-suave"
          }`}
        >
          {caracteres}/{LIMITE_TEXTO_MENSAGEM}
        </p>
      )}
    </form>
  );
}
