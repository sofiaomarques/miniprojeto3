// Campo de formulário com rótulo, dica e mensagem de erro ligados ao input
// (aria-describedby), para leitores de tela anunciarem o erro do campo.
import { useId, type ComponentProps } from "react";

type Props = ComponentProps<"input"> & {
  rotulo: string;
  name: string;
  erro?: string;
  dica?: string;
};

export function CampoTexto({ rotulo, erro, dica, id, className = "", ...resto }: Props) {
  const idGerado = useId();
  const idCampo = id ?? idGerado;
  const idDica = dica ? `${idCampo}-dica` : undefined;
  const idErro = erro ? `${idCampo}-erro` : undefined;
  const descricao = [idDica, idErro].filter(Boolean).join(" ") || undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={idCampo} className="block text-sm font-medium text-zinc-800">
        {rotulo}
      </label>
      <input
        id={idCampo}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao}
        className={[
          "block w-full rounded-md border bg-white px-3 py-2 text-sm text-zinc-900",
          "placeholder:text-zinc-400 focus:outline-2 focus:outline-offset-0",
          erro
            ? "border-red-500 focus:outline-red-500"
            : "border-zinc-300 focus:outline-zinc-900",
          className,
        ].join(" ")}
        {...resto}
      />
      {dica && (
        <p id={idDica} className="text-xs text-zinc-500">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-xs text-red-600">
          {erro}
        </p>
      )}
    </div>
  );
}
