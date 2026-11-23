// NEXT_PUBLIC_USE_MOCKS: troca de modo, mesmo contrato nos dois e nenhum
// fallback silencioso para mock. Cada teste carrega os módulos do zero,
// porque a flag é lida quando lib/supabase/config.ts é importado.
import { afterEach, describe, expect, it, vi } from "vitest";
import { criarClienteFalso } from "./cliente-falso";
import type { ErroIdentidade } from "../erros";
import type { ServicoIdentidade } from "../types";

async function carregar(flag: string, vercelEnv?: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", flag);
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", vercelEnv ?? "");
  const service = await import("../service");
  const mocks = await import("../mocks");
  const { usarMocks } = await import("@/lib/supabase/config");
  return { ...service, ...mocks, usarMocks };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

const PRESTADORA = "00000000-0000-4000-8000-0000000000a1";
const CLIENTE = "00000000-0000-4000-8000-0000000000c1";
const INEXISTENTE = "99999999-9999-4999-8999-999999999999";

async function codigoDoErro(promessa: Promise<unknown>): Promise<string> {
  try {
    await promessa;
  } catch (erro) {
    return (erro as ErroIdentidade).codigo;
  }
  return "sem erro";
}

describe("NEXT_PUBLIC_USE_MOCKS=true", () => {
  it("usa os mocks e não toca no cliente Supabase", async () => {
    const m = await carregar("true");
    expect(m.usarMocks).toBe(true);
    const f = criarClienteFalso({ usuaria: CLIENTE });

    for (const cliente of [null, f.cliente]) {
      const s = m.servicoIdentidade(cliente);
      expect(await s.obterPerfil(PRESTADORA)).toEqual(m.PERFIS_MOCK[0]);
      expect(await s.listarCategorias()).toHaveLength(m.CATEGORIAS_MOCK.length);
      expect((await s.obterMeuPerfil())?.id).toBe(m.ID_USUARIA_MOCK_PADRAO);
    }
    expect(f.consultas).toHaveLength(0);
    expect(f.chamadasAuth).toBe(0);
  });

  it("escritas são previsíveis e somem com redefinirMocks()", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-22T10:00:00.000Z"));
    try {
      const m = await carregar("true");
      const s = m.servicoIdentidade(null);

      const atualizado = await s.atualizarMeuPerfil({ bio: "  Nova bio  " });
      expect(atualizado).toEqual({
        ...m.PERFIS_MOCK[0],
        bio: "Nova bio",
        atualizado_em: "2026-11-22T10:00:00.000Z",
      });
      expect((await s.obterPerfil(PRESTADORA))?.bio).toBe("Nova bio");

      expect(await s.adicionarMeuServico(5)).toEqual({
        prestadora_id: PRESTADORA,
        categoria_id: 5,
        criado_em: "2026-11-22T10:00:00.000Z",
      });
      expect((await s.listarServicosDaPrestadora(PRESTADORA)).map((x) => x.categoria_id)).toEqual([1, 5]);
      await s.removerMeuServico(1);
      expect((await s.listarServicosDaPrestadora(PRESTADORA)).map((x) => x.categoria_id)).toEqual([5]);

      // Os dados de partida (PERFIS_MOCK etc.) não são alterados.
      expect(m.PERFIS_MOCK[0].bio).not.toBe("Nova bio");

      m.redefinirMocks();
      expect(await s.obterPerfil(PRESTADORA)).toEqual(m.PERFIS_MOCK[0]);
      expect((await s.listarServicosDaPrestadora(PRESTADORA)).map((x) => x.categoria_id)).toEqual([1]);
    } finally {
      vi.useRealTimers();
    }
  });

  it("quem recebe um objeto não altera o estado do mock por fora", async () => {
    const m = await carregar("true");
    const s = m.servicoIdentidade(null);
    const perfil = (await s.obterPerfil(PRESTADORA))!;
    perfil.papel = "cliente";
    perfil.nome = "Hackeada";
    expect(await s.obterPerfil(PRESTADORA)).toEqual(m.PERFIS_MOCK[0]);
  });

  it("repete a RLS de leitura: só prestadoras são públicas", async () => {
    const m = await carregar("true");
    const s = m.servicoIdentidade(null);

    m.definirUsuariaMock(null);
    expect(await s.obterPerfil(PRESTADORA)).not.toBeNull();
    expect(await s.obterPerfil(CLIENTE)).toBeNull();
    expect(await s.obterPerfil(m.ID_SEM_PAPEL)).toBeNull();
    expect((await s.listarPerfis([PRESTADORA, CLIENTE, m.ID_SEM_PAPEL])).map((p) => p.id)).toEqual([
      PRESTADORA,
    ]);

    m.definirUsuariaMock(m.ID_CLIENTE_FERNANDA);
    expect(await s.obterPerfil(CLIENTE)).toBeNull(); // outra cliente

    m.definirUsuariaMock(CLIENTE);
    expect((await s.obterPerfil(CLIENTE))?.id).toBe(CLIENTE); // a própria
    m.definirUsuariaMock(m.ID_SEM_PAPEL);
    expect((await s.obterPerfil(m.ID_SEM_PAPEL))?.papel).toBeNull();
  });

  it("repete as regras do banco: sessão, papel, duplicata e categoria", async () => {
    const m = await carregar("true");
    const s = m.servicoIdentidade(null);

    m.definirUsuariaMock(null);
    expect(await s.obterMeuPerfil()).toBeNull();
    expect(await codigoDoErro(s.atualizarMeuPerfil({ bio: "x" }))).toBe("nao_autenticada");
    expect(await codigoDoErro(s.adicionarMeuServico(1))).toBe("nao_autenticada");
    expect(await codigoDoErro(s.removerMeuServico(1))).toBe("nao_autenticada");

    m.definirUsuariaMock(CLIENTE);
    expect(await codigoDoErro(s.adicionarMeuServico(1))).toBe("permissao");

    m.definirUsuariaMock(m.ID_SEM_PAPEL);
    expect(await codigoDoErro(s.adicionarMeuServico(1))).toBe("permissao");
    expect((await s.obterMeuPerfil())?.papel).toBeNull();

    m.definirUsuariaMock(PRESTADORA);
    expect(await codigoDoErro(s.adicionarMeuServico(1))).toBe("conflito");
    expect(await codigoDoErro(s.adicionarMeuServico(999))).toBe("validacao");
    expect(await codigoDoErro(s.removerMeuServico(2))).toBe("nao_encontrado");
    expect(await codigoDoErro(s.atualizarMeuPerfil({ papel: "cliente" } as never))).toBe("validacao");
    expect((await s.obterMeuPerfil())?.papel).toBe("prestadora");
  });
});

