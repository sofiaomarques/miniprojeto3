"use client";
import { useActionState } from "react";
import { escolherPapel } from "@/app/(auth)/acoes";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { ESTADO_INICIAL } from "@/lib/identidade/auth";
import type { Papel } from "@/lib/identidade/types";

const OPCOES: { papel: Papel; titulo: string; descricao: string }[] = [
  {
    papel: "cliente",
    titulo: "Sou cliente",
    descricao: "Quero encontrar prestadoras e pedir orçamentos.",
  },
  {
    papel: "prestadora",
    titulo: "Sou prestadora",
    descricao: "Quero divulgar meus serviços e receber pedidos.",
  },
];

export function FormularioOnboarding({ nomeInicial }: { nomeInicial: string }) {
  const [estado, acao, enviando] = useActionState(escolherPapel, ESTADO_INICIAL);
  const papelMarcado = estado.valores?.papel;
  const erroPapel = estado.campos?.papel;

  return (
    <form action={acao} noValidate className="space-y-5">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}

      <fieldset
        className="space-y-2"
        aria-describedby={erroPapel ? "papel-erro" : "papel-dica"}
      >
        <legend className="mb-2 text-sm font-medium text-zinc-800">Como você vai usar o app?</legend>
        {OPCOES.map((opcao) => (
          <label
            key={opcao.papel}
            className={[
              "flex cursor-pointer items-start gap-3 rounded-md border bg-white p-3",
              "has-[:checked]:border-zinc-900 has-[:checked]:ring-1 has-[:checked]:ring-zinc-900",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-zinc-900",
              erroPapel ? "border-red-500" : "border-zinc-300",
            ].join(" ")}
          >
            <input
              type="radio"
              name="papel"
              value={opcao.papel}
              defaultChecked={papelMarcado === opcao.papel}
              required
              className="mt-1 accent-zinc-900"
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">{opcao.titulo}</span>
              <span className="block text-sm text-zinc-600">{opcao.descricao}</span>
            </span>
          </label>
        ))}
        {erroPapel ? (
          <p id="papel-erro" className="text-xs text-red-600">
            {erroPapel}
          </p>
        ) : (
          <p id="papel-dica" className="text-xs text-zinc-500">
            Essa escolha não pode ser trocada depois.
          </p>
        )}
      </fieldset>

      <CampoTexto
        rotulo="Nome que aparece no seu perfil"
        name="nome"
        autoComplete="name"
        maxLength={80}
        required
        defaultValue={estado.valores?.nome ?? nomeInicial}
        erro={estado.campos?.nome}
      />

      <Botao type="submit" larguraTotal carregando={enviando} textoCarregando="Salvando…">
        Continuar
      </Botao>
    </form>
  );
}
