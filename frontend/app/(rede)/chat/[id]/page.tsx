"use client";
// A página só compõe componentes; as regras e queries ficam em lib/chat.
// Mensagens novas chegam em tempo real (#37). Visual do protótipo "Repara"
// (components/rede) e respostas rápidas de orçamento (#39).

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { AvisoDeslogada } from "@/components/chat/AvisoDeslogada";
import { BolhaMensagem } from "@/components/chat/BolhaMensagem";
import { CampoMensagem } from "@/components/chat/CampoMensagem";
import { RespostasRapidas } from "@/components/chat/RespostasRapidas";
import { Avatar } from "@/components/descoberta/Avatar";
import { BotaoInicio } from "@/components/rede/BotaoInicio";
import { IconeVoltar } from "@/components/rede/icones";
import { Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { respostasRapidas } from "@/lib/chat/respostas";
import {
  assinarMensagens,
  enviarMensagem,
  listarMensagens,
  marcarLidas,
  obterConversa,
  obterUsuariaAtualId,
} from "@/lib/chat/service";
import { type Conversa, juntarMensagens, type Mensagem } from "@/lib/chat/types";

// Só dígitos: Number() aceitaria "1e3", "0x10" ou " 5 ".
function lerId(id: string | undefined): number | null {
  return id && /^\d+$/.test(id) ? Number(id) : null;
}

type Estado =
  | { tipo: "carregando" }
  | { tipo: "deslogada" }
  | { tipo: "nao-encontrada" }
  | { tipo: "erro" }
  | { tipo: "pronta"; conversa: Conversa; usuariaId: string };

export default function ConversaPage() {
  const params = useParams<{ id: string }>();
  const conversaId = lerId(params.id);

  const [estado, setEstado] = useState<Estado>({ tipo: "carregando" });
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  // Texto lido pelo leitor de tela quando chega mensagem nova. `vez` muda a
  // cada mensagem para o DOM mudar mesmo com o texto repetido (senão o
  // role="status" fica em silêncio a partir da 2ª).
  const [avisoNova, setAvisoNova] = useState({ texto: "", vez: 0 });
  // Texto do campo de mensagem (as respostas rápidas preenchem).
  const [texto, setTexto] = useState("");
  // "Tentar de novo" no erro: muda para refazer o carregamento.
  const [tentativa, setTentativa] = useState(0);
  const fim = useRef<HTMLDivElement>(null);
  // Última lista na tela, para a assinatura saber o maior id já carregado.
  const mensagensRef = useRef<Mensagem[]>([]);
  mensagensRef.current = mensagens;

  useEffect(() => {
    // Ao trocar de conversa, limpa a anterior e ignora respostas atrasadas dela.
    let atual = true;
    setEstado({ tipo: "carregando" });
    setMensagens([]);
    setAvisoNova({ texto: "", vez: 0 });
    setTexto("");

    if (conversaId === null) {
      setEstado({ tipo: "nao-encontrada" });
      return;
    }

    (async () => {
      const usuariaId = await obterUsuariaAtualId();
      if (!atual) return;
      if (!usuariaId) {
        setEstado({ tipo: "deslogada" });
        return;
      }
      const [conversa, lista] = await Promise.all([
        obterConversa(conversaId),
        listarMensagens(conversaId),
      ]);
      if (!atual) return;
      if (!conversa) {
        setEstado({ tipo: "nao-encontrada" });
        return;
      }
      setEstado({ tipo: "pronta", conversa, usuariaId });
      setMensagens(lista);

      if (conversa.naoLidas > 0) {
        try {
          await marcarLidas(conversaId);
          if (!atual) return;
          const agora = new Date().toISOString();
          setMensagens((ms) =>
            ms.map((m) => (m.autorId !== usuariaId && m.lidaEm === null ? { ...m, lidaEm: agora } : m)),
          );
        } catch {
          // Não bloqueia a conversa: as mensagens continuam não lidas e a
          // próxima abertura tenta de novo.
        }
      }
    })().catch(() => {
      if (atual) setEstado({ tipo: "erro" });
    });

    return () => {
      atual = false;
    };
  }, [conversaId, tentativa]);

  // Tempo real (#37): assina quando a conversa termina de carregar e cancela
  // ao sair da tela ou trocar de conversa.
  const conversaPronta = estado.tipo === "pronta" ? estado.conversa : null;
  const usuariaPronta = estado.tipo === "pronta" ? estado.usuariaId : null;
  useEffect(() => {
    if (!conversaPronta || !usuariaPronta) return;
    const id = conversaPronta.id;
    const nomeOutra = conversaPronta.outra.nome || "a outra pessoa";
    const ultimoId = Math.max(0, ...mensagensRef.current.map((m) => m.id));
    let ativa = true;

    // Marca como lidas as mensagens recebidas que estão na tela. Só com a aba
    // na frente: com ela escondida, continuam não lidas (e o badge conta).
    function lerRecebidas() {
      if (document.visibilityState !== "visible") return;
      const temNaoLida = mensagensRef.current.some(
        (m) => m.autorId !== usuariaPronta && m.lidaEm === null,
      );
      if (!temNaoLida) return;
      marcarLidas(id)
        .then(() => {
          if (!ativa) return;
          const agora = new Date().toISOString();
          setMensagens((ms) =>
            ms.map((m) => (m.autorId !== usuariaPronta && m.lidaEm === null ? { ...m, lidaEm: agora } : m)),
          );
        })
        .catch(() => {
          // Ficam não lidas; a próxima vez que a aba voltar tenta de novo.
        });
    }

    const cancelar = assinarMensagens(id, ultimoId, (nova) => {
      mensagensRef.current = juntarMensagens(mensagensRef.current, nova);
      setMensagens((atuais) => juntarMensagens(atuais, nova));
      if (nova.autorId === usuariaPronta) return;

      const previa = nova.texto.length > 100 ? `${nova.texto.slice(0, 100)}…` : nova.texto;
      setAvisoNova((a) => ({ texto: `Nova mensagem de ${nomeOutra}: ${previa}`, vez: a.vez + 1 }));
      lerRecebidas();
    });

    // Mensagem que chegou com a aba escondida vira lida quando ela volta.
    document.addEventListener("visibilitychange", lerRecebidas);

    return () => {
      ativa = false;
      cancelar();
      document.removeEventListener("visibilitychange", lerRecebidas);
    };
  }, [conversaPronta, usuariaPronta]);

  useEffect(() => {
    fim.current?.scrollIntoView({ block: "end" });
  }, [mensagens]);

  async function enviar(texto: string) {
    if (estado.tipo !== "pronta") return;
    const nova = await enviarMensagem(estado.conversa.id, texto);
    setMensagens((atuais) => juntarMensagens(atuais, nova));
  }

  // Cabeçalho rosa do protótipo; sem conversa carregada, só o voltar.
  const cabecalho = (titulo: string, subtitulo?: string) => (
    <div className="flex items-center gap-2 bg-rosa px-3 py-4">
      <Link
        href="/chat"
        aria-label="Voltar para as conversas"
        className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-vinho"
      >
        <IconeVoltar size={24} />
      </Link>
      {estado.tipo === "pronta" && (
        <Avatar
          nome={estado.conversa.outra.nome}
          url={estado.conversa.outra.avatarUrl}
          tamanho={42}
          fundo="papel"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-px">
        <h1 className="truncate text-base font-bold">{titulo}</h1>
        {subtitulo && <span className="text-[12.5px] text-corpo">{subtitulo}</span>}
      </div>
      <BotaoInicio />
    </div>
  );

  if (estado.tipo !== "pronta") {
    return (
      <Tela className="h-dvh">
        {cabecalho("Conversa")}
        <div className="flex-1 px-5 pt-6">
          {estado.tipo === "carregando" && <p className="text-sm text-suave">Carregando conversa…</p>}
          {estado.tipo === "deslogada" && <AvisoDeslogada voltarPara={`/chat/${params.id}`} />}
          {estado.tipo === "nao-encontrada" && (
            <Aviso tipo="info">
              Conversa não encontrada.{" "}
              <Link href="/chat" className="font-bold text-vinho underline">
                Ver suas conversas
              </Link>
            </Aviso>
          )}
          {estado.tipo === "erro" && (
            <div className="space-y-3">
              <Aviso tipo="erro">Não consegui abrir a conversa. Confira sua conexão.</Aviso>
              <button
                type="button"
                onClick={() => setTentativa((t) => t + 1)}
                className="min-h-10 rounded-full border border-campo bg-papel px-4 text-sm font-bold text-vinho"
              >
                Tentar de novo
              </button>
            </div>
          )}
        </div>
      </Tela>
    );
  }

  const { conversa, usuariaId } = estado;
  const souCliente = conversa.clienteId === usuariaId;
  const nomeOutra = conversa.outra.nome || "Participante";
  const respostas = respostasRapidas(souCliente ? "cliente" : "prestadora", conversa.outra.nome);

  return (
    <Tela className="h-dvh">
      {cabecalho(nomeOutra, souCliente ? "Prestadora" : "Cliente")}

      {/* Sem aria-live no histórico: o leitor de tela leria tudo ao abrir.
          Mensagem nova é anunciada só por este aviso. */}
      <p role="status" className="sr-only">
        {avisoNova.texto}
        {avisoNova.vez % 2 === 1 ? "​" : ""}
      </p>
      <div
        className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-2 pt-5"
        aria-label="Mensagens"
      >
        {mensagens.length === 0 && (
          <p className="my-auto text-center text-sm leading-relaxed text-corpo">
            {souCliente
              ? `Diga oi e conte para ${nomeOutra.split(" ")[0]} qual serviço você precisa.`
              : "Ainda não há mensagens nesta conversa."}
          </p>
        )}
        {mensagens.map((m) => (
          <BolhaMensagem key={m.id} mensagem={m} minha={m.autorId === usuariaId} />
        ))}

        <div className="mt-1.5">
          <RespostasRapidas respostas={respostas} aoEscolher={setTexto} />
        </div>

        {souCliente && mensagens.length > 0 && (
          <div className="mt-1.5 flex flex-col gap-2.5 rounded-[18px] bg-areia p-3.5">
            <span className="text-sm leading-snug text-corpo">
              Serviço concluído? Sua avaliação ajuda outras mulheres a escolher com segurança.
            </span>
            <Link
              href={`/prestadoras/${conversa.prestadoraId}`}
              className="flex h-11 items-center justify-center rounded-full bg-vinho text-[14.5px] font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
            >
              Avaliar {nomeOutra.split(" ")[0]}
            </Link>
          </div>
        )}
        <div ref={fim} />
      </div>

      <CampoMensagem texto={texto} aoMudar={setTexto} onEnviar={enviar} />
    </Tela>
  );
}
