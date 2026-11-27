"use client";

// Encontrar pessoas pelo nome (amigas, clientes, prestadoras) para seguir.
import { useEffect, useState } from "react";

import { Carregando, Erro, Vazio } from "@/components/descoberta/Estados";
import { classeCampo } from "@/components/rede/Tela";
import { termoDeBusca } from "@/lib/seguidores/regras";
import { buscarPessoas } from "@/lib/seguidores/service";
import type { PessoaResumo } from "@/lib/seguidores/types";

import { ListaPessoas } from "./ListaPessoas";

// Espera a pessoa parar de digitar antes de buscar.
const ESPERA_MS = 300;

export function BuscaPessoas({ minhaId }: { minhaId: string }) {
  const [texto, setTexto] = useState("");
  const [resultado, setResultado] = useState<PessoaResumo[] | null>(null);
  const [erro, setErro] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const termo = termoDeBusca(texto);

  useEffect(() => {
    setErro(false);
    if (!termo) {
      setResultado(null);
      return;
    }
    let cancelado = false;
    setResultado(null);
    const espera = setTimeout(() => {
      buscarPessoas(termo).then(
        (lista) => !cancelado && setResultado(lista.filter((p) => p.id !== minhaId)),
        (err) => {
          if (cancelado) return;
          console.error("Erro ao buscar pessoas:", err);
          setErro(true);
        },
      );
    }, ESPERA_MS);
    return () => {
      cancelado = true;
      clearTimeout(espera);
    };
  }, [termo, minhaId, tentativa]);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-bold text-texto">Nome</span>
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Ex.: Fernanda"
          autoComplete="off"
          className={classeCampo}
        />
      </label>

      <p aria-live="polite" className="sr-only">
        {resultado
          ? `${resultado.length} ${resultado.length === 1 ? "pessoa encontrada" : "pessoas encontradas"}`
          : ""}
      </p>

      {!termo && (
        <p className="text-[14.5px] leading-[1.45] text-corpo">
          Procure suas amigas pelo nome para ver as indicações delas, ou prestadoras que você quer acompanhar.
        </p>
      )}
      {termo && erro && (
        <Erro mensagem="Não consegui buscar agora." onTentarDeNovo={() => setTentativa((t) => t + 1)} />
      )}
      {termo && !erro && resultado === null && <Carregando texto="Buscando…" linhas={2} />}
      {resultado?.length === 0 && <Vazio>Ninguém com esse nome por aqui.</Vazio>}
      {resultado && resultado.length > 0 && <ListaPessoas pessoas={resultado} />}
    </div>
  );
}
