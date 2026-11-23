// Caixa de mensagem para o topo de formulários e páginas. Erros usam
// role="alert" (anunciados na hora); os demais, role="status".
import type { ReactNode } from "react";

type Tipo = "erro" | "sucesso" | "info";

const ESTILOS: Record<Tipo, string> = {
  erro: "border-red-200 bg-red-50 text-red-800",
  sucesso: "border-green-200 bg-green-50 text-green-800",
  info: "border-borda bg-areia text-corpo",
};

export function Aviso({ tipo = "info", children }: { tipo?: Tipo; children: ReactNode }) {
  return (
    <div
      role={tipo === "erro" ? "alert" : "status"}
      className={`rounded-2xl border px-3.5 py-3 text-[13.5px] leading-[1.45] ${ESTILOS[tipo]}`}
    >
      {children}
    </div>
  );
}
