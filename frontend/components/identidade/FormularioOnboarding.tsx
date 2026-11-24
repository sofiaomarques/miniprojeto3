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
        <legend className="mb-2 text-[13px] font-bold uppercase tracking-[0.04em] text-suave">
          Como você vai usar o app?
        </legend>
        {OPCOES.map((opcao) => (
          <label
            key={opcao.papel}
            className={[
              "flex cursor-pointer items-center gap-3 rounded-[18px] border-2 bg-papel p-3.5",
              "has-[:checked]:border-vinho has-[:checked]:bg-rosa",
              "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-vinho",
              erroPapel ? "border-red-600" : "border-borda",
            ].join(" ")}
          >
            <input
              type="radio"
              name="papel"
              value={opcao.papel}
              defaultChecked={papelMarcado === opcao.papel}
              required
              className="m-0 h-5 w-5 shrink-0 accent-vinho"
            />
            <span>
              <span className="block text-base font-bold">{opcao.titulo}</span>
              <span className="block text-[13.5px] leading-snug text-corpo">{opcao.descricao}</span>
            </span>
          </label>
        ))}
        {erroPapel ? (
          <p id="papel-erro" className="text-xs font-medium text-red-700">
            {erroPapel}
          </p>
        ) : (
          <p id="papel-dica" className="text-xs text-suave">
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
