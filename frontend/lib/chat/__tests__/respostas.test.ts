import { describe, expect, it } from "vitest";

import { respostasRapidas } from "../respostas";

describe("respostasRapidas", () => {
  it("cliente pede orçamento com serviço, bairro e data", () => {
    const [pedir] = respostasRapidas("cliente", "Marina Souza");
    expect(pedir.rotulo).toBe("Pedir orçamento");
    expect(pedir.texto).toMatch(/^Olá, Marina!/);
    for (const campo of ["Serviço:", "Bairro:", "Data desejada:"]) {
      expect(pedir.texto).toContain(campo);
    }
  });

  it("prestadora envia orçamento com valor e data", () => {
    const [enviar] = respostasRapidas("prestadora", "Beatriz Alves");
    expect(enviar.rotulo).toBe("Enviar orçamento");
    expect(enviar.texto).toMatch(/^Olá, Beatriz!/);
    expect(enviar.texto).toContain("Valor: R$");
    expect(enviar.texto).toContain("Data disponível:");
  });

  it("sem nome da outra pessoa, cumprimenta sem nome", () => {
    expect(respostasRapidas("cliente", "")[0].texto).toMatch(/^Olá! /);
  });

  it("conta sem papel não tem respostas rápidas", () => {
    expect(respostasRapidas(null, "Marina")).toEqual([]);
  });
});
