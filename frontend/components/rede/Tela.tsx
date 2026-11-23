import Link from "next/link";

import { IconeBusca, IconeCasa, IconeChat, IconePessoa } from "./icones";

// Coluna de celular centralizada; no desktop vira um "aparelho" no meio da página.
export function Tela({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`mx-auto flex min-h-dvh w-full max-w-[430px] flex-col bg-crema shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function Marca({ fundo = "rosa" }: { fundo?: "rosa" | "papel" }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full text-vinho ${
          fundo === "rosa" ? "bg-rosa" : "bg-papel"
        }`}
      >
        <IconeCasa />
      </div>
      <span className="font-display text-[19px] font-semibold">Rede de Mulheres</span>
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

export function Avatar({
  iniciais,
  tamanho,
  fundo,
}: {
  iniciais: string;
  tamanho: number;
  fundo: "rosa" | "areia" | "papel";
}) {
  const bg = { rosa: "bg-rosa", areia: "bg-areia", papel: "bg-papel" }[fundo];
  return (
    <div
      style={{ width: tamanho, height: tamanho, fontSize: tamanho * 0.36 }}
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-vinho-escuro ${bg}`}
    >
      {iniciais}
    </div>
  );
}

const ABAS = [
  { id: "buscar", rotulo: "Buscar", href: "/", Icone: IconeBusca },
  { id: "conversas", rotulo: "Conversas", href: "/chat", Icone: IconeChat },
  { id: "perfil", rotulo: "Perfil", href: "/perfil", Icone: IconePessoa },
] as const;

export function BarraAbas({ ativa }: { ativa: (typeof ABAS)[number]["id"] }) {
  return (
    <nav
      aria-label="Principal"
      className="flex border-t border-borda bg-papel px-5 pb-5 pt-2.5"
    >
      {ABAS.map(({ id, rotulo, href, Icone }) => {
        const on = id === ativa;
        return (
          <Link
            key={id}
            href={href}
            aria-current={on ? "page" : undefined}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 text-xs ${
              on ? "font-bold text-vinho" : "font-medium text-suave"
            }`}
          >
            <Icone />
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
