// Preço base e negociação por serviço: validação, mock (ciclo de vida igual
// ao do banco) e o que a implementação real pede ao Supabase.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it } from "vitest";

import {
  ID_CLIENTE_BEATRIZ,
  ID_PRESTADORA_ALINE,
  ID_PRESTADORA_CAMILA,
  ID_PRESTADORA_MARINA,
  definirUsuariaMock,
  redefinirMocks,
  servicoMock,
} from "../mocks";
import { criarServicoPrecosSupabase, servicoPrecos, validarAlteracao } from "../precos";
import { redefinirPrecosMock, servicoPrecosMock } from "../precos-mock";
import { argumentos, criarClienteFalso, metodos } from "./cliente-falso";

// Nos testes NEXT_PUBLIC_USE_MOCKS está desligado: servicoPrecos(cliente) usa a
// implementação do Supabase (com o cliente falso). O mock é testado direto.

const erroDe = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as { codigo?: string; message: string };
  }
  throw new Error("esperava erro");
};

beforeEach(() => {
  redefinirMocks();
  redefinirPrecosMock();
});

describe("validarAlteracao", () => {
  it("aceita preço com até 2 casas e 'a combinar'", () => {
    expect(validarAlteracao({ categoria_id: 1, preco_base: 150.5, aceita_negociar: true })).toEqual({
      categoria_id: 1,
      preco_base: 150.5,
      aceita_negociar: true,
    });
    expect(validarAlteracao({ categoria_id: 1, preco_base: 0.1 + 0.2, aceita_negociar: false }).preco_base).toBe(0.3);
  });

  it("sem preço não há o que negociar", () => {
    expect(validarAlteracao({ categoria_id: 1, preco_base: null, aceita_negociar: true }).aceita_negociar).toBe(false);
  });

  it.each([
    0,
    -1,
    100000,
    150.555,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    "150",
  ])("recusa preço %s", (preco_base) => {
    expect(() => validarAlteracao({ categoria_id: 1, preco_base, aceita_negociar: false })).toThrow();
  });

  it("recusa categoria e negociação inválidas", () => {
    expect(() => validarAlteracao({ categoria_id: 0, preco_base: 10, aceita_negociar: false })).toThrow();
    expect(() => validarAlteracao({ categoria_id: 1, preco_base: 10, aceita_negociar: "sim" })).toThrow();
    expect(() => validarAlteracao(null)).toThrow();
  });
});

