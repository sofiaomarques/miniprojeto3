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
  primario: "bg-vinho text-white hover:bg-vinho-escuro",
  secundario: "border border-campo bg-papel text-texto hover:bg-areia",
  texto: "font-bold text-vinho underline-offset-4 hover:underline",
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
      : "inline-flex h-[52px] items-center justify-center gap-2 rounded-full px-6 text-base font-bold transition-colors";
  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={[
        base,
        ESTILOS[variante],
        larguraTotal ? "w-full" : "",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ].join(" ")}
      {...resto}
    >
      {carregando ? textoCarregando : children}
    </button>
  );
}
