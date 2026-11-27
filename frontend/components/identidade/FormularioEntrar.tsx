"use client";
import { useActionState } from "react";
import { entrar } from "@/app/(auth)/acoes";
import { Aviso } from "@/components/ui/Aviso";
import { Botao } from "@/components/ui/Botao";
import { CampoTexto } from "@/components/ui/CampoTexto";
import { CampoSenha } from "./CampoSenha";
import { ESTADO_INICIAL, validarEmail } from "@/lib/identidade/auth";
import { useValidacaoAoVivo, type Validadores } from "./useValidacaoAoVivo";

// No login a senha só precisa estar preenchida: o mínimo de tamanho é regra
// do cadastro (e quem errar a senha recebe "E-mail ou senha incorretos").
const VALIDADORES: Validadores = {
  email: validarEmail,
  senha: (senha) => (senha === "" ? "Informe sua senha." : undefined),
};

export function FormularioEntrar({ next = null }: { next?: string | null }) {
  const [estado, acao, enviando] = useActionState(entrar, ESTADO_INICIAL);
  const { erro, ligar, aoEnviar } = useValidacaoAoVivo(VALIDADORES, estado);

  return (
    // noValidate: as mensagens vêm da validação ao vivo e do servidor, em português.
    <form action={acao} onSubmit={aoEnviar} noValidate className="space-y-4">
      {estado.erro && <Aviso tipo="erro">{estado.erro}</Aviso>}
      {next && <input type="hidden" name="next" value={next} />}
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
      <CampoSenha
        rotulo="Senha"
        name="senha"
        autoComplete="current-password"
        required
        erro={erro("senha")}
        {...ligar}
      />
      <Botao type="submit" larguraTotal carregando={enviando} textoCarregando="Entrando…">
        Entrar
      </Botao>
    </form>
  );
}
