import type { Perfil } from "@/lib/identidade/types";
import type { PrestadoraDetalhe } from "@/lib/descoberta/types";

import { Avatar } from "./Avatar";
import { BotaoConversar } from "./BotaoConversar";
import { Categorias } from "./Categorias";
import { Estrelas } from "./Estrelas";

type Props = {
  prestadora: PrestadoraDetalhe;
  usuaria: Perfil | null | undefined;
};

export function CabecalhoPrestadora({ prestadora, usuaria }: Props) {
  const { perfil, categorias, notaMedia, totalAvaliacoes } = prestadora;

  return (
    <header className="flex flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-4 sm:flex-row sm:items-start">
      <div className="flex items-center gap-4 sm:block">
        <Avatar nome={perfil.nome} url={perfil.avatar_url} tamanho="g" />
        <div className="min-w-0 sm:hidden">
          <h1 className="break-words text-xl font-bold">{perfil.nome}</h1>
          <p className="text-sm text-zinc-500">{perfil.cidade ?? "Cidade não informada"}</p>
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div className="hidden sm:block">
          <h1 className="break-words text-2xl font-bold">{perfil.nome}</h1>
          <p className="text-sm text-zinc-500">{perfil.cidade ?? "Cidade não informada"}</p>
        </div>
        <Estrelas nota={notaMedia} total={totalAvaliacoes} />
        <Categorias categorias={categorias} />
        {perfil.bio && <p className="whitespace-pre-line break-words text-sm text-zinc-700">{perfil.bio}</p>}

        <div className="pt-1">
          <BotaoConversar prestadoraId={perfil.id} usuaria={usuaria} />
        </div>
      </div>
    </header>
  );
}
