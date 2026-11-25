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
    <div className="flex flex-col gap-1">
      <label htmlFor={idCampo} className="block text-[13.5px] font-medium text-texto">
        {rotulo}
      </label>
      <input
        id={idCampo}
        aria-invalid={erro ? true : undefined}
        aria-describedby={descricao}
        className={[
          "block h-[46px] w-full rounded-[14px] border bg-papel px-3.5 text-[15px] text-texto",
          "placeholder:text-suave focus:outline-2 focus:outline-offset-0",
          erro
            ? "border-red-600 focus:outline-red-600"
            : "border-campo focus:outline-vinho",
          className,
        ].join(" ")}
        {...resto}
      />
      {dica && (
        <p id={idDica} className="text-xs text-suave">
          {dica}
        </p>
      )}
      {erro && (
        <p id={idErro} className="text-xs font-medium text-red-700">
          {erro}
        </p>
      )}
    </div>
  );
}
