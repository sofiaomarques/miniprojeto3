// Tipos × migration: lê 01_identidade.sql e confere colunas, tipos e nulos
// contra os tipos TypeScript. A parte de tipos é checada pelo tsc (os
// descritores abaixo usam `satisfies`); a parte do SQL, em tempo de execução.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  CATEGORIAS_MOCK,
  FOTOS_MOCK,
  ID_USUARIA_MOCK_PADRAO,
  PERFIS_MOCK,
  SERVICOS_MOCK,
} from "../mocks";
import {
  CAMPOS_EDITAVEIS_PERFIL,
  COLUNAS_CATEGORIA,
  COLUNAS_FOTO,
  COLUNAS_PERFIL,
  COLUNAS_SERVICO,
} from "../service";
import type {
  AtualizacaoPerfil,
  CategoriaServico,
  FotoPortfolio,
  Papel,
  Perfil,
  ServicoPrestadora,
} from "../types";

const SQL = readFileSync(
  fileURLToPath(new URL("../../../../supabase/migrations/01_identidade.sql", import.meta.url)),
  "utf8",
).replace(/\r\n/g, "\n"); // checkout no Windows pode vir com CRLF

// ---------------------------------------------------------------------------
// Leitura da migration
// ---------------------------------------------------------------------------
type ColunaSql = { tipo: string; nulavel: boolean };

function colunasDaTabela(tabela: string): Record<string, ColunaSql> {
  const bloco = SQL.match(new RegExp(`create table public\\.${tabela} \\(([\\s\\S]*?)\\n\\);`));
  if (!bloco) throw new Error(`tabela ${tabela} não encontrada na migration`);
  const colunas: Record<string, ColunaSql> = {};
  for (const linha of bloco[1].split("\n")) {
    const m = linha.match(/^\s*([a-z_]+)\s+(uuid|text|bigint|timestamptz)\b(.*)$/);
    if (!m) continue;
    colunas[m[1]] = { tipo: m[2], nulavel: !/not null|primary key/.test(m[3]) };
  }
  return colunas;
}

const TIPO_TS_DO_PG: Record<string, "string" | "number"> = {
  uuid: "string",
  text: "string",
  timestamptz: "string",
  bigint: "number",
};

// ---------------------------------------------------------------------------
// Descritores amarrados aos tipos pelo compilador: se um campo do tipo mudar
// de tipo, de nulo ou sumir/sobrar, o `satisfies` quebra o tsc.
// ---------------------------------------------------------------------------
type TipoTs<T> = T extends string ? "string" : T extends number ? "number" : never;
type Descritor<T> = {
  [K in keyof T]-?: readonly [TipoTs<NonNullable<T[K]>>, null extends T[K] ? true : false];
};

const DESCRITOR_PERFIL = {
  id: ["string", false],
  papel: ["string", true],
  nome: ["string", true],
  avatar_url: ["string", true],
  bio: ["string", true],
  cidade: ["string", true],
  criado_em: ["string", false],
  atualizado_em: ["string", false],
} as const satisfies Descritor<Perfil>;

const DESCRITOR_CATEGORIA = {
  id: ["number", false],
  nome: ["string", false],
} as const satisfies Descritor<CategoriaServico>;

const DESCRITOR_SERVICO = {
  prestadora_id: ["string", false],
  categoria_id: ["number", false],
  criado_em: ["string", false],
} as const satisfies Descritor<ServicoPrestadora>;

const DESCRITOR_FOTO = {
  id: ["number", false],
  prestadora_id: ["string", false],
  caminho: ["string", false],
  criada_em: ["string", false],
} as const satisfies Descritor<FotoPortfolio>;

// Papel exaustivo: a lista tem todos os valores do tipo e só eles.
const PAPEIS = ["cliente", "prestadora"] as const satisfies readonly Papel[];
type FaltaPapel = Exclude<Papel, (typeof PAPEIS)[number]>;
const papelCompleto: [FaltaPapel] extends [never] ? true : false = true;

