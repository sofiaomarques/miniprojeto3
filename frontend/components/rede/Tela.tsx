import Link from "next/link";

import { UnreadBadge } from "@/components/chat/UnreadBadge";

import { IconeBusca, IconeCasa, IconeChat, IconeCoracao, IconePessoa } from "./icones";

// Moldura de todas as telas, responsiva por padrão. No celular é uma coluna
// de tela cheia. A partir de md ocupa a página toda: cada faixa (cabeçalho rosa,
// barra de abas, conteúdo) vai de ponta a ponta, com o conteúdo centralizado em
// até 72rem (regra .tela em globals.css, que vence o md:px-* dos filhos
// diretos). Telas de formulário passam
// estreita: no computador viram um cartão centralizado, que não estica.
export function Tela({
  children,
  className = "",
  estreita = false,
}: {
  children: React.ReactNode;
  className?: string;
  estreita?: boolean;
}) {
  const classeComputador = estreita
    ? "md:my-10 md:min-h-0 md:max-w-lg md:rounded-[28px]"
    : "tela md:max-w-none md:shadow-none";
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-crema shadow-xl ${classeComputador} ${className}`}
    >
      {children}
    </div>
  );
}

// fraseSoNoLg: na barra de abas (topo a partir de md), entre 768 e 1023 px a
// frase espremia em três linhas ao lado das quatro abas; lá ela só aparece
// a partir de lg. Nas telas de conta, aparece sempre.
export function Marca({
  fundo = "rosa",
  fraseSoNoLg = false,
}: {
  fundo?: "rosa" | "papel";
  fraseSoNoLg?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-vinho ${
          fundo === "rosa" ? "bg-rosa" : "bg-papel"
        }`}
      >
        <IconeCasa />
      </div>
      {/* O nome não diz o nicho: a frase logo abaixo diz para quem é a rede. */}
      <span className="flex min-w-0 flex-col">
        <span className="font-display text-[19px] font-semibold leading-tight">Repara</span>
        <span
          className={`max-w-[15rem] text-[12px] leading-tight text-corpo ${fraseSoNoLg ? "hidden lg:block" : ""}`}
        >
          Mulheres que contratam mulheres, com confiança
        </span>
      </span>
    </div>
  );
}

export function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[12.5px] font-bold uppercase tracking-[0.04em] text-suave">
      {children}
    </span>
  );
}

const ABAS = [
  { id: "buscar", rotulo: "Buscar", href: "/", Icone: IconeBusca },
  // Feed: indicações de quem eu sigo (#81).
  { id: "indicacoes", rotulo: "Indicações", href: "/indicacoes", Icone: IconeCoracao },
  { id: "conversas", rotulo: "Conversas", href: "/chat", Icone: IconeChat },
  { id: "perfil", rotulo: "Perfil", href: "/perfil", Icone: IconePessoa },
] as const;

type Aba = (typeof ABAS)[number]["id"];

// Abas principais. No celular ficam embaixo, como num app; a partir de md
// sobem para o topo (order-first na coluna da Tela), com a marca à esquerda.
// Para telas que só mostram as abas no computador, passe className="hidden md:flex".
export function BarraAbas({ ativa, className = "" }: { ativa?: Aba; className?: string }) {
  return (
    <nav
      aria-label="Principal"
      className={`flex border-t border-borda bg-papel px-5 pb-5 pt-2.5 md:sticky md:top-0 md:z-10 md:order-first md:items-center md:gap-1 md:border-b md:border-t-0 md:py-2.5 ${className}`}
    >
      <Link href="/" aria-label="Repara, ir para a busca" className="mr-auto hidden rounded-full md:block">
        <Marca fraseSoNoLg />
      </Link>
      {ABAS.map(({ id, rotulo, href, Icone }) => {
        const on = id === ativa;
        return (
          <Link
            key={id}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs md:flex-none md:flex-row md:gap-2 md:rounded-full md:px-4 md:text-[14.5px] ${
              on ? "font-bold text-vinho md:bg-rosa" : "font-medium text-suave md:hover:bg-rosa-claro"
            }`}
          >
            {/* Aba Conversas: número de não lidas (#38) no canto do ícone. No
                computador o texto fica ao lado do ícone, então o número vai
                para o canto esquerdo, para não cobrir o "C". */}
            <span className="relative">
              <Icone />
              {id === "conversas" && (
                <UnreadBadge className="absolute -right-2.5 -top-1.5 md:-left-3 md:right-auto" />
              )}
            </span>
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}

export const classeBotao =
  "flex h-[52px] w-full items-center justify-center gap-2 rounded-full bg-vinho text-base font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho";

export const classeCampo =
  "h-[46px] w-full rounded-[14px] border border-campo bg-papel px-3.5 text-[15px] text-texto placeholder:text-suave focus-visible:outline-2 focus-visible:outline-vinho";
