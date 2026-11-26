// Preço base na descoberta: preço de referência, ordem do mais barato ao mais
// caro (funções puras) e a busca do mock usando os preços da identidade.
import { beforeEach, describe, expect, it } from "vitest";

import {
  ID_PRESTADORA_ALINE,
  ID_PRESTADORA_CAMILA,
  ID_PRESTADORA_JOANA,
  ID_PRESTADORA_MARINA,
  definirUsuariaMock,
  redefinirMocks,
} from "@/lib/identidade/mocks";
import { redefinirPrecosMock, servicoPrecosMock } from "@/lib/identidade/precos-mock";

import { ordenarPorPreco, paraPrecosCategoria, precoDeReferencia, precosPorPrestadora } from "../precos";
import * as mock from "../service-mock";
import type { PrecoCategoria, PrestadoraResumo } from "../types";

function prestadora(nome: string, precos: [number, number | null, boolean?][], notaMedia: number | null = null): PrestadoraResumo {
  return {
    id: nome,
    nome,
    avatarUrl: null,
    cidade: null,
    categorias: [],
    notaMedia,
    totalAvaliacoes: notaMedia === null ? 0 : 1,
    precos: precos.map(([categoriaId, precoBase, aceitaNegociar = false]): PrecoCategoria => ({
      categoriaId,
      precoBase,
      aceitaNegociar,
    })),
  };
}

describe("precoDeReferencia", () => {
  const p = prestadora("Ana", [[1, 150, true], [2, 90], [3, null]]);

  it("sem filtro, o menor preço entre os serviços", () => {
    expect(precoDeReferencia(p)).toEqual({ categoriaId: 2, precoBase: 90, aceitaNegociar: false });
  });

  it("com filtro, o preço daquele serviço", () => {
    expect(precoDeReferencia(p, 1)?.precoBase).toBe(150);
    expect(precoDeReferencia(p, 3)).toBeNull(); // a combinar
    expect(precoDeReferencia(p, 9)).toBeNull(); // não faz
  });

  it("empate de valor: o negociável vence (o selo aparece)", () => {
    expect(precoDeReferencia(prestadora("Bia", [[1, 90], [2, 90, true]]))?.categoriaId).toBe(2);
  });
});

describe("ordenarPorPreco", () => {
  it("do mais barato ao mais caro, sem preço no fim", () => {
    const lista = [
      prestadora("Cara", [[1, 300]]),
      prestadora("Sem preço", [[1, null]]),
      prestadora("Barata", [[1, 50]]),
      prestadora("Média", [[1, 120]]),
    ];
    expect(ordenarPorPreco(lista).map((p) => p.nome)).toEqual(["Barata", "Média", "Cara", "Sem preço"]);
  });

  it("empate: maior nota, depois nome", () => {
    const lista = [
      prestadora("Zélia", [[1, 100]], 4),
      prestadora("Bia", [[1, 100]], null),
      prestadora("Ana", [[1, 100]], 4),
      prestadora("Carla", [[1, 100]], 5),
    ];
    expect(ordenarPorPreco(lista).map((p) => p.nome)).toEqual(["Carla", "Ana", "Zélia", "Bia"]);
  });

  it("com filtro, compara o preço do serviço filtrado", () => {
    const a = prestadora("A", [[1, 500], [2, 10]]);
    const b = prestadora("B", [[1, 100], [2, 400]]);
    expect(ordenarPorPreco([a, b]).map((p) => p.nome)).toEqual(["A", "B"]);
    expect(ordenarPorPreco([a, b], 1).map((p) => p.nome)).toEqual(["B", "A"]);
  });

  it("não muda a lista recebida", () => {
    const lista = [prestadora("B", [[1, 2]]), prestadora("A", [[1, 1]])];
    ordenarPorPreco(lista);
    expect(lista.map((p) => p.nome)).toEqual(["B", "A"]);
  });
});

describe("conversão dos preços da identidade", () => {
  it("camelCase, ordem por categoria e sem negociação quando não há preço", () => {
    const lista = paraPrecosCategoria([
      { prestadora_id: "x", categoria_id: 3, preco_base: null, aceita_negociar: true },
      { prestadora_id: "x", categoria_id: 1, preco_base: 10, aceita_negociar: true },
    ]);
    expect(lista).toEqual([
      { categoriaId: 1, precoBase: 10, aceitaNegociar: true },
      { categoriaId: 3, precoBase: null, aceitaNegociar: false },
    ]);
  });

  it("agrupa por prestadora", () => {
    const grupos = precosPorPrestadora([
      { prestadora_id: "a", categoria_id: 1, preco_base: 10, aceita_negociar: false },
      { prestadora_id: "b", categoria_id: 1, preco_base: 20, aceita_negociar: false },
      { prestadora_id: "a", categoria_id: 2, preco_base: 30, aceita_negociar: false },
    ]);
    expect(grupos.get("a")?.map((p) => p.categoriaId)).toEqual([1, 2]);
    expect(grupos.get("b")).toHaveLength(1);
  });
});

describe("busca por preço (mock)", () => {
  beforeEach(() => {
    redefinirMocks();
    redefinirPrecosMock();
    mock.redefinirAvaliacoesMock();
  });

  it("ordena do mais barato ao mais caro", async () => {
    // Aline 99,90 · Camila 120 · Marina 150 · Joana 180
    const lista = await mock.buscarPrestadoras({ ordenarPor: "preco" });
    expect(lista.map((p) => p.id)).toEqual([
      ID_PRESTADORA_ALINE,
      ID_PRESTADORA_CAMILA,
      ID_PRESTADORA_MARINA,
      ID_PRESTADORA_JOANA,
    ]);
  });

  it("com filtro de serviço, a combinar vai para o fim", async () => {
    // Encanamento: Camila 120; Aline a combinar.
    const lista = await mock.buscarPrestadoras({ ordenarPor: "preco", categoriaId: 3 });
    expect(lista.map((p) => p.id)).toEqual([ID_PRESTADORA_CAMILA, ID_PRESTADORA_ALINE]);
  });

  it("preço novo aparece na busca e na página da prestadora", async () => {
    definirUsuariaMock(ID_PRESTADORA_JOANA);
    await servicoPrecosMock.salvarMeusPrecos([{ categoria_id: 4, preco_base: 60, aceita_negociar: true }]);
    const lista = await mock.buscarPrestadoras({ ordenarPor: "preco" });
    expect(lista[0].id).toBe(ID_PRESTADORA_JOANA);
    const joana = await mock.obterPrestadora(ID_PRESTADORA_JOANA);
    expect(joana?.precos).toEqual([{ categoriaId: 4, precoBase: 60, aceitaNegociar: true }]);
  });

  it("ordem por nota continua igual", async () => {
    const lista = await mock.buscarPrestadoras({ ordenarPor: "nota" });
    const notas = lista.map((p) => p.notaMedia ?? -1);
    expect(notas).toEqual([...notas].sort((a, b) => b - a));
  });
});
