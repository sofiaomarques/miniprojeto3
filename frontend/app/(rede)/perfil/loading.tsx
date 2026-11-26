// Enquanto o /perfil (e /perfil/editar, /perfil/fotos) busca a conta no
// servidor (#20): esqueleto no visual do protótipo, em vez de tela parada.
import { Carregando } from "@/components/descoberta/Estados";
import { BarraAbas, Tela } from "@/components/rede/Tela";

export default function CarregandoPerfil() {
  return (
    <Tela className="h-dvh md:h-auto">
      <div className="flex flex-col items-center gap-3 rounded-b-[28px] bg-rosa px-5 pb-5 pt-8">
        <div aria-hidden="true" className="h-[84px] w-[84px] animate-pulse rounded-full bg-papel" />
        <div aria-hidden="true" className="h-6 w-40 animate-pulse rounded bg-papel" />
        <div aria-hidden="true" className="h-4 w-28 animate-pulse rounded bg-papel" />
      </div>
      <div className="flex-1 px-5 pt-5">
        <Carregando texto="Carregando seu perfil…" linhas={2} />
      </div>
      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
