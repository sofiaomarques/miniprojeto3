// Lista de pessoas (seguidores, seguindo ou resultado da busca). Cada item
// abre o perfil: prestadora na página dela, cliente na página de pessoa.
import Link from "next/link";

import { Avatar, tomDaPosicao } from "@/components/descoberta/Avatar";
import { linkDaPessoa } from "@/lib/seguidores/regras";
import type { PessoaResumo } from "@/lib/seguidores/types";

const PAPEIS = { cliente: "Cliente", prestadora: "Prestadora" } as const;

export function ListaPessoas({ pessoas }: { pessoas: PessoaResumo[] }) {
  return (
    <ul className="flex flex-col gap-2.5">
      {pessoas.map((p, i) => (
        <li key={p.id}>
          <Link
            href={linkDaPessoa(p)}
            className="flex items-center gap-3 rounded-[18px] border border-borda bg-papel p-3 focus-visible:outline-2 focus-visible:outline-vinho hover:bg-rosa-claro"
          >
            <Avatar nome={p.nome} url={p.avatarUrl} tamanho={44} fundo={tomDaPosicao(i)} />
            <div className="flex min-w-0 flex-col">
              <b className="truncate text-[15.5px]">{p.nome || "Sem nome"}</b>
              <span className="text-[13px] text-suave">{PAPEIS[p.papel]}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
