// O mock da descoberta usa perfis, categorias e fotos do mock da identidade
// (P1): os ids e nomes das duas áreas precisam bater.
import { beforeEach, describe, expect, it } from "vitest";

import {
  CATEGORIAS_MOCK,
  ID_CLIENTE_BEATRIZ,
  ID_CLIENTE_FERNANDA,
  ID_PRESTADORA_ALINE,
  ID_PRESTADORA_CAMILA,
  ID_PRESTADORA_MARINA,
  ID_SEM_PAPEL,
  definirUsuariaMock,
  redefinirMocks,
  servicoMock,
} from "@/lib/identidade/mocks";

import * as mock from "../service-mock";
import { mediaComUmaCasa, normalizarTexto } from "../texto";

const idCategoria = (nome: string) => CATEGORIAS_MOCK.find((c) => c.nome === nome)!.id;

beforeEach(() => {
  redefinirMocks();
  mock.redefinirAvaliacoesMock();
});

describe("busca (mock)", () => {
  it("usa as categorias da identidade", async () => {
    const categorias = await mock.listarCategorias();
    expect(categorias.map((c) => c.id).sort()).toEqual(CATEGORIAS_MOCK.map((c) => c.id).sort());
  });

  it("filtra por categoria e cidade sem acento", async () => {
    const encanamento = await mock.buscarPrestadoras({ categoriaId: idCategoria("Encanamento") });
    expect(encanamento.map((p) => p.id).sort()).toEqual([ID_PRESTADORA_ALINE, ID_PRESTADORA_CAMILA].sort());

    const jp = await mock.buscarPrestadoras({ cidade: "joao pessoa" });
    expect(jp.every((p) => p.cidade === "João Pessoa")).toBe(true);
    expect(jp.length).toBeGreaterThan(0);
  });

  it("ordena por nota com quem não tem avaliação no fim", async () => {
    const lista = await mock.buscarPrestadoras({ ordenarPor: "nota" });
    const notas = lista.map((p) => p.notaMedia);
    const comNota = notas.filter((n) => n !== null) as number[];
    expect(comNota).toEqual([...comNota].sort((a, b) => b - a));
    expect(notas.slice(comNota.length).every((n) => n === null)).toBe(true);
  });
});

describe("página da prestadora (mock)", () => {
  it("traz perfil e fotos da identidade e média com uma casa", async () => {
    const marina = await mock.obterPrestadora(ID_PRESTADORA_MARINA);
    expect(marina?.perfil.nome).toBe("Marina Souza");
    expect(marina?.fotos.length).toBeGreaterThan(0);
    expect(marina?.notaMedia).toBe(4.5);
  });

  it("cliente não é prestadora", async () => {
    expect(await mock.obterPrestadora(ID_CLIENTE_BEATRIZ)).toBeNull();
  });

  it("avaliar atualiza a média e não deixa avaliar duas vezes", async () => {
    await mock.criarAvaliacao(ID_CLIENTE_BEATRIZ, { prestadoraId: ID_PRESTADORA_CAMILA, nota: 4 });
    const camila = await mock.obterPrestadora(ID_PRESTADORA_CAMILA);
    expect(camila?.notaMedia).toBe(4.5);
    expect(camila?.avaliacoes[0].clienteNome).toBe("Beatriz Alves");
    await expect(
      mock.criarAvaliacao(ID_CLIENTE_BEATRIZ, { prestadoraId: ID_PRESTADORA_CAMILA, nota: 5 }),
    ).rejects.toThrow();
  });
});

describe("contas criadas no onboarding (mock)", () => {
  it("quem vira cliente consegue avaliar", async () => {
    definirUsuariaMock(ID_SEM_PAPEL);
    await servicoMock.escolherMeuPapel("cliente", "Nova Cliente");
    const nova = await mock.criarAvaliacao(ID_SEM_PAPEL, {
      prestadoraId: ID_PRESTADORA_MARINA,
      nota: 5,
    });
    expect(nova.clienteNome).toBe("Nova Cliente");
  });

  it("quem vira prestadora aparece na busca", async () => {
    definirUsuariaMock(ID_SEM_PAPEL);
    await servicoMock.escolherMeuPapel("prestadora", "Nova Prestadora");
    const lista = await mock.buscarPrestadoras({});
    expect(lista.map((p) => p.id)).toContain(ID_SEM_PAPEL);
  });
});

describe("texto", () => {
  it("normaliza acento e maiúscula", () => {
    expect(normalizarTexto("  JOÃO Pessoa ")).toBe("joao pessoa");
  });
  it("média com uma casa", () => {
    expect(mediaComUmaCasa([])).toBeNull();
    expect(mediaComUmaCasa([5, 4, 4])).toBe(4.3);
  });
});

describe("indicações de várias clientes (mock)", () => {
  it("junta as das clientes pedidas, mais recentes primeiro, com limite", async () => {
    const todas = await mock.listarIndicacoesDasClientes([ID_CLIENTE_BEATRIZ, ID_CLIENTE_FERNANDA], 10);
    expect(todas.length).toBeGreaterThan(1);
    expect(todas.map((a) => a.criadaEm)).toEqual([...todas.map((a) => a.criadaEm)].sort().reverse());
    expect(await mock.listarIndicacoesDasClientes([ID_CLIENTE_BEATRIZ, ID_CLIENTE_FERNANDA], 1)).toHaveLength(1);
    expect(await mock.listarIndicacoesDasClientes([ID_PRESTADORA_MARINA], 10)).toEqual([]);
  });
});
