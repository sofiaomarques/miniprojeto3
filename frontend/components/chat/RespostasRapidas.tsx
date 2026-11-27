import type { RespostaRapida } from "@/lib/chat/respostas";

type Props = { respostas: RespostaRapida[]; aoEscolher: (texto: string) => void };

// Botões de resposta rápida (#39), no visual do protótipo. O primeiro é o de
// orçamento e ganha destaque; escolher preenche o campo para completar.
export function RespostasRapidas({ respostas, aoEscolher }: Props) {
  if (respostas.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Respostas rápidas">
      {respostas.map((r, i) => (
        <button
          key={r.rotulo}
          type="button"
          onClick={() => aoEscolher(r.texto)}
          className={`min-h-10 rounded-full border px-3.5 text-[13.5px] focus-visible:outline-2 focus-visible:outline-vinho ${
            i === 0 ? "border-vinho bg-rosa-claro font-bold text-vinho" : "border-campo bg-papel"
          }`}
        >
          {r.rotulo}
        </button>
      ))}
    </div>
  );
}
