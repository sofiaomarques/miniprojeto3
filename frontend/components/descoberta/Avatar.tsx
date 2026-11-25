// Avatar no estilo do protótipo: foto de perfil quando existe; sem foto, as
// iniciais do nome sobre um fundo da paleta.
import { iniciaisDe } from "@/lib/descoberta/texto";

type Props = {
  nome: string | null;
  url: string | null;
  tamanho: number;
  fundo?: "rosa" | "areia" | "papel";
};

const FUNDOS = { rosa: "bg-rosa", areia: "bg-areia", papel: "bg-papel" } as const;

export function Avatar({ nome, url, tamanho, fundo = "rosa" }: Props) {
  const estilo = { width: tamanho, height: tamanho, fontSize: tamanho * 0.36 };
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={estilo} className="shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      aria-hidden="true"
      style={estilo}
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-semibold text-vinho-escuro ${FUNDOS[fundo]}`}
    >
      {iniciaisDe(nome)}
    </span>
  );
}

// Alterna rosa e areia na lista, como no protótipo.
export const tomDaPosicao = (i: number) => (i % 2 === 0 ? "rosa" : "areia");
