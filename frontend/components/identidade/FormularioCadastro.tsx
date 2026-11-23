"use client";
import Link from "next/link";
import { useActionState } from "react";
import { cadastrar } from "@/app/(auth)/acoes";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { CampoTexto } from "@/components/ui/CampoTexto";
import {
  ESTADO_INICIAL,
  SENHA_MINIMA,
  validarConfirmacaoSenha,
  validarEmail,
  validarNome,
  validarSenhaNova,
} from "@/lib/identidade/auth";
import { useValidacaoAoVivo, type Validadores } from "./useValidacaoAoVivo";

const VALIDADORES: Validadores = {
  nome: validarNome,
  email: validarEmail,
  senha: validarSenhaNova,
  confirmacao: (confirmacao, form) => {
    const senha = (form.elements.namedItem("senha") as HTMLInputElement | null)?.value ?? "";
    return validarConfirmacaoSenha(senha, confirmacao);
  },
};

export function FormularioCadastro() {
  const [estado, acao, enviando] = useActionState(cadastrar, ESTADO_INICIAL);
  const { erro, ligar, aoEnviar } = useValidacaoAoVivo(VALIDADORES, estado);

  if (estado.sucesso) {
    return (
      <div className="space-y-4">
        <Aviso tipo="sucesso">{estado.sucesso}</Aviso>
        <p className="text-[14.5px] text-suave">
          Já confirmou?{" "}
          <Link href="/entrar" className="font-bold text-vinho">
            Entrar
          </Link>
        </p>
      </div>
    );
  }

  return (
    // noValidate: as mensagens vêm da validação ao vivo e do servidor, em português.
    <form action={acao} onSubmit={aoEnviar} noValidate className="space-y-4">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      <CampoTexto
        rotulo="Nome"
        name="nome"
        autoComplete="name"
        maxLength={80}
        required
        defaultValue={estado.valores?.nome}
        erro={erro("nome")}
        {...ligar}
      />
      <CampoTexto
        rotulo="E-mail"
        name="email"
        type="email"
        autoComplete="email"
        required
        defaultValue={estado.valores?.email}
        erro={erro("email")}
        {...ligar}
      />
      <CampoTexto
        rotulo="Senha"
        name="senha"
        type="password"
        autoComplete="new-password"
        minLength={SENHA_MINIMA}
        required
        dica={`Pelo menos ${SENHA_MINIMA} caracteres.`}
        erro={erro("senha")}
        {...ligar}
      />
      <CampoTexto
        rotulo="Confirmar senha"
        name="confirmacao"
        type="password"
        autoComplete="new-password"
        required
        erro={erro("confirmacao")}
        {...ligar}
      />
      <Botao type="submit" larguraTotal carregando={enviando} textoCarregando="Criando conta…">
        Criar conta
      </Botao>
    </form>
  );
}
