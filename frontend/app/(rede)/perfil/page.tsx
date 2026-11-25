import { BotaoSair } from "@/components/identidade/BotaoSair";
import { Avatar } from "@/components/descoberta/Avatar";
import { ListaIndicacoes } from "@/components/descoberta/ListaIndicacoes";
import { BarraAbas, Tela } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import { exigirConta } from "@/lib/rede/sessao";

const PAPEIS = { cliente: "Cliente", prestadora: "Prestadora" } as const;

// Cabeçalho com o perfil de verdade (lib/identidade); para cliente, a lista
// de indicações vem da descoberta.
export default async function PerfilPage() {
  const perfil = await exigirConta("/perfil");

  if (!perfil) {
    return (
      <Tela className="h-dvh">
        <div className="flex-1 px-5 pt-8">
          <Aviso tipo="erro">
            Não foi possível carregar sua conta agora. Recarregue a página em alguns instantes.
          </Aviso>
        </div>
        <BarraAbas ativa="perfil" />
      </Tela>
    );
  }

  const ehCliente = perfil.papel === "cliente";
  const subtitulo = [perfil.papel ? PAPEIS[perfil.papel] : null, perfil.cidade]
    .filter(Boolean)
    .join(" · ");

  return (
    <Tela className="h-dvh">
      <div className="flex flex-col items-center gap-2 rounded-b-[28px] bg-rosa px-5 pb-5 pt-8 text-center">
        <Avatar nome={perfil.nome} url={perfil.avatar_url} tamanho={84} fundo="papel" />
        <h1 className="font-display text-[26px] font-semibold leading-[1.15]">
          {perfil.nome ?? "Minha conta"}
        </h1>
        <span className="text-sm text-corpo">{subtitulo}</span>
        {perfil.bio && (
          <p className="mt-1 max-w-[300px] text-[14.5px] leading-[1.45] text-corpo">
            {perfil.bio}
          </p>
        )}
        <Link
          href="/perfil/editar"
          className="mt-1 flex min-h-11 items-center rounded-full border border-vinho px-5 text-sm font-bold text-vinho focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
        >
          Editar perfil
        </Link>
        {perfil.papel === "prestadora" && (
          <Link
            href="/perfil/fotos"
            className="flex min-h-11 items-center rounded-full border border-vinho px-5 text-sm font-bold text-vinho focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-vinho"
          >
            Minhas fotos
          </Link>
        )}
        <BotaoSair />
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pt-5">
        {!ehCliente && (
          <p className="text-[14.5px] leading-[1.45] text-corpo">
            Seu perfil de prestadora, com serviços e fotos de trabalhos, aparece aqui em breve.
          </p>
        )}
        {ehCliente && <ListaIndicacoes clienteId={perfil.id} editavel />}
      </div>

      <BarraAbas ativa="perfil" />
    </Tela>
  );
}
