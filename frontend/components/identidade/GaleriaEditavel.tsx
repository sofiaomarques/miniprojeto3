"use client";
// Galeria editável da prestadora (#17): ver, adicionar e apagar as próprias
// fotos de trabalhos. O envio é direto do navegador para o Storage (a sessão
// vem dos cookies); regras em lib/identidade (service.ts e fotos.ts). O link
// público da foto reusa o urlFotoPortfolio da descoberta (P2), sem mudá-lo.
import { useEffect, useRef, useState } from "react";
import { classeBotao } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { urlFotoPortfolio } from "@/lib/descoberta/fotos";
import { TIPOS_FOTO, validarArquivoFoto } from "@/lib/identidade/fotos";
import { ehErroIdentidade, servicoIdentidade } from "@/lib/identidade/service";
import type { FotoPortfolio } from "@/lib/identidade/types";
import { criarClienteNavegador } from "@/lib/supabase/client";

const ACEITOS = Object.keys(TIPOS_FOTO).join(",");

function mensagem(erro: unknown, padrao: string): string {
  return ehErroIdentidade(erro) ? erro.message : padrao;
}

export function GaleriaEditavel({ prestadoraId }: { prestadoraId: string }) {
  const [fotos, setFotos] = useState<FotoPortfolio[] | null>(null); // null = carregando
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmando, setConfirmando] = useState<number | null>(null); // id da foto
  const [apagando, setApagando] = useState<number | null>(null);
  const campoArquivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let ativo = true;
    servicoIdentidade(criarClienteNavegador())
      .listarFotosDaPrestadora(prestadoraId)
      .then(
        (lista) => ativo && setFotos(lista),
        (e) => ativo && (setFotos([]), setErro(mensagem(e, "Não foi possível carregar suas fotos."))),
      );
    return () => {
      ativo = false;
    };
  }, [prestadoraId]);

  async function enviar(arquivo: File) {
    setErro(null);
    const problema = validarArquivoFoto(arquivo); // avisa antes de gastar o envio
    if (problema) {
      setErro(problema);
      return;
    }
    setEnviando(true);
    try {
      const nova = await servicoIdentidade(criarClienteNavegador()).enviarMinhaFoto(arquivo);
      setFotos((atuais) => [...(atuais ?? []), nova]);
    } catch (e) {
      setErro(mensagem(e, "Não foi possível enviar a foto. Tente de novo."));
    } finally {
      setEnviando(false);
      if (campoArquivo.current) campoArquivo.current.value = ""; // permite escolher o mesmo arquivo de novo
    }
  }

  async function apagar(fotoId: number) {
    setErro(null);
    setApagando(fotoId);
    try {
      await servicoIdentidade(criarClienteNavegador()).apagarMinhaFoto(fotoId);
      setFotos((atuais) => (atuais ?? []).filter((f) => f.id !== fotoId));
    } catch (e) {
      setErro(mensagem(e, "Não foi possível apagar a foto. Tente de novo."));
    } finally {
      setApagando(null);
      setConfirmando(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {erro && <Aviso tipo="erro">{erro}</Aviso>}

      <label className={`${classeBotao} cursor-pointer md:w-80 md:self-start ${enviando ? "pointer-events-none opacity-60" : ""}`}>
        {enviando ? "Enviando…" : "Adicionar foto"}
        <input
          ref={campoArquivo}
          type="file"
          accept={ACEITOS}
          className="sr-only"
          disabled={enviando}
          onChange={(e) => {
            const arquivo = e.currentTarget.files?.[0];
            if (arquivo) void enviar(arquivo);
          }}
        />
      </label>
      <p className="-mt-2 text-center text-xs text-suave md:w-80">JPG, PNG ou WebP, até 5 MB.</p>

      {fotos === null && <p className="text-sm text-suave">Carregando suas fotos…</p>}
      {fotos?.length === 0 && (
        <p className="text-[14.5px] leading-[1.45] text-corpo">
          Você ainda não enviou fotos dos seus trabalhos. Elas aparecem na sua página pública.
        </p>
      )}

      {fotos && fotos.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
          {fotos.map((foto, indice) => {
            const url = urlFotoPortfolio(foto.caminho);
            const descricao = `Trabalho ${indice + 1} de ${fotos.length}`;
            return (
              <li key={foto.id} className="flex flex-col gap-1.5">
                <div className="aspect-square overflow-hidden rounded-[14px] bg-areia">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt={descricao} loading="lazy" className="h-full w-full object-cover" />
                  ) : (
                    <div
                      role="img"
                      aria-label={`${descricao} (sem pré-visualização no modo de exemplo)`}
                      className="flex h-full w-full items-center justify-center p-2 text-center text-xs text-suave"
                    >
                      foto enviada
                    </div>
                  )}
                </div>
                {confirmando === foto.id ? (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => void apagar(foto.id)}
                      disabled={apagando === foto.id}
                      className="min-h-11 flex-1 rounded-full bg-vinho text-sm font-bold text-white disabled:opacity-60"
                    >
                      {apagando === foto.id ? "Apagando…" : "Apagar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmando(null)}
                      disabled={apagando === foto.id}
                      className="min-h-11 flex-1 rounded-full border border-campo text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmando(foto.id)}
                    aria-label={`Apagar ${descricao.toLowerCase()}`}
                    className="min-h-11 rounded-full border border-campo text-sm text-corpo"
                  >
                    Apagar
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
