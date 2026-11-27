"use client";
// Foto de perfil (#18), para cliente e prestadora: mostra a atual (ou as
// iniciais), troca e remove. O envio vai direto do navegador para o bucket
// avatares; depois os dados do servidor são recarregados (router.refresh)
// para o /perfil já mostrar a foto nova.
// O círculo (foto ou iniciais) é o Avatar da descoberta, como no resto do site.
import { useRouter } from "next/navigation";
import { useId, useRef, useState } from "react";
import { Avatar } from "@/components/descoberta/Avatar";
import { Aviso } from "@/components/ui/Aviso";
import {
  TIPOS_FOTO,
  ehErroIdentidade,
  servicoIdentidade,
  validarArquivoAvatar,
} from "@/lib/identidade/service";
import { criarClienteNavegador } from "@/lib/supabase/client";

const ACEITOS = Object.keys(TIPOS_FOTO).join(",");

export function CampoAvatar({ nome, avatarUrl }: { nome: string | null; avatarUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState(avatarUrl);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<"enviando" | "removendo" | null>(null);
  const campo = useRef<HTMLInputElement>(null);
  const rotulo = useId(); // "Foto de perfil" dá nome ao grupo de controles

  async function trocar(arquivo: File) {
    setErro(null);
    const problema = validarArquivoAvatar(arquivo);
    if (problema) {
      setErro(problema);
      return;
    }
    setOcupado("enviando");
    try {
      const perfil = await servicoIdentidade(criarClienteNavegador()).enviarMeuAvatar(arquivo);
      setUrl(perfil.avatar_url);
      router.refresh();
    } catch (e) {
      setErro(ehErroIdentidade(e) ? e.message : "Não foi possível enviar a foto de perfil.");
    } finally {
      setOcupado(null);
      if (campo.current) campo.current.value = "";
    }
  }

  async function remover() {
    setErro(null);
    setOcupado("removendo");
    try {
      await servicoIdentidade(criarClienteNavegador()).removerMeuAvatar();
      setUrl(null);
      router.refresh();
    } catch (e) {
      setErro(ehErroIdentidade(e) ? e.message : "Não foi possível remover a foto de perfil.");
    } finally {
      setOcupado(null);
    }
  }

  return (
    <div role="group" aria-labelledby={rotulo} className="flex flex-col gap-2">
      <span id={rotulo} className="text-[13.5px] font-medium">
        Foto de perfil
      </span>
      <div className="flex items-center gap-4">
        <Avatar nome={nome} url={url} tamanho={72} fundo="rosa" />
        <div className="flex flex-col gap-1.5">
          <label
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-vinho px-4 text-sm font-bold text-vinho has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-vinho ${
              ocupado ? "pointer-events-none opacity-60" : ""
            }`}
          >
            {ocupado === "enviando" ? "Enviando…" : url ? "Trocar foto" : "Enviar foto"}
            <input
              ref={campo}
              type="file"
              accept={ACEITOS}
              className="sr-only"
              disabled={ocupado !== null}
              onChange={(e) => {
                const arquivo = e.currentTarget.files?.[0];
                if (arquivo) void trocar(arquivo);
              }}
            />
          </label>
          {url && (
            <button
              type="button"
              onClick={() => void remover()}
              disabled={ocupado !== null}
              className="min-h-11 rounded-full px-4 text-sm text-corpo underline-offset-2 hover:underline disabled:opacity-60"
            >
              {ocupado === "removendo" ? "Removendo…" : "Remover foto"}
            </button>
          )}
        </div>
      </div>
      <span className="text-xs text-suave">JPG, PNG ou WebP, até 2 MB.</span>
      {erro && <Aviso tipo="erro">{erro}</Aviso>}
    </div>
  );
}