describe("preços (mock)", () => {
  it("lista os preços iniciais, 'a combinar' quando não há", async () => {
    const aline = await servicoPrecosMock.listarPrecos({ prestadoraId: ID_PRESTADORA_ALINE });
    expect(aline).toEqual([
      { prestadora_id: ID_PRESTADORA_ALINE, categoria_id: 2, preco_base: 99.9, aceita_negociar: true },
      { prestadora_id: ID_PRESTADORA_ALINE, categoria_id: 3, preco_base: null, aceita_negociar: false },
    ]);
  });

  it("filtra por categoria", async () => {
    const encanamento = await servicoPrecosMock.listarPrecos({ categoriaId: 3 });
    expect(encanamento.map((p) => p.prestadora_id).sort()).toEqual(
      [ID_PRESTADORA_ALINE, ID_PRESTADORA_CAMILA].sort(),
    );
  });

  it("a prestadora logada edita o preço e a negociação de cada serviço", async () => {
    definirUsuariaMock(ID_PRESTADORA_ALINE);
    await servicoPrecosMock.salvarMeusPrecos([
      { categoria_id: 2, preco_base: 110, aceita_negociar: false },
      { categoria_id: 3, preco_base: 80, aceita_negociar: true },
    ]);
    const aline = await servicoPrecosMock.listarPrecos({ prestadoraId: ID_PRESTADORA_ALINE });
    expect(aline.map((p) => [p.preco_base, p.aceita_negociar])).toEqual([
      [110, false],
      [80, true],
    ]);
  });

  it("cliente e deslogada não salvam", async () => {
    definirUsuariaMock(ID_CLIENTE_BEATRIZ);
    expect((await erroDe(servicoPrecosMock.salvarMeusPrecos([{ categoria_id: 1, preco_base: 1, aceita_negociar: false }]))).codigo).toBe("permissao");
    definirUsuariaMock(null);
    expect((await erroDe(servicoPrecosMock.salvarMeusPrecos([{ categoria_id: 1, preco_base: 1, aceita_negociar: false }]))).codigo).toBe("nao_autenticada");
  });

  it("serviço que não é dela é recusado e nada é gravado", async () => {
    definirUsuariaMock(ID_PRESTADORA_MARINA);
    const erro = await erroDe(
      servicoPrecosMock.salvarMeusPrecos([
        { categoria_id: 1, preco_base: 999, aceita_negociar: false },
        { categoria_id: 3, preco_base: 1, aceita_negociar: false }, // Encanamento não é da Marina
      ]),
    );
    expect(erro.codigo).toBe("nao_encontrado");
    const [ar] = await servicoPrecosMock.listarPrecos({ prestadoraId: ID_PRESTADORA_MARINA });
    expect(ar.preco_base).toBe(150);
  });

  it("tirar o serviço e marcar de novo volta 'a combinar', como no banco", async () => {
    definirUsuariaMock(ID_PRESTADORA_MARINA);
    await servicoMock.removerMeuServico(1);
    expect(await servicoPrecosMock.listarPrecos({ prestadoraId: ID_PRESTADORA_MARINA })).toEqual([]);
    await new Promise((r) => setTimeout(r, 2)); // criado_em diferente
    await servicoMock.adicionarMeuServico(1);
    const [ar] = await servicoPrecosMock.listarPrecos({ prestadoraId: ID_PRESTADORA_MARINA });
    expect(ar).toMatchObject({ categoria_id: 1, preco_base: null, aceita_negociar: false });
  });
});

describe("validação na frente das duas implementações", () => {
  it("id inválido não consulta nada e lista vazia não grava", async () => {
    const falso = criarClienteFalso({ usuaria: ID_PRESTADORA_MARINA });
    const precos = servicoPrecos(falso.cliente);
    expect(await precos.listarPrecos({ prestadoraId: "nao-e-uuid" })).toEqual([]);
    expect(await precos.salvarMeusPrecos([])).toEqual([]);
    expect(falso.consultas).toHaveLength(0);
  });

  it("recusa serviço repetido no mesmo envio", async () => {
    const precos = servicoPrecos(criarClienteFalso().cliente);
    const erro = await erroDe(
      precos.salvarMeusPrecos([
        { categoria_id: 1, preco_base: 10, aceita_negociar: false },
        { categoria_id: 1, preco_base: 20, aceita_negociar: false },
      ]),
    );
    expect(erro.codigo).toBe("validacao");
  });
});

