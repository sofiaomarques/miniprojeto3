// Fotos dos trabalhos da prestadora (#17). Página nova ao lado do /perfil do
// #53, no mesmo visual; o /perfil só ganha um link para cá. A página só
// compõe: regras em lib/identidade, galeria em components/identidade.
import Link from "next/link";

import { GaleriaEditavel } from "@/components/identidade/GaleriaEditavel";
import { IconeVoltar } from "@/components/rede/icones";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { exigirConta } from "@/lib/rede/sessao";

export const metadata = { title: "Minhas fotos" };

export default async function FotosPerfilPage() {
  const perfil = await exigirConta("/perfil/fotos");

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
        <h1 className="font-display text-[28px] font-semibold leading-[1.15]">Fotos dos trabalhos</h1>

        {!perfil ? (
          <Aviso tipo="erro">
            Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.
          </Aviso>
        ) : perfil.papel !== "prestadora" ? (
          <Aviso tipo="info">A galeria de trabalhos é das prestadoras.</Aviso>
        ) : (
          <GaleriaEditavel prestadoraId={perfil.id} />
        )}
      </div>
      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