describe("NEXT_PUBLIC_USE_MOCKS=false", () => {
  it("usa o cliente Supabase", async () => {
    const m = await carregar("false");
    expect(m.usarMocks).toBe(false);
    const linha = { id: 9, nome: "Só no banco" };
    const f = criarClienteFalso({ responder: () => ({ data: [linha], error: null }) });
    expect(await m.servicoIdentidade(f.cliente).listarCategorias()).toEqual([linha]);
    expect(f.consultas).toHaveLength(1);
  });

  it("sem cliente: erro 'indisponivel', nunca os mocks", async () => {
    const m = await carregar("false");
    expect(() => m.servicoIdentidade(null)).toThrowError(
      expect.objectContaining({ codigo: "indisponivel" }),
    );
  });

  it.each([
    ["rede fora", { code: "", message: "TypeError: fetch failed" }],
    ["erro interno", { code: "XX000", message: "boom" }],
    ["RLS", { code: "42501", message: "permission denied" }],
  ])("falha real (%s) é lançada e não devolve dados de mock", async (_nome, error) => {
    const m = await carregar("false");
    const f = criarClienteFalso({ usuaria: PRESTADORA, responder: () => ({ data: null, error }) });
    const s = m.servicoIdentidade(f.cliente);
    await expect(s.obterPerfil(PRESTADORA)).rejects.toBeInstanceOf(m.ErroIdentidade);
    await expect(s.listarCategorias()).rejects.toBeInstanceOf(m.ErroIdentidade);
    await expect(s.obterMeuPerfil()).rejects.toBeInstanceOf(m.ErroIdentidade);
    await expect(s.listarFotosDaPrestadora(PRESTADORA)).rejects.toBeInstanceOf(m.ErroIdentidade);
  });

  it("em produção a flag é ignorada (sempre Supabase real)", async () => {
    const m = await carregar("true", "production");
    expect(m.usarMocks).toBe(false);
    expect(() => m.servicoIdentidade(null)).toThrowError(
      expect.objectContaining({ codigo: "indisponivel" }),
    );
  });
});

