import type { CategoriaResumo } from "@/lib/descoberta/types";

// Nomes dos serviços separados por vírgula ("Elétrica, Encanamento").
export function textoCategorias(categorias: CategoriaResumo[]): string {
  return categorias.map((c) => c.nome).join(", ");
}

// Cidade para mostrar ao lado do pino; sem cidade, avisa em vez de sumir.
export function textoCidade(cidade: string | null): string {
  return cidade?.trim() || "Cidade não informada";
}

// "Encanamento · Recife", omitindo o que estiver vazio.
export function linhaServicoCidade(categorias: CategoriaResumo[], cidade: string | null): string {
  return [textoCategorias(categorias), cidade].filter(Boolean).join(" · ") || "Cidade não informada";
}
