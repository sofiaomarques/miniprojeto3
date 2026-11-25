// Notas em estrelas, acessíveis: leitores de tela ouvem o texto, não os símbolos.

function formatarNota(nota: number): string {
  return nota.toFixed(1).replace(".", ",");
}

function Simbolos({ cheias }: { cheias: number }) {
  return (
    <span aria-hidden="true" className="tracking-tight text-amber-500">
      {"★".repeat(cheias)}
      <span className="text-zinc-300">{"★".repeat(5 - cheias)}</span>
    </span>
  );
}

// Nota média de uma prestadora (1 casa decimal) e quantas avaliações.
export function Estrelas({ nota, total }: { nota: number | null; total: number }) {
  if (nota === null || total === 0) {
    return <span className="text-sm text-zinc-500">Sem avaliações ainda</span>;
  }
  const notaTexto = formatarNota(nota);
  const rotulo = `Nota média ${notaTexto} de 5, ${total} ${total === 1 ? "avaliação" : "avaliações"}`;
  return (
    <span className="inline-flex items-center gap-1 text-sm" role="img" aria-label={rotulo}>
      <Simbolos cheias={Math.round(nota)} />
      <span aria-hidden="true" className="font-medium">
        {notaTexto}
      </span>
      <span aria-hidden="true" className="text-zinc-500">
        ({total})
      </span>
    </span>
  );
}

// Nota de uma avaliação só (inteira, de 1 a 5).
export function NotaAvaliacao({ nota }: { nota: number }) {
  return (
    <span
      role="img"
      aria-label={`${nota} de 5 ${nota === 1 ? "estrela" : "estrelas"}`}
      className="inline-block"
    >
      <Simbolos cheias={nota} />
    </span>
  );
}