describe("os dois modos têm o mesmo contrato", () => {
  // O cliente falso responde com as mesmas linhas dos mocks, no formato do
  // banco. Com os mesmos dados, os dois modos têm que devolver o mesmo.
  function bancoComOsMocks(m: Awaited<ReturnType<typeof carregar>>, usuaria: string | null) {
    return criarClienteFalso({
      usuaria,
      responder(consulta) {
        const filtro = (nome: string) =>
          consulta.chamadas.filter((c) => c.metodo === "eq" && c.args[0] === nome).map((c) => c.args[1]);
        const unico = consulta.chamadas.some((c) => c.metodo === "maybeSingle");
        if (consulta.tabela === "perfis") {
          const ids = consulta.chamadas.find((c) => c.metodo === "in")?.args[1] as string[] | undefined;
          const [id] = filtro("id");
          // Mesma policy de leitura da 01: prestadora pública ou o próprio perfil.
          const linhas = m.PERFIS_MOCK.filter(
            (p) =>
              (ids ? ids.includes(p.id) : p.id === id) &&
              (p.papel === "prestadora" || p.id === usuaria),
          );
          return { data: unico ? (linhas[0] ?? null) : [...linhas].sort((a, b) => (a.id < b.id ? -1 : 1)), error: null };
        }
        if (consulta.tabela === "categorias_servico") {
          const linhas = [...m.CATEGORIAS_MOCK].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
          return { data: linhas, error: null };
        }
        const [prestadora] = filtro("prestadora_id");
        if (consulta.tabela === "servicos_prestadora") {
          return { data: m.SERVICOS_MOCK.filter((x) => x.prestadora_id === prestadora), error: null };
        }
        return { data: m.FOTOS_MOCK.filter((x) => x.prestadora_id === prestadora), error: null };
      },
    });
  }

  type Cenario = [string, (s: ServicoIdentidade) => Promise<unknown>];
  const cenarios: Cenario[] = [
    ["obterPerfil existente", (s) => s.obterPerfil(PRESTADORA)],
    ["obterPerfil inexistente", (s) => s.obterPerfil(INEXISTENTE)],
    ["obterPerfil inválido", (s) => s.obterPerfil("nao-e-uuid")],
    ["obterPerfil de cliente por outra conta", (s) => s.obterPerfil(CLIENTE)],
    ["listarPerfis", (s) => s.listarPerfis([CLIENTE, PRESTADORA, INEXISTENTE, "x"])],
    ["obterMeuPerfil", (s) => s.obterMeuPerfil()],
    ["listarCategorias", (s) => s.listarCategorias()],
    ["listarServicosDaPrestadora", (s) => s.listarServicosDaPrestadora(PRESTADORA)],
    ["listarFotosDaPrestadora", (s) => s.listarFotosDaPrestadora(PRESTADORA)],
    ["fotos de quem não tem", (s) => s.listarFotosDaPrestadora(CLIENTE)],
  ];

  async function rodar(s: ServicoIdentidade, fn: (s: ServicoIdentidade) => Promise<unknown>) {
    try {
      return { ok: await fn(s) };
    } catch (erro) {
      return { erro: (erro as ErroIdentidade).codigo };
    }
  }

  it("expõem as mesmas funções", async () => {
    const mock = (await carregar("true")).servicoIdentidade(null);
    const real = (await carregar("false")).servicoIdentidade(criarClienteFalso().cliente);
    expect(Object.keys(mock).sort()).toEqual(Object.keys(real).sort());
    for (const nome of Object.keys(mock) as (keyof ServicoIdentidade)[]) {
      expect(real[nome].length).toBe(mock[nome].length);
    }
  });

  it.each(cenarios)("%s: mesmo resultado nos dois modos", async (_nome, fn) => {
    const mm = await carregar("true");
    const mock = mm.servicoIdentidade(null);
    const mr = await carregar("false");
    const real = mr.servicoIdentidade(bancoComOsMocks(mr, mr.ID_USUARIA_MOCK_PADRAO).cliente);
    expect(await rodar(real, fn)).toEqual(await rodar(mock, fn));
  });

  it.each([
    ["sem sessão: atualizar", null, (s: ServicoIdentidade) => s.atualizarMeuPerfil({ bio: "x" })],
    ["sem sessão: adicionar serviço", null, (s: ServicoIdentidade) => s.adicionarMeuServico(1)],
    ["sem sessão: meu perfil", null, (s: ServicoIdentidade) => s.obterMeuPerfil()],
    ["campo protegido", PRESTADORA, (s: ServicoIdentidade) => s.atualizarMeuPerfil({ id: CLIENTE } as never)],
    ["categoria inválida", PRESTADORA, (s: ServicoIdentidade) => s.removerMeuServico(-1)],
  ] as const)("%s: mesmo erro nos dois modos", async (_nome, usuaria, fn) => {
    const mm = await carregar("true");
    mm.definirUsuariaMock(usuaria);
    const mock = mm.servicoIdentidade(null);
    const mr = await carregar("false");
    const real = mr.servicoIdentidade(bancoComOsMocks(mr, usuaria).cliente);
    expect(await rodar(real, fn)).toEqual(await rodar(mock, fn));
  });
});
