// Caixa de mensagem para o topo de formulários e páginas. Erros usam
// role="alert" (anunciados na hora); os demais, role="status".
import type { ReactNode } from "react";

type Tipo = "erro" | "sucesso" | "info";

const ESTILOS: Record<Tipo, string> = {
  erro: "border-red-200 bg-red-50 text-red-800",
  sucesso: "border-green-200 bg-green-50 text-green-800",
  info: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function Aviso({ tipo = "info", children }: { tipo?: Tipo; children: ReactNode }) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-md border px-3 py-2 text-sm ${ESTILOS[tipo]}`}
    >
      {children}
    </div>
  );
}
