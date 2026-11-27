import { describe, expect, it } from "vitest";

import { formatarPreco, lerPreco, precoParaCampo } from "../dinheiro";

const valor = (texto: string) => {
  const r = lerPreco(texto);
  if (!r.ok) throw new Error(`esperava ok para "${texto}": ${r.erro}`);
  return r.valor;
};

describe("lerPreco", () => {
  it("campo vazio é 'a combinar' (null)", () => {
    expect(valor("")).toBeNull();
    expect(valor("   ")).toBeNull();
    expect(valor("R$ ")).toBeNull();
  });

  it("aceita o formato brasileiro", () => {
    expect(valor("150")).toBe(150);
    expect(valor("150,5")).toBe(150.5);
    expect(valor("150,50")).toBe(150.5);
    expect(valor("1.234,56")).toBe(1234.56);
    expect(valor("1.234")).toBe(1234);
    expect(valor("R$ 80")).toBe(80);
    expect(valor("r$80,00")).toBe(80);
  });

  // Ponto seguido de exatamente 3 dígitos é milhar; com 1 ou 2, é decimal
  // (teclado numérico do celular costuma ter só o ponto).
  it("decide o ponto: milhar com 3 dígitos, decimal com 1 ou 2", () => {
    expect(valor("1.500")).toBe(1500);
    expect(valor("150.5")).toBe(150.5);
    expect(valor("80.00")).toBe(80);
  });

  it("recusa texto, sinais e mais de 2 casas", () => {
    const invalidos = ["abc", "R$ abc", "-10", "-5", "10,555", "1,2,3", "10.", "1.23.4", "1e3", "+5", "Infinity", "NaN"];
    for (const texto of invalidos) {
      expect(lerPreco(texto).ok, texto).toBe(false);
    }
  });

  it("recusa zero e acima do máximo do banco", () => {
    expect(lerPreco("0").ok).toBe(false);
    expect(lerPreco("0,00").ok).toBe(false);
    expect(lerPreco("100.000").ok).toBe(false);
    expect(lerPreco("12.345.678").ok).toBe(false);
    expect(valor("99.999,99")).toBe(99999.99);
    expect(valor("0,01")).toBe(0.01);
  });
});

describe("formatarPreco", () => {
  it("sem centavos quando é inteiro", () => {
    expect(formatarPreco(150)).toBe("R$ 150");
    expect(formatarPreco(1234)).toBe("R$ 1.234");
  });

  it("com centavos quando tem", () => {
    expect(formatarPreco(150.5)).toBe("R$ 150,50");
    expect(formatarPreco(0.01)).toBe("R$ 0,01");
  });
});

describe("precoParaCampo", () => {
  it("volta o valor no formato do campo", () => {
    expect(precoParaCampo(null)).toBe("");
    expect(precoParaCampo(150)).toBe("150");
    expect(precoParaCampo(150.5)).toBe("150,50");
    expect(lerPreco(precoParaCampo(1234.56))).toEqual({ ok: true, valor: 1234.56 });
  });
});
