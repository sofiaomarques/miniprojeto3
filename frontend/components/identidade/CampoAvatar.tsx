"use client";
// Foto de perfil (#18), para cliente e prestadora: mostra a atual (ou as
// iniciais), troca e remove. O envio vai direto do navegador para o bucket
// avatares; depois a página é recarregada para a navbar mostrar a foto nova.
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Aviso } from "@/components/ui/Aviso";
import {
  TIPOS_FOTO,
  ehErroIdentidade,
  servicoIdentidade,
  validarArquivoAvatar,
} from "@/lib/identidade/service";
import { criarClienteNavegador } from "@/lib/supabase/client";

const ACEITOS = Object.keys(TIPOS_FOTO).join(",");

function iniciais(nome: string | null): string {
  const partes = (nome ?? "").trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  return ((partes[0][0] ?? "") + (partes.length > 1 ? partes[partes.length - 1][0] : "")).toUpperCase();
}

export function CampoAvatar({ nome, avatarUrl }: { nome: string | null; avatarUrl: string | null }) {
  const router = useRouter();
  const [url, setUrl] = useState(avatarUrl);
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState<"enviando" | "removendo" | null>(null);
  const campo = useRef<HTMLInputElement>(null);

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
    <div className="flex flex-col gap-2">
      <span className="text-[13.5px] font-medium">Foto de perfil</span>
      <div className="flex items-center gap-4">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-rosa font-display text-2xl font-semibold text-vinho-escuro">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="Sua foto de perfil" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">{iniciais(nome)}</span>
          )}
        </div>
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