// Asserções de tipo extras (quebram o tsc se o contrato mudar).
type Igual<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
const papelNulavel: Igual<Perfil["papel"], Papel | null> = true;
const camposEditaveis: Igual<keyof AtualizacaoPerfil, (typeof CAMPOS_EDITAVEIS_PERFIL)[number]> = true;
const nomeEditavelSemNull: Igual<AtualizacaoPerfil["nome"], string | undefined> = true;

const TABELAS = [
  ["perfis", DESCRITOR_PERFIL, COLUNAS_PERFIL],
  ["categorias_servico", DESCRITOR_CATEGORIA, COLUNAS_CATEGORIA],
  ["servicos_prestadora", DESCRITOR_SERVICO, COLUNAS_SERVICO],
  ["fotos_portfolio", DESCRITOR_FOTO, COLUNAS_FOTO],
] as const;

describe("tipos espelham 01_identidade.sql", () => {
  it.each(TABELAS)("%s: mesmas colunas, tipos e nulos", (tabela, descritor, colunasDoService) => {
    const sql = colunasDaTabela(tabela);
    expect(Object.keys(sql).length).toBeGreaterThan(0);

    // Nenhuma coluna inventada e nenhuma esquecida.
    expect(Object.keys(descritor).sort()).toEqual(Object.keys(sql).sort());
    // O select do service pede exatamente essas colunas.
    expect([...colunasDoService].sort()).toEqual(Object.keys(sql).sort());

    for (const [coluna, [tipoTs, nulavel]] of Object.entries(descritor)) {
      expect({ coluna, tipo: TIPO_TS_DO_PG[sql[coluna].tipo] }).toEqual({ coluna, tipo: tipoTs });
      expect({ coluna, nulavel: sql[coluna].nulavel }).toEqual({ coluna, nulavel });
    }
  });

  it("Papel tem exatamente os valores do CHECK de perfis.papel", () => {
    const check = SQL.match(/papel\s+text check \(papel in \(([^)]*)\)\)/);
    expect(check).not.toBeNull();
    const valores = [...check![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect([...PAPEIS].sort()).toEqual(valores.sort());
    expect(papelCompleto && papelNulavel && camposEditaveis && nomeEditavelSemNull).toBe(true);
  });

  it("campos editáveis = colunas com GRANT UPDATE, menos papel (onboarding #14)", () => {
    const grant = SQL.match(/grant update \(([^)]*)\) on table public\.perfis to authenticated/);
    expect(grant).not.toBeNull();
    const comGrant = grant![1].split(",").map((c) => c.trim());
    expect([...CAMPOS_EDITAVEIS_PERFIL].sort()).toEqual(comGrant.filter((c) => c !== "papel").sort());
    for (const protegido of ["id", "papel", "criado_em", "atualizado_em"]) {
      expect(CAMPOS_EDITAVEIS_PERFIL as readonly string[]).not.toContain(protegido);
    }
  });
});

// ---------------------------------------------------------------------------
// Mocks respeitam os tipos e as regras do banco
// ---------------------------------------------------------------------------
const REGEX_CAMINHO =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^/]+$/;
const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ehIso = (v: string) => !Number.isNaN(Date.parse(v)) && /^\d{4}-\d{2}-\d{2}T/.test(v);

function conferirLinha(linha: Record<string, unknown>, descritor: Record<string, readonly [string, boolean]>) {
  expect(Object.keys(linha).sort()).toEqual(Object.keys(descritor).sort());
  for (const [coluna, [tipo, nulavel]] of Object.entries(descritor)) {
    const valor = linha[coluna];
    if (valor === null) expect({ coluna, nulavel }).toEqual({ coluna, nulavel: true });
    else expect({ coluna, tipo: typeof valor }).toEqual({ coluna, tipo });
  }
}

