// Mesma regra do `normalizar_texto` do banco: minúsculas e sem acento.
export function normalizarTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

// Média com 1 casa, como a view `prestadoras_resumo`.
export function mediaComUmaCasa(notas: number[]): number | null {
  if (notas.length === 0) return null;
  const soma = notas.reduce((total, nota) => total + nota, 0);
  return Math.round((soma / notas.length) * 10) / 10;
}