describe("preços (Supabase, cliente falso)", () => {
  it("lista só as colunas do preço, filtrando por prestadora", async () => {
    const falso = criarClienteFalso({
      responder: () => ({
        data: [{ prestadora_id: ID_PRESTADORA_MARINA, categoria_id: 1, preco_base: "150.00", aceita_negociar: true }],
        error: null,
      }),
    });
    const lista = await criarServicoPrecosSupabase(falso.cliente).listarPrecos({ prestadoraId: ID_PRESTADORA_MARINA });
    expect(lista).toEqual([
      { prestadora_id: ID_PRESTADORA_MARINA, categoria_id: 1, preco_base: 150, aceita_negociar: true },
    ]);
    const [consulta] = falso.consultas;
    expect(consulta.tabela).toBe("servicos_prestadora");
    expect(argumentos(consulta, "select")).toEqual([["prestadora_id, categoria_id, preco_base, aceita_negociar"]]);
    expect(argumentos(consulta, "eq")).toEqual([["prestadora_id", ID_PRESTADORA_MARINA]]);
  });

  it("salvar: update só de preço e negociação, filtrando pelo id da SESSÃO", async () => {
    const falso = criarClienteFalso({
      usuaria: ID_PRESTADORA_MARINA,
      responder: (c) =>
        c.tabela === "perfis"
          ? { data: { id: ID_PRESTADORA_MARINA, papel: "prestadora" }, error: null }
          : { data: { prestadora_id: ID_PRESTADORA_MARINA, categoria_id: 1, preco_base: 99.9, aceita_negociar: false }, error: null },
    });
    await servicoPrecos(falso.cliente).salvarMeusPrecos([{ categoria_id: 1, preco_base: 99.9, aceita_negociar: true }]);
    const update = falso.consultas.find((c) => metodos(c).includes("update"))!;
    expect(argumentos(update, "update")).toEqual([[{ preco_base: 99.9, aceita_negociar: true }]]);
    expect(argumentos(update, "eq")).toEqual([
      ["prestadora_id", ID_PRESTADORA_MARINA],
      ["categoria_id", 1],
    ]);
    expect(metodos(update)).toContain("maybeSingle");
  });

  it("0 linhas atingidas (RLS) vira 'nao_encontrado'", async () => {
    const falso = criarClienteFalso({
      usuaria: ID_PRESTADORA_MARINA,
      responder: (c) =>
        c.tabela === "perfis"
          ? { data: { id: ID_PRESTADORA_MARINA, papel: "prestadora" }, error: null }
          : { data: null, error: null },
    });
    const erro = await erroDe(servicoPrecos(falso.cliente).salvarMeusPrecos([{ categoria_id: 9, preco_base: 1, aceita_negociar: false }]));
    expect(erro.codigo).toBe("nao_encontrado");
  });

  it("sem sessão não chega a fazer update", async () => {
    const falso = criarClienteFalso({ usuaria: null });
    const erro = await erroDe(servicoPrecos(falso.cliente).salvarMeusPrecos([{ categoria_id: 1, preco_base: 1, aceita_negociar: false }]));
    expect(erro.codigo).toBe("nao_autenticada");
    expect(falso.consultas.some((c) => metodos(c).includes("update"))).toBe(false);
  });

  it("erro do banco vira mensagem segura", async () => {
    const falso = criarClienteFalso({
      usuaria: ID_PRESTADORA_MARINA,
      responder: (c) =>
        c.tabela === "perfis"
          ? { data: { id: ID_PRESTADORA_MARINA, papel: "prestadora" }, error: null }
          : { data: null, error: { code: "23514", message: 'violates check constraint "servicos_prestadora_preco_base_faixa"' } },
    });
    const erro = await erroDe(servicoPrecos(falso.cliente).salvarMeusPrecos([{ categoria_id: 1, preco_base: 1, aceita_negociar: false }]));
    expect(erro.codigo).toBe("validacao");
    expect(erro.message).not.toMatch(/constraint|servicos_prestadora/);
  });
});

describe("segurança de precos.ts", () => {
  const codigo = readFileSync(fileURLToPath(new URL("../precos.ts", import.meta.url)), "utf8");

  it("a única escrita é o update de salvarMeusPrecos, depois de exigirPrestadora()", () => {
    expect([...codigo.matchAll(/\.(update|insert|delete|upsert)\(/g)]).toHaveLength(1);
    const corpo = codigo.slice(codigo.lastIndexOf("async salvarMeusPrecos("));
    expect(corpo.indexOf("const id = await exigirPrestadora();")).toBeGreaterThan(-1);
    expect(corpo.indexOf("const id = await exigirPrestadora();")).toBeLessThan(corpo.indexOf(".update("));
    expect(corpo).toMatch(/\.eq\("prestadora_id", id\)/);
  });

  it("o update só manda as duas colunas liberadas pelo GRANT da 05", () => {
    expect(codigo).toMatch(/\.update\(\{ preco_base, aceita_negociar \}\)/);
  });
});
