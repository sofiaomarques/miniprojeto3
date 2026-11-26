// Edição do próprio perfil (#16). Página nova ao lado do /perfil do #53, que
// continua igual: ela só ganha o link "Editar perfil". A página só compõe;
// as regras ficam em lib/identidade (service.ts, perfil.ts e sessao.ts).
import Link from "next/link";

import { FormularioPerfil } from "@/components/identidade/FormularioPerfil";
import { IconeVoltar } from "@/components/rede/icones";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { carregarEdicaoPerfilNoServidor } from "@/lib/identidade/sessao";
import { exigirConta } from "@/lib/rede/sessao";

export const metadata = { title: "Editar perfil" };

export default async function EditarPerfilPage() {
  const perfil = await exigirConta("/perfil/editar");
  const edicao = perfil ? await carregarEdicaoPerfilNoServidor(perfil) : null;

  return (
    <Tela className="h-dvh">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-8 pt-5">
        <Link
          href="/perfil"
          aria-label="Voltar ao perfil"
          className="-ml-2.5 flex h-11 w-11 items-center justify-center"
        >
          <IconeVoltar size={24} />
        </Link>
        <h1 className="font-display text-[28px] font-semibold leading-[1.15]">Editar perfil</h1>

        {perfil && edicao ? (
          <FormularioPerfil
            perfil={perfil}
            categorias={edicao.categorias}
            marcadas={edicao.marcadas}
          />
        ) : (
          <Aviso tipo="erro">
            Não foi possível carregar seu perfil agora. Recarregue a página em alguns instantes.
          </Aviso>
        )}
      </div>
      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
