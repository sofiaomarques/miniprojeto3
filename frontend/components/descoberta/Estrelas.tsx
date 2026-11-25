// Notas em estrelas, acessíveis: leitores de tela ouvem o texto, não os ícones.
import { IconeEstrela } from "@/components/rede/icones";

export function formatarNota(nota: number): string {
  return nota.toFixed(1).replace(".", ",");
}

const plural = (n: number) => `${n} ${n === 1 ? "avaliação" : "avaliações"}`;

// Selo da nota média (1 casa decimal), usado nos cartões da busca.
export function SeloNota({ nota, total }: { nota: number | null; total: number }) {
  if (nota === null || total === 0) {
    return (
      <span className="shrink-0 rounded-[14px] bg-areia px-2.5 py-1 text-xs font-medium text-suave">
        Nova
      </span>
    );
  }
  return (
    <span
      role="img"
      aria-label={`Nota média ${formatarNota(nota)} de 5, ${plural(total)}`}
      className="flex shrink-0 items-center gap-1 rounded-[14px] bg-rosa px-2.5 py-1 text-sm font-bold"
    >
      <IconeEstrela className="text-vinho" />
      <span aria-hidden="true">{formatarNota(nota)}</span>
    </span>
  );
}

// Nota média por extenso, no cabeçalho da prestadora.
export function NotaMedia({ nota, total }: { nota: number | null; total: number }) {
  if (nota === null || total === 0) {
    return <span className="text-sm text-corpo">Sem avaliações ainda</span>;
  }
  return (
    <span
      role="img"
      aria-label={`Nota média ${formatarNota(nota)} de 5, ${plural(total)}`}
      className="flex items-center gap-1.5 text-sm"
    >
      <IconeEstrela size={15} className="text-vinho" />
      <b aria-hidden="true">{formatarNota(nota)}</b>
      <span aria-hidden="true" className="text-corpo">
        · {plural(total)}
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
      className="flex shrink-0 gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <IconeEstrela key={n} size={14} preenchida={n <= nota} className="text-vinho" />
      ))}
    </span>
  );
}
