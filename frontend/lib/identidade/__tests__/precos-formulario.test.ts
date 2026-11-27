import { beforeEach, describe, expect, it } from "vitest";

import { ID_PRESTADORA_ALINE, redefinirMocks, servicoMock } from "../mocks";
import { carregarMeusPrecos, lerFormularioPrecos } from "../precos-formulario";
import { redefinirPrecosMock, servicoPrecosMock } from "../precos-mock";

function formulario(campos: [string, string][]): FormData {
  const form = new FormData();
  for (const [chave, valor] of campos) form.append(chave, valor);
  return form;
}

describe("lerFormularioPrecos", () => {
  it("lê preço e negociação de cada serviço", () => {
    const r = lerFormularioPrecos(
      formulario([
        ["servico", "2"],
        ["preco-2", "1.234,50"],
        ["negocia-2", "on"],
        ["servico", "3"],
        ["preco-3", "80"],
      ]),
    );
    expect(r.erros).toEqual({});
    expect(r.alteracoes).toEqual([
      { categoria_id: 2, preco_base: 1234.5, aceita_negociar: true },
      { categoria_id: 3, preco_base: 80, aceita_negociar: false },
    ]);
  });

  it("vazio é 'a combinar' e desliga a negociação", () => {
    const r = lerFormularioPrecos(formulario([["servico", "2"], ["preco-2", " "], ["negocia-2", "on"]]));
    expect(r.alteracoes).toEqual([{ categoria_id: 2, preco_base: null, aceita_negociar: false }]);
  });

  it("erro fica no serviço certo e o que foi digitado volta", () => {
    const r = lerFormularioPrecos(
      formulario([
        ["servico", "2"],
        ["preco-2", "abc"],
        ["negocia-2", "on"],
        ["servico", "3"],
        ["preco-3", "50"],
      ]),
    );
    expect(Object.keys(r.erros)).toEqual(["2"]);
    expect(r.valores[2]).toEqual({ preco: "abc", negocia: true });
    expect(r.alteracoes.map((a) => a.categoria_id)).toEqual([3]);
  });

  it("ignora ids inválidos e repetidos", () => {
    const r = lerFormularioPrecos(
      formulario([
        ["servico", "x"],
        ["servico", "-1"],
        ["servico", "2"],
        ["servico", "2"],
        ["preco-2", "10"],
      ]),
    );
    expect(r.alteracoes).toHaveLength(1);
  });
});

describe("carregarMeusPrecos (mock)", () => {
  beforeEach(() => {
    redefinirMocks();
    redefinirPrecosMock();
  });

  it("junta nome da categoria e preço, em ordem alfabética", async () => {
    const linhas = await carregarMeusPrecos(servicoMock, servicoPrecosMock, ID_PRESTADORA_ALINE);
    expect(linhas).toEqual([
      { categoria_id: 2, nome: "Elétrica", preco_base: 99.9, aceita_negociar: true },
      { categoria_id: 3, nome: "Encanamento", preco_base: null, aceita_negociar: false },
    ]);
  });
});
