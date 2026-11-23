// Nota em estrelas, acessível: leitores de tela ouvem o texto, não os símbolos.
export function Estrelas({ nota, total }: { nota: number | null; total: number }) {
  if (nota === null || total === 0) {
    return <span className="text-sm text-zinc-500">Sem avaliações</span>;
  }
  const cheias = Math.round(nota);
  const notaTexto = nota.toFixed(1).replace(".", ",");
  const rotulo = `Nota ${notaTexto} de 5, ${total} ${total === 1 ? "avaliação" : "avaliações"}`;
  return (
    <span className="inline-flex items-center gap-1 text-sm" role="img" aria-label={rotulo}>
      <span aria-hidden="true" className="text-amber-500">
        {"★".repeat(cheias)}
        <span className="text-zinc-300">{"★".repeat(5 - cheias)}</span>
      </span>
      <span aria-hidden="true" className="font-medium">
        {notaTexto}
      </span>
      <span aria-hidden="true" className="text-zinc-500">
        ({total})
      </span>
    </span>
  );
}
