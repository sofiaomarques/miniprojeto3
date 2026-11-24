// Botão padrão do app. Use `carregando` enquanto uma ação está em andamento:
// o botão fica desabilitado e troca o texto, evitando envio duplo.
import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "texto";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante;
  carregando?: boolean;
  textoCarregando?: string;
  larguraTotal?: boolean;
};

const ESTILOS: Record<Variante, string> = {
  primario: "bg-zinc-900 text-white hover:bg-zinc-700",
  secundario: "border border-zinc-300 bg-white text-zinc-900 hover:bg-zinc-100",
  texto: "text-zinc-600 underline-offset-4 hover:text-zinc-900 hover:underline",
};

export function Botao({
  variante = "primario",
  carregando = false,
  textoCarregando = "Aguarde…",
  larguraTotal = false,
  className = "",
  disabled,
  type = "button",
  children,
  ...resto
}: Props) {
  const base =
    variante === "texto"
      ? "text-sm"
      : "rounded-md px-4 py-2 text-sm font-medium transition-colors";
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={[
        base,
        ESTILOS[variante],
        larguraTotal ? "w-full" : "",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
      {...resto}
    >
      {carregando ? textoCarregando : children}
    </button>
  );
}
