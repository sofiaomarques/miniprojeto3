"use client";
// Formulário de edição do próprio perfil (#16): nome, cidade, bio e, para a
// prestadora, os serviços que ela faz (categorias). Usa o visual das telas da
// Rede de Mulheres (classeCampo e classeBotao de components/rede/Tela).
import Link from "next/link";
import { useActionState, useState } from "react";
import { salvarPerfil, type EstadoEdicaoPerfil } from "@/app/(rede)/perfil/editar/acoes";
import { classeBotao, classeCampo } from "@/components/rede/Tela";
import { Aviso } from "@/components/ui/Aviso";
import type { CategoriaServico, Perfil } from "@/lib/identidade/types";

const BIO_MAXIMO = 500; // mesmo CHECK de perfis.bio na 01

type Props = {
  perfil: Pick<Perfil, "nome" | "bio" | "cidade" | "papel">;
  categorias: CategoriaServico[]; // catálogo (vazio para cliente)
  marcadas: number[]; // categorias que a prestadora já faz
};

export function FormularioPerfil({ perfil, categorias, marcadas }: Props) {
  const inicial: EstadoEdicaoPerfil = {};
  const [estado, acao, enviando] = useActionState(salvarPerfil, inicial);
  const valores = estado.valores;
  const [bio, setBio] = useState(valores?.bio ?? perfil.bio ?? "");
  const escolhidas = new Set(valores?.categorias ?? marcadas);
  const ehPrestadora = perfil.papel === "prestadora";

  return (
    <>
    <form action={acao} className="flex flex-col gap-4">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
        Nome
        <input
          name="nome"
          required
          maxLength={80}
          autoComplete="name"
          defaultValue={valores?.nome ?? perfil.nome ?? ""}
          className={classeCampo}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
        Cidade
        <input
          name="cidade"
          maxLength={100}
          autoComplete="address-level2"
          placeholder="Ex.: João Pessoa"
          defaultValue={valores?.cidade ?? perfil.cidade ?? ""}
          className={classeCampo}
        />
      </label>

      <label className="flex flex-col gap-1.5 text-[13.5px] font-medium">
        Sobre você
        <textarea
          name="bio"
          maxLength={BIO_MAXIMO}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder={
            ehPrestadora
              ? "Conte o que você faz, como atende e há quanto tempo trabalha."
              : "Uma frase sobre você (opcional)."
          }
          className="h-[120px] resize-none rounded-2xl border border-campo bg-papel p-3.5 text-[15px] leading-[1.45] placeholder:text-suave"
        />
        {/* bio.length (UTF-16) é o que o maxLength do navegador conta. O banco
            conta caracteres (code points), que nunca passam disso, então o
            contador não promete mais do que o campo deixa digitar. */}
        <span className="self-end text-xs text-suave">
          {bio.length}/{BIO_MAXIMO}
        </span>
      </label>

      {ehPrestadora && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[13.5px] font-medium">Serviços que você faz</legend>
          <p className="text-[13px] text-suave">
            É por eles que as clientes encontram você na busca.
          </p>
          <div className="flex flex-wrap gap-2">
            {categorias.map((c) => (
              <label
                key={c.id}
                className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-campo bg-papel px-3.5 text-[14px] has-[:checked]:border-vinho has-[:checked]:bg-rosa has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-vinho"
              >
                <input
                  type="checkbox"
                  name="categorias"
                  value={c.id}
                  defaultChecked={escolhidas.has(c.id)}
                  className="accent-vinho"
                />
                {c.nome}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <button type="submit" disabled={enviando} aria-busy={enviando || undefined} className={`${classeBotao} disabled:opacity-60`}>
        {enviando ? "Salvando…" : "Salvar"}
      </button>
    </form>
    {/* Fora do form: o link sai da página, então avisa para salvar antes. */}
    {ehPrestadora && (
      <p className="text-[13.5px] leading-[1.45] text-corpo">
        Quanto você cobra em cada serviço? Defina em{" "}
        <Link href="/perfil/precos" className="font-bold text-vinho underline">
          Preços dos serviços
        </Link>
        . Marcou um serviço novo? Salve antes.
      </p>
    )}
    </>
  );
}
