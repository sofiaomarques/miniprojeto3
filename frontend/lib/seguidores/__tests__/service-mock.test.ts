// O mock de seguidores replica as regras da 06_seguidores.sql e usa os perfis
// do mock da identidade (P1).
import { beforeEach, describe, expect, it } from "vitest";

import {
  ID_CLIENTE_BEATRIZ,
  ID_CLIENTE_FERNANDA,
  ID_PRESTADORA_ALINE,
  ID_PRESTADORA_MARINA,
  ID_SEM_PAPEL,
  definirUsuariaMock,
  redefinirMocks,
} from "@/lib/identidade/mocks";

import { ordenarConexoes, termoDeBusca } from "../regras";
import * as mock from "../service-mock";
import { ERRO_SEGUIR_A_SI_MESMA, ERRO_SEGUIR_DESLOGADA, ERRO_SEGUIR_SEM_PAPEL } from "../types";

beforeEach(() => {
  redefinirMocks();
  mock.redefinirSeguidoresMock();
  definirUsuariaMock(ID_CLIENTE_BEATRIZ);
});

describe("seguir (mock)", () => {
  it("cliente segue prestadora e os dois contadores mudam", async () => {
    const antesDela = await mock.contar(ID_PRESTADORA_ALINE);
    const antesMinha = await mock.contar(ID_CLIENTE_BEATRIZ);
    await mock.seguir(ID_PRESTADORA_ALINE);
    expect(await mock.euSigo(ID_PRESTADORA_ALINE)).toBe(true);
    expect((await mock.contar(ID_PRESTADORA_ALINE)).seguidores).toBe(antesDela.seguidores + 1);
    expect((await mock.contar(ID_CLIENTE_BEATRIZ)).seguindo).toBe(antesMinha.seguindo + 1);
  });

  it("seguir de novo não duplica", async () => {
    await mock.seguir(ID_PRESTADORA_ALINE);
    await mock.seguir(ID_PRESTADORA_ALINE);
    expect((await mock.contar(ID_PRESTADORA_ALINE)).seguidores).toBe(1);
  });

  it("deixar de seguir tira da lista", async () => {
    expect(await mock.euSigo(ID_CLIENTE_FERNANDA)).toBe(true);
    await mock.deixarDeSeguir(ID_CLIENTE_FERNANDA);
    expect(await mock.euSigo(ID_CLIENTE_FERNANDA)).toBe(false);
    const seguindo = await mock.listar(ID_CLIENTE_BEATRIZ, "seguindo");
    expect(seguindo.map((c) => c.pessoa.id)).not.toContain(ID_CLIENTE_FERNANDA);
  });

  it("ninguém segue a si mesma", async () => {
    await expect(mock.seguir(ID_CLIENTE_BEATRIZ)).rejects.toThrow(ERRO_SEGUIR_A_SI_MESMA);
  });

  it("conta sem papel não segue nem é seguida", async () => {
    await expect(mock.seguir(ID_SEM_PAPEL)).rejects.toThrow();
    definirUsuariaMock(ID_SEM_PAPEL);
    await expect(mock.seguir(ID_PRESTADORA_MARINA)).rejects.toThrow(ERRO_SEGUIR_SEM_PAPEL);
  });

  it("deslogada vê só a contagem", async () => {
    definirUsuariaMock(null);
    expect((await mock.contar(ID_PRESTADORA_MARINA)).seguidores).toBeGreaterThan(0);
    expect(await mock.euSigo(ID_PRESTADORA_MARINA)).toBe(false);
    await expect(mock.seguir(ID_PRESTADORA_MARINA)).rejects.toThrow(ERRO_SEGUIR_DESLOGADA);
    await expect(mock.listar(ID_PRESTADORA_MARINA, "seguidores")).rejects.toThrow(ERRO_SEGUIR_DESLOGADA);
  });
});

describe("listas (mock)", () => {
  it("seguidores da prestadora trazem nome de clientes", async () => {
    const lista = await mock.listar(ID_PRESTADORA_MARINA, "seguidores");
    expect(lista.map((c) => c.pessoa.nome).sort()).toEqual(["Beatriz Alves", "Fernanda Dias"]);
    expect(lista.every((c) => c.pessoa.papel === "cliente")).toBe(true);
  });

  it("seguindo e seguidores batem com a contagem", async () => {
    const contagem = await mock.contar(ID_CLIENTE_FERNANDA);
    expect((await mock.listar(ID_CLIENTE_FERNANDA, "seguidores")).length).toBe(contagem.seguidores);
    expect((await mock.listar(ID_CLIENTE_FERNANDA, "seguindo")).length).toBe(contagem.seguindo);
  });

  it("perfil de pessoa: cliente aparece (só nome, avatar e papel), sem papel não", async () => {
    const fernanda = await mock.obterPessoa(ID_CLIENTE_FERNANDA);
    expect(fernanda).toEqual({ id: ID_CLIENTE_FERNANDA, papel: "cliente", nome: "Fernanda Dias", avatarUrl: null });
    expect(await mock.obterPessoa(ID_SEM_PAPEL)).toBeNull();
  });

  it("busca por nome sem acento e sem maiúscula", async () => {
    const achadas = await mock.buscarPessoas("FERNANDA");
    expect(achadas.map((p) => p.id)).toEqual([ID_CLIENTE_FERNANDA]);
    expect(await mock.buscarPessoas("   ")).toEqual([]);
  });
});

describe("regras", () => {
  it("termo de busca tira curingas do ilike", () => {
    expect(termoDeBusca("  Ána_%,(Paula)  ")).toBe("ana paula");
  });

  it("conexões mais recentes primeiro", () => {
    const pessoa = (nome: string) => ({ id: nome, papel: "cliente" as const, nome, avatarUrl: null });
    const ordem = ordenarConexoes([
      { pessoa: pessoa("b"), desde: "2026-11-01T00:00:00Z" },
      { pessoa: pessoa("a"), desde: "2026-11-02T00:00:00Z" },
    ]);
    expect(ordem.map((c) => c.pessoa.nome)).toEqual(["a", "b"]);
  });
});

describe("feed (mock)", () => {
  it("ids de quem eu sigo, mais recentes primeiro", async () => {
    expect(await mock.idsQueSigo(10)).toEqual([ID_PRESTADORA_MARINA, ID_CLIENTE_FERNANDA]);
    expect(await mock.idsQueSigo(1)).toEqual([ID_PRESTADORA_MARINA]);
  });

  it("deslogada não tem feed", async () => {
    definirUsuariaMock(null);
    await expect(mock.idsQueSigo(10)).rejects.toThrow(ERRO_SEGUIR_DESLOGADA);
  });
});
