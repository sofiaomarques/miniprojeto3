"use client";

// Tela "Como foi o serviço?": cria a avaliação ou, se a cliente já avaliou
// esta prestadora, edita ou apaga a existente. As regras (nota 1 a 5, uma por
// cliente) ficam em lib/descoberta/service.ts e na RLS da 02.
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

import { IconeEstrela, IconeInfo, IconeVoltar } from "@/components/rede/icones";
import { classeBotao } from "@/components/rede/Tela";
import {
  apagarAvaliacao,
  criarAvaliacao,
  editarAvaliacao,
  obterPrestadora,
} from "@/lib/descoberta/service";
import type { Avaliacao, PrestadoraDetalhe } from "@/lib/descoberta/types";

import { Avatar } from "./Avatar";
import { linhaServicoCidade } from "./Categorias";
import { Carregando, Erro, Vazio } from "./Estados";

const ROTULOS = ["Ruim", "Regular", "Boa", "Muito boa", "Excelente"];
const LIMITE_COMENTARIO = 1000;

type Props = { prestadoraId: string; clienteId: string };

export function FormularioAvaliacao({ prestadoraId, clienteId }: Props) {
  const router = useRouter();
  const [prestadora, setPrestadora] = useState<PrestadoraDetalhe | null | undefined>(undefined);
  const [existente, setExistente] = useState<Avaliacao | null>(null);
  const [erroCarga, setErroCarga] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const [nota, setNota] = useState(0);
  const [comentario, setComentario] = useState("");
  const [ocupada, setOcupada] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setErroCarga(false);
    setPrestadora(undefined);
    obterPrestadora(prestadoraId).then(
      (p) => {
        if (cancelado) return;
        const minha = p?.avaliacoes.find((a) => a.clienteId === clienteId) ?? null;
        setPrestadora(p);
        setExistente(minha);
        setNota(minha?.nota ?? 0);
        setComentario(minha?.comentario ?? "");
      },
      (err) => {
        if (cancelado) return;
        console.error("Erro ao carregar a prestadora:", err);
        setErroCarga(true);
      },
    );
    return () => {
      cancelado = true;
    };
  }, [prestadoraId, clienteId, tentativa]);

  const voltarPara = `/prestadoras/${prestadoraId}`;

  async function executar(acao: () => Promise<unknown>) {
    setOcupada(true);
    setErro(null);
    try {
      await acao();
      router.push(voltarPara);
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não consegui salvar a avaliação.");
      setOcupada(false);
    }
  }

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (nota < 1) {
      setErro("Escolha de 1 a 5 estrelas.");
      return;
    }
    const dados = { nota, comentario };
    void executar(() =>
      existente
        ? editarAvaliacao(clienteId, existente.id, dados)
        : criarAvaliacao(clienteId, { prestadoraId, ...dados }),
    );
  }

  function apagar() {
    if (!existente || !window.confirm("Apagar sua avaliação?")) return;
    void executar(() => apagarAvaliacao(clienteId, existente.id));
  }

  const voltar = (
    <Link
      href={voltarPara}
      aria-label="Voltar ao perfil"
      className="-ml-2.5 flex h-11 w-11 items-center justify-center"
    >
      <IconeVoltar size={24} />
    </Link>
  );

  if (erroCarga) {
    return (
      <>
        {voltar}
        <Erro mensagem="Não consegui carregar a prestadora." onTentarDeNovo={() => setTentativa((t) => t + 1)} />
      </>
    );
  }
  if (prestadora === undefined) {
    return (
      <>
        {voltar}
        <Carregando texto="Carregando…" linhas={1} />
      </>
    );
  }
  if (prestadora === null) {
    return (
      <>
        {voltar}
        <Vazio>
          Prestadora não encontrada.{" "}
          <Link href="/" className="font-bold text-vinho underline">
            Ver outras prestadoras
          </Link>
        </Vazio>
      </>
    );
  }

  const { perfil, categorias } = prestadora;
  const primeiroNome = perfil.nome?.split(" ")[0] ?? "a prestadora";

  return (
    <form onSubmit={enviar} className="flex flex-1 flex-col gap-[22px]">
      {voltar}

      <div className="flex flex-col items-center gap-2.5 text-center">
        <Avatar nome={perfil.nome} url={perfil.avatar_url} tamanho={84} fundo="rosa" />
        <h1 className="font-display text-[28px] font-semibold leading-[1.15]">
          {existente ? `Sua avaliação de ${primeiroNome}` : `Como foi o serviço com ${primeiroNome}?`}
        </h1>
        <span className="text-sm text-suave">{linhaServicoCidade(categorias, perfil.cidade)}</span>
      </div>

      <fieldset className="flex flex-col items-center gap-2" disabled={ocupada}>
        <legend className="sr-only">Nota</legend>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNota(n)}
              aria-pressed={nota === n}
              aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}: ${ROTULOS[n - 1]}`}
              className="flex h-12 w-12 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-vinho"
            >
              <IconeEstrela size={40} preenchida={n <= nota} className="text-vinho" />
            </button>
          ))}
        </div>
        <span aria-live="polite" className="min-h-5 text-sm font-bold text-vinho">
          {nota > 0 ? ROTULOS[nota - 1] : "Toque nas estrelas"}
        </span>
      </fieldset>

      <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
        Seu comentário (opcional)
        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          maxLength={LIMITE_COMENTARIO}
          disabled={ocupada}
          placeholder="Conte como foi a experiência, a pontualidade e se você se sentiu segura."
          className="h-[140px] resize-none rounded-2xl border border-campo bg-papel p-3.5 text-base leading-[1.45] placeholder:text-suave focus-visible:outline-2 focus-visible:outline-vinho"
        />
        <span className="self-end text-xs font-normal text-suave">
          {comentario.length}/{LIMITE_COMENTARIO}
        </span>
      </label>

      <div className="flex items-start gap-2.5 rounded-2xl bg-areia p-3.5">
        <IconeInfo size={22} className="shrink-0 text-vinho" />
        <span className="text-[13.5px] leading-[1.45] text-corpo">
          Sua avaliação é pública e fica no perfil de {primeiroNome} e no seu. Cada cliente avalia
          uma prestadora uma única vez; depois dá para editar.
        </span>
      </div>

      {erro && (
        <p role="alert" className="text-center text-sm text-vinho">
          {erro}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-1">
        <button type="submit" disabled={ocupada} aria-busy={ocupada || undefined} className={`${classeBotao} disabled:opacity-60`}>
          {ocupada ? "Salvando…" : existente ? "Salvar alterações" : "Publicar avaliação"}
        </button>
        {existente && (
          <button
            type="button"
            onClick={apagar}
            disabled={ocupada}
            className="min-h-11 text-[14.5px] font-bold text-vinho disabled:opacity-60"
          >
            Apagar avaliação
          </button>
        )}
      </div>
    </form>
  );
}