describe("mocks respeitam tipos e restrições", () => {
  it("todas as linhas têm as chaves e os tipos do descritor", () => {
    PERFIS_MOCK.forEach((l) => conferirLinha(l, DESCRITOR_PERFIL));
    CATEGORIAS_MOCK.forEach((l) => conferirLinha(l, DESCRITOR_CATEGORIA));
    SERVICOS_MOCK.forEach((l) => conferirLinha(l, DESCRITOR_SERVICO));
    FOTOS_MOCK.forEach((l) => conferirLinha(l, DESCRITOR_FOTO));
  });

  it("categorias = seed da migration, com os ids na ordem de inserção", () => {
    const insert = SQL.match(/insert into public\.categorias_servico \(nome\) values([\s\S]*?);/);
    const seed = [...insert![1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
    expect(CATEGORIAS_MOCK).toEqual(seed.map((nome, i) => ({ id: i + 1, nome })));
  });

  it("perfis obedecem aos CHECKs de perfis", () => {
    const ids = PERFIS_MOCK.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of PERFIS_MOCK) {
      expect(p.id).toMatch(REGEX_UUID);
      expect(p.papel === null || PAPEIS.includes(p.papel)).toBe(true);
      if (p.papel !== null) expect(p.nome).not.toBeNull(); // perfis_nome_obrigatorio_com_papel
      if (p.nome !== null) expect([...p.nome.trim()].length).toBeGreaterThanOrEqual(1);
      if (p.nome !== null) expect([...p.nome.trim()].length).toBeLessThanOrEqual(80);
      if (p.avatar_url !== null) expect(p.avatar_url).toMatch(/^https?:\/\//);
      if (p.bio !== null) expect([...p.bio].length).toBeLessThanOrEqual(500);
      if (p.cidade !== null) expect([...p.cidade.trim()].length).toBeLessThanOrEqual(100);
      expect(ehIso(p.criado_em) && ehIso(p.atualizado_em)).toBe(true);
    }
    // Cobrem os três estados de papel, inclusive antes do onboarding.
    expect(new Set(PERFIS_MOCK.map((p) => p.papel))).toEqual(new Set(["cliente", "prestadora", null]));
    expect(PERFIS_MOCK.some((p) => p.id === ID_USUARIA_MOCK_PADRAO)).toBe(true);
  });

  it("serviços e fotos só apontam para prestadoras e categorias existentes", () => {
    const prestadoras = new Set(PERFIS_MOCK.filter((p) => p.papel === "prestadora").map((p) => p.id));
    const categorias = new Set(CATEGORIAS_MOCK.map((c) => c.id));

    const chaves = SERVICOS_MOCK.map((s) => `${s.prestadora_id}:${s.categoria_id}`);
    expect(new Set(chaves).size).toBe(chaves.length); // PK composta
    for (const s of SERVICOS_MOCK) {
      expect(prestadoras.has(s.prestadora_id)).toBe(true); // trigger exigir_prestadora
      expect(categorias.has(s.categoria_id)).toBe(true); // FK
      expect(ehIso(s.criado_em)).toBe(true);
    }

    const caminhos = FOTOS_MOCK.map((f) => f.caminho);
    expect(new Set(caminhos).size).toBe(caminhos.length); // caminho unique
    expect(new Set(FOTOS_MOCK.map((f) => f.id)).size).toBe(FOTOS_MOCK.length);
    for (const f of FOTOS_MOCK) {
      expect(prestadoras.has(f.prestadora_id)).toBe(true);
      expect(f.caminho).toMatch(REGEX_CAMINHO); // fotos_portfolio_caminho_valido
      expect(f.caminho.split("/")[0]).toBe(f.prestadora_id);
      expect(f.caminho).not.toMatch(/\/\.\.?$/);
      expect([...f.caminho].length).toBeLessThanOrEqual(512);
      expect(ehIso(f.criada_em)).toBe(true);
    }
  });
});
