"use client";
// Formulário da tela "Preços dos serviços": para cada serviço, o preço base
// (vazio = "a combinar") e o aviso "Aceito negociar este valor". Mesmo visual
// das outras telas da Repara (classeBotao, cartões bg-papel).
import { useActionState, useState } from "react";
import { salvarPrecos, type EstadoPrecos } from "@/app/(rede)/perfil/precos/acoes";
import { classeBotao } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { precoParaCampo } from "@/lib/identidade/dinheiro";
import { campoNegocia, campoPreco, type LinhaPreco } from "@/lib/identidade/precos-formulario";

type Props = { linhas: LinhaPreco[] };

function LinhaServico({
  linha,
  inicial,
  erro,
}: {
  linha: LinhaPreco;
  inicial: { preco: string; negocia: boolean };
  erro?: string;
}) {
  const [preco, setPreco] = useState(inicial.preco);
  const [negocia, setNegocia] = useState(inicial.negocia);
  const id = linha.categoria_id;
  const semPreco = preco.trim() === "";
  const idErro = `erro-preco-${id}`;
  const idDica = `dica-preco-${id}`;

  return (
    <li className="flex flex-col gap-3 rounded-[20px] border border-borda bg-papel p-4">
      <input type="hidden" name="servico" value={id} />
      <label className="flex flex-col gap-1.5">
        <b className="text-base">{linha.nome}</b>
        <span className="text-[13px] text-suave">Preço base</span>
        <span
          className={`flex h-[46px] items-center gap-2 rounded-[14px] border bg-crema px-3.5 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-vinho ${
            erro ? "border-vinho" : "border-campo"
          }`}
        >
          <span aria-hidden="true" className="text-[15px] font-bold text-vinho">
            R$
          </span>
          <input
            name={campoPreco(id)}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            maxLength={12}
            placeholder="A combinar"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            aria-invalid={erro ? true : undefined}
            aria-describedby={erro ? idErro : idDica}
            className="min-w-0 flex-1 bg-transparent text-[15px] text-texto outline-none placeholder:text-suave"
          />
        </span>
      </label>
      {erro ? (
        <p id={idErro} className="-mt-1.5 text-[13px] font-medium text-vinho-escuro">
          {erro}
        </p>
      ) : (
        <p id={idDica} className="-mt-1.5 text-[12.5px] text-suave">
          {semPreco ? "Sem preço, a cliente vê “a combinar”." : "Ex.: 150 ou 150,50"}
        </p>
      )}

      {/* Interruptor: checkbox de verdade (teclado e leitor de tela de graça),
          com o visual de pílula. Sem preço não há o que negociar. */}
      <label
        className={`flex min-h-11 items-center justify-between gap-3 rounded-full border px-3.5 text-[14px] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-vinho ${
          semPreco
            ? "cursor-not-allowed border-borda text-suave"
            : "cursor-pointer border-campo has-[:checked]:border-vinho has-[:checked]:bg-rosa"
        }`}
      >
        <span>Aceito negociar este valor</span>
        <input
          type="checkbox"
          role="switch"
          name={campoNegocia(id)}
          checked={!semPreco && negocia}
          disabled={semPreco}
          onChange={(e) => setNegocia(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-10 shrink-0 rounded-full bg-areia transition-colors peer-checked:bg-vinho after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-papel after:shadow after:transition-transform peer-checked:after:translate-x-4"
        />
      </label>
    </li>
  );
}

export function FormularioPrecos({ linhas }: Props) {
  const inicial: EstadoPrecos = {};
  const [estado, acao, enviando] = useActionState(salvarPrecos, inicial);
  // A cada resposta da action as linhas remontam (key): depois de salvar, com
  // os valores que a página recarregou, já normalizados ("150.5" -> "150,50");
  // depois de um erro, com o que foi digitado (estado.valores).
  const versao = estado.versao ?? 0;

  return (
    <form action={acao} className="flex flex-col gap-4 md:max-w-xl">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {estado.salvo && (
        <Aviso key={estado.versao} tipo="sucesso">
          Preços salvos. Eles já aparecem no seu perfil e na busca.
        </Aviso>
      )}

      <ul className="flex flex-col gap-3">
        {linhas.map((linha) => (
          <LinhaServico
            key={`${linha.categoria_id}-${versao}`}
            linha={linha}
            inicial={
              estado.valores?.[linha.categoria_id] ?? {
                preco: precoParaCampo(linha.preco_base),
                negocia: linha.aceita_negociar,
              }
            }
            erro={estado.erros?.[linha.categoria_id]}
          />
        ))}
      </ul>

      <p className="text-[13px] leading-[1.45] text-suave">
        O preço é uma referência: o valor final você combina com a cliente pelo chat.
      </p>

      <button
        type="submit"
        disabled={enviando}
        aria-busy={enviando || undefined}
        className={`${classeBotao} disabled:opacity-60`}
      >
        {enviando ? "Salvando…" : "Salvar preços"}
      </button>
    </form>
  );
}
