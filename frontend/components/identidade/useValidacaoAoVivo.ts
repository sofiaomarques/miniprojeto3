"use client";
// Validação enquanto a pessoa preenche, como a maioria dos sites:
//   * ao sair de um campo preenchido (blur), mostra o erro dele;
//   * depois que um erro apareceu, ele é reavaliado a cada tecla e some
//     assim que o campo fica certo;
//   * ao enviar, confere tudo; com erro, não envia e põe o foco no primeiro.
// O servidor confere de novo (a validação daqui é só para ajudar).
import { useState, type FocusEvent, type FormEvent, type ChangeEvent } from "react";
import type { CampoFormulario, EstadoFormulario } from "@/lib/identidade/auth";

// Recebe o formulário inteiro (para comparar senha e confirmação, por exemplo).
export type Validadores = Partial<
  Record<CampoFormulario, (valor: string, form: HTMLFormElement) => string | undefined>
>;

function valorDe(form: HTMLFormElement, campo: string): string {
  const elemento = form.elements.namedItem(campo);
  return elemento instanceof HTMLInputElement ? elemento.value : "";
}

export function useValidacaoAoVivo(validadores: Validadores, estado: EstadoFormulario) {
  // null = o navegador conferiu e está ok; ausente = vale o erro do servidor.
  const [locais, setLocais] = useState<Partial<Record<CampoFormulario, string | null>>>({});
  const [estadoVisto, setEstadoVisto] = useState(estado);
  if (estado !== estadoVisto) {
    // Resposta nova do servidor: os erros dela passam a valer.
    setEstadoVisto(estado);
    setLocais({});
  }

  const erro = (campo: CampoFormulario): string | undefined =>
    campo in locais ? (locais[campo] ?? undefined) : estado.campos?.[campo];

  function conferir(campo: CampoFormulario, form: HTMLFormElement) {
    const validar = validadores[campo];
    if (!validar) return undefined;
    const mensagem = validar(valorDe(form, campo), form);
    setLocais((atual) => ({ ...atual, [campo]: mensagem ?? null }));
    return mensagem;
  }

  function aoSair(evento: FocusEvent<HTMLInputElement>) {
    const campo = evento.currentTarget.name as CampoFormulario;
    if (evento.currentTarget.value === "" && !erro(campo)) return; // não acusa campo vazio só por passar
    if (evento.currentTarget.form) conferir(campo, evento.currentTarget.form);
  }

  function aoDigitar(evento: ChangeEvent<HTMLInputElement>) {
    const campo = evento.currentTarget.name as CampoFormulario;
    const form = evento.currentTarget.form;
    if (!form) return;
    if (erro(campo)) conferir(campo, form);
    // Mudou a senha com a confirmação já marcada: confere as duas.
    if (campo === "senha" && erro("confirmacao") && valorDe(form, "confirmacao") !== "") {
      conferir("confirmacao", form);
    }
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    const form = evento.currentTarget;
    let primeiro: string | null = null;
    for (const campo of Object.keys(validadores) as CampoFormulario[]) {
      if (conferir(campo, form) && !primeiro) primeiro = campo;
    }
    if (primeiro) {
      evento.preventDefault(); // não chama a Server Action
      (form.elements.namedItem(primeiro) as HTMLInputElement | null)?.focus();
    }
  }

  // Liga num <input>: onBlur e onChange.
  const ligar = { onBlur: aoSair, onChange: aoDigitar };
  return { erro, ligar, aoEnviar };
}
