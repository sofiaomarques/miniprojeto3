// Service no modo real, com um cliente Supabase falso (sem rede).
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_USE_MOCKS = "false";
  delete process.env.NEXT_PUBLIC_VERCEL_ENV;
});

import { argumentos, criarClienteFalso, metodos, type Consulta } from "./cliente-falso";
import { ErroIdentidade, servicoIdentidade } from "../service";
import { FOTOS_MOCK, PERFIS_MOCK, SERVICOS_MOCK } from "../mocks";

const EU = "00000000-0000-4000-8000-0000000000a1";
const OUTRA = "00000000-0000-4000-8000-0000000000a2";
const INEXISTENTE = "99999999-9999-4999-8999-999999999999";
const PERFIL = PERFIS_MOCK.find((p) => p.id === EU)!;

// Erro no formato do PostgREST.
const erroPg = (code: string, message = "mensagem interna do banco com detalhes") => ({
  data: null,
  error: { code, message, details: "linha (id)=(...)", hint: null },
});

async function falha(promessa: Promise<unknown>): Promise<ErroIdentidade> {
  try {
    await promessa;
  } catch (erro) {
    expect(erro).toBeInstanceOf(ErroIdentidade);
    return erro as ErroIdentidade;
  }
  throw new Error("era esperado um erro");
}

describe("perfis", () => {
  it("obterPerfil devolve o perfil existente, só com as colunas do tipo", async () => {
    const f = criarClienteFalso({ responder: () => ({ data: { ...PERFIL, extra: "x" }, error: null }) });
    const perfil = await servicoIdentidade(f.cliente).obterPerfil(EU);
    expect(perfil).toEqual(PERFIL); // a coluna "extra" não vaza
    const [c] = f.consultas;
    expect(c.tabela).toBe("perfis");
    expect(argumentos(c, "select")[0][0]).toBe(
      "id, papel, nome, avatar_url, bio, cidade, criado_em, atualizado_em",
    );
    expect(argumentos(c, "eq")).toEqual([["id", EU]]);
    expect(metodos(c)).toContain("maybeSingle");
  });

  it("obterPerfil devolve null para perfil inexistente", async () => {
    const f = criarClienteFalso({ responder: () => ({ data: null, error: null }) });
    expect(await servicoIdentidade(f.cliente).obterPerfil(INEXISTENTE)).toBeNull();
  });

  it("obterPerfil com id que não é uuid devolve null sem consultar o banco", async () => {
    const f = criarClienteFalso();
    const s = servicoIdentidade(f.cliente);
    for (const id of ["", "abc", "1 or 1=1", `${EU}' --`, null, 42] as unknown as string[]) {
      expect(await s.obterPerfil(id)).toBeNull();
    }
    expect(f.consultas).toHaveLength(0);
  });

  it("obterPerfil normaliza uuid em maiúsculas", async () => {
    const f = criarClienteFalso({ responder: () => ({ data: PERFIL, error: null }) });
    await servicoIdentidade(f.cliente).obterPerfil(` ${EU.toUpperCase()} `);
    expect(argumentos(f.consultas[0], "eq")).toEqual([["id", EU]]);
  });

  it("listarPerfis remove duplicados e inválidos, e limita a quantidade", async () => {
    const f = criarClienteFalso({ responder: () => ({ data: [PERFIL], error: null }) });
    const s = servicoIdentidade(f.cliente);
    expect(await s.listarPerfis([EU, "lixo", EU.toUpperCase(), OUTRA])).toEqual([PERFIL]);
    expect(argumentos(f.consultas[0], "in")).toEqual([["id", [EU, OUTRA]]]);

    expect(await s.listarPerfis(["lixo"])).toEqual([]);
    expect(f.consultas).toHaveLength(1); // nada a consultar

    const muitos = Array.from({ length: 101 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    );
    expect((await falha(s.listarPerfis(muitos))).codigo).toBe("validacao");
  });

  it("obterMeuPerfil usa o id da sessão", async () => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: PERFIL, error: null }) });
    expect(await servicoIdentidade(f.cliente).obterMeuPerfil()).toEqual(PERFIL);
    expect(argumentos(f.consultas[0], "eq")).toEqual([["id", EU]]);
  });

  it("obterMeuPerfil devolve null sem sessão e não consulta perfis", async () => {
    const f = criarClienteFalso({ usuaria: null });
    expect(await servicoIdentidade(f.cliente).obterMeuPerfil()).toBeNull();
    expect(f.consultas).toHaveLength(0);
  });

  it("obterMeuPerfil trata token inválido/expirado como deslogada", async () => {
    const f = criarClienteFalso({
      erroAuth: { name: "AuthApiError", status: 403, message: "invalid JWT" },
    });
    expect(await servicoIdentidade(f.cliente).obterMeuPerfil()).toBeNull();
  });

  it("token com assinatura inválida (getClaims) é tratado como deslogada", async () => {
    const f = criarClienteFalso({
      erroAuth: { name: "AuthInvalidJwtError", status: 400, message: "Invalid JWT signature" },
    });
    expect(await servicoIdentidade(f.cliente).obterMeuPerfil()).toBeNull();
    expect(f.consultas).toHaveLength(0);
  });

  it("falha de rede no Auth vira 'indisponivel', não 'deslogada'", async () => {
    const f = criarClienteFalso({
      erroAuth: { name: "AuthRetryableFetchError", status: 0, message: "fetch failed" },
    });
    const erro = await falha(servicoIdentidade(f.cliente).obterMeuPerfil());
    expect(erro.codigo).toBe("indisponivel");
  });

  it("obterMeuPerfil com sessão mas sem linha em perfis é erro, não null", async () => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: null, error: null }) });
    expect((await falha(servicoIdentidade(f.cliente).obterMeuPerfil())).codigo).toBe("nao_encontrado");
  });
});

describe("atualizarMeuPerfil", () => {
  it("envia só os campos permitidos, normalizados, filtrando pelo id da sessão", async () => {
    const atualizado = { ...PERFIL, nome: "Marina S.", bio: null, cidade: "Recife" };
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: atualizado, error: null }) });
    const resultado = await servicoIdentidade(f.cliente).atualizarMeuPerfil({
      nome: "  Marina S.  ",
      bio: "   ",
      cidade: "Recife",
    });
    expect(resultado).toEqual(atualizado);
    const [c] = f.consultas;
    expect(c.tabela).toBe("perfis");
    expect(argumentos(c, "update")).toEqual([[{ nome: "Marina S.", bio: null, cidade: "Recife" }]]);
    expect(argumentos(c, "eq")).toEqual([["id", EU]]);
  });

  it("aceita avatar http(s) e null; recusa outros esquemas", async () => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: PERFIL, error: null }) });
    const s = servicoIdentidade(f.cliente);
    await s.atualizarMeuPerfil({ avatar_url: "https://exemplo.com/a.png" });
    await s.atualizarMeuPerfil({ avatar_url: null });
    for (const url of ["javascript:alert(1)", "data:image/png;base64,xx", "ftp://x", "//x.com/a"]) {
      expect((await falha(s.atualizarMeuPerfil({ avatar_url: url }))).codigo).toBe("validacao");
    }
    expect(f.consultas).toHaveLength(2);
  });

  it("recusa campos protegidos sem chegar ao banco", async () => {
    const f = criarClienteFalso({ usuaria: EU });
    const s = servicoIdentidade(f.cliente);
    const tentativas = [
      { id: OUTRA },
      { papel: "prestadora" },
      { papel: null },
      { criado_em: "2000-01-01T00:00:00Z" },
      { atualizado_em: "2000-01-01T00:00:00Z" },
      { nome: "Ok", papel: "cliente" },
      { role: "service_role" },
      JSON.parse('{"__proto__": {"papel": "cliente"}, "nome": "x"}'),
    ];
    for (const dados of tentativas) {
      const erro = await falha(s.atualizarMeuPerfil(dados as never));
      expect(erro.codigo).toBe("validacao");
    }
    expect(f.consultas).toHaveLength(0);
  });

  it("campo herdado pelo protótipo não entra no update", async () => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: PERFIL, error: null }) });
    const dados = Object.create({ papel: "cliente", id: OUTRA });
    dados.nome = "Marina";
    await servicoIdentidade(f.cliente).atualizarMeuPerfil(dados);
    expect(argumentos(f.consultas[0], "update")).toEqual([[{ nome: "Marina" }]]);
  });

  it("valida limites dos CHECKs (nome 1–80, bio ≤ 500, cidade ≤ 100, avatar ≤ 2048)", async () => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: PERFIL, error: null }) });
    const s = servicoIdentidade(f.cliente);
    const invalidos = [
      { nome: "" },
      { nome: "   " },
      { nome: null },
      { nome: "x".repeat(81) },
      { bio: "x".repeat(501) },
      { cidade: "x".repeat(101) },
      { avatar_url: `https://x.com/${"a".repeat(2040)}` },
      { bio: 123 },
      {},
      { nome: undefined },
      [],
      null,
      "nome",
    ];
    for (const dados of invalidos) {
      expect((await falha(s.atualizarMeuPerfil(dados as never))).codigo).toBe("validacao");
    }
    // Limites exatos passam; emoji conta como 1 caractere, igual ao char_length.
    await s.atualizarMeuPerfil({ nome: "x".repeat(80), bio: "x".repeat(500), cidade: "x".repeat(100) });
    await s.atualizarMeuPerfil({ nome: "🙂".repeat(80) });
    expect(f.consultas).toHaveLength(2);
  });

  it("sem sessão: 'nao_autenticada' e nenhuma escrita", async () => {
    const f = criarClienteFalso({ usuaria: null });
    const erro = await falha(servicoIdentidade(f.cliente).atualizarMeuPerfil({ bio: "oi" }));
    expect(erro.codigo).toBe("nao_autenticada");
    expect(f.consultas).toHaveLength(0);
  });

  it("nenhuma linha alterada (RLS) vira 'nao_encontrado'", async () => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: null, error: null }) });
    const erro = await falha(servicoIdentidade(f.cliente).atualizarMeuPerfil({ bio: "oi" }));
    expect(erro.codigo).toBe("nao_encontrado");
  });
});

describe("erros do Supabase", () => {
  const casos: [string, string][] = [
    ["42501", "permissao"],
    ["23505", "conflito"],
    ["23514", "validacao"],
    ["22P02", "validacao"],
    ["PGRST301", "nao_autenticada"],
    ["", "indisponivel"],
    ["XX000", "desconhecido"],
  ];

  it.each(casos)("código %s vira '%s' sem expor a mensagem do banco", async (code, esperado) => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => erroPg(code) });
    const erro = await falha(servicoIdentidade(f.cliente).obterPerfil(EU));
    expect(erro.codigo).toBe(esperado);
    expect(erro.message).not.toMatch(/interna|detalhes|linha/);
    expect(erro.codigoBanco).toBe(code === "" ? null : code);
  });

  it("erro em listagens também é lançado (não vira lista vazia)", async () => {
    const f = criarClienteFalso({ responder: () => erroPg("XX000") });
    const s = servicoIdentidade(f.cliente);
    await falha(s.listarCategorias());
    await falha(s.listarServicosDaPrestadora(EU));
    await falha(s.listarFotosDaPrestadora(EU));
    await falha(s.listarPerfis([EU]));
  });

  it("erro na atualização do perfil: CHECK vira mensagem de perfil", async () => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => erroPg("23514") });
    const erro = await falha(servicoIdentidade(f.cliente).atualizarMeuPerfil({ nome: "Ok" }));
    expect(erro).toMatchObject({ codigo: "validacao", message: "Dados do perfil inválidos." });
  });
});

describe("categorias, serviços e fotos", () => {
  it("listarCategorias consulta categorias_servico em ordem de nome", async () => {
    const f = criarClienteFalso({ responder: () => ({ data: [{ id: 2, nome: "Elétrica" }], error: null }) });
    expect(await servicoIdentidade(f.cliente).listarCategorias()).toEqual([{ id: 2, nome: "Elétrica" }]);
    const [c] = f.consultas;
    expect(c.tabela).toBe("categorias_servico");
    expect(argumentos(c, "select")).toEqual([["id, nome"]]);
    expect(argumentos(c, "order")).toEqual([["nome", { ascending: true }]]);
  });

  it("listarServicosDaPrestadora filtra pela prestadora pedida", async () => {
    const linhas = SERVICOS_MOCK.filter((s) => s.prestadora_id === EU);
    const f = criarClienteFalso({ responder: () => ({ data: linhas, error: null }) });
    expect(await servicoIdentidade(f.cliente).listarServicosDaPrestadora(EU)).toEqual(linhas);
    expect(argumentos(f.consultas[0], "eq")).toEqual([["prestadora_id", EU]]);
  });

  it("listarFotosDaPrestadora filtra pela prestadora, em ordem de envio", async () => {
    const linhas = FOTOS_MOCK.filter((foto) => foto.prestadora_id === EU);
    const f = criarClienteFalso({ responder: () => ({ data: linhas, error: null }) });
    expect(await servicoIdentidade(f.cliente).listarFotosDaPrestadora(EU)).toEqual(linhas);
    const [c] = f.consultas;
    expect(c.tabela).toBe("fotos_portfolio");
    expect(argumentos(c, "select")).toEqual([["id, prestadora_id, caminho, criada_em"]]);
    expect(argumentos(c, "order")).toEqual([
      ["criada_em", { ascending: true }],
      ["id", { ascending: true }],
    ]);
  });

  it("listas com id inválido voltam vazias sem consultar", async () => {
    const f = criarClienteFalso();
    const s = servicoIdentidade(f.cliente);
    expect(await s.listarServicosDaPrestadora("x")).toEqual([]);
    expect(await s.listarFotosDaPrestadora("x")).toEqual([]);
    expect(f.consultas).toHaveLength(0);
  });

  it("adicionarMeuServico grava com o id da sessão", async () => {
    const novo = { prestadora_id: EU, categoria_id: 5, criado_em: "2026-11-22T00:00:00+00:00" };
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: novo, error: null }) });
    expect(await servicoIdentidade(f.cliente).adicionarMeuServico(5)).toEqual(novo);
    const [c] = f.consultas;
    expect(c.tabela).toBe("servicos_prestadora");
    expect(argumentos(c, "insert")).toEqual([[{ prestadora_id: EU, categoria_id: 5 }]]);
  });

  it.each([
    ["23514", "permissao"], // trigger exigir_prestadora (cliente)
    ["42501", "permissao"], // RLS de insert
    ["23505", "conflito"],
    ["23503", "validacao"], // categoria inexistente
  ])("adicionarMeuServico: código %s vira '%s'", async (code, esperado) => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => erroPg(code) });
    expect((await falha(servicoIdentidade(f.cliente).adicionarMeuServico(5))).codigo).toBe(esperado);
  });

  it("categoriaId inválido é recusado antes do banco", async () => {
    const f = criarClienteFalso({ usuaria: EU });
    const s = servicoIdentidade(f.cliente);
    for (const id of [0, -1, 1.5, Number.NaN, "1", null, 2 ** 60] as unknown as number[]) {
      expect((await falha(s.adicionarMeuServico(id))).codigo).toBe("validacao");
      expect((await falha(s.removerMeuServico(id))).codigo).toBe("validacao");
    }
    expect(f.consultas).toHaveLength(0);
  });

  it("removerMeuServico apaga só a linha da sessão; nada apagado vira 'nao_encontrado'", async () => {
    let apagou: unknown[] = [{ categoria_id: 1 }];
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: apagou, error: null }) });
    const s = servicoIdentidade(f.cliente);
    await s.removerMeuServico(1);
    const [c] = f.consultas;
    expect(metodos(c)).toContain("delete");
    expect(argumentos(c, "eq")).toEqual([
      ["prestadora_id", EU],
      ["categoria_id", 1],
    ]);
    apagou = [];
    expect((await falha(s.removerMeuServico(1))).codigo).toBe("nao_encontrado");
  });

  it("escritas sem sessão: 'nao_autenticada' e nada enviado", async () => {
    const f = criarClienteFalso({ usuaria: null });
    const s = servicoIdentidade(f.cliente);
    expect((await falha(s.adicionarMeuServico(1))).codigo).toBe("nao_autenticada");
    expect((await falha(s.removerMeuServico(1))).codigo).toBe("nao_autenticada");
    expect(f.consultas).toHaveLength(0);
  });

  it("leituras públicas funcionam sem sessão e não consultam o Auth", async () => {
    const f = criarClienteFalso({ usuaria: null, responder: () => ({ data: [], error: null }) });
    const s = servicoIdentidade(f.cliente);
    await s.listarCategorias();
    await s.obterPerfil(EU);
    await s.listarFotosDaPrestadora(EU);
    await s.listarServicosDaPrestadora(EU);
    expect(f.chamadasAuth).toBe(0);
  });
});

describe("identidade nunca vem de quem chama", () => {
  it("nenhuma escrita aceita id de usuária como parâmetro", async () => {
    const f = criarClienteFalso({ usuaria: EU, responder: () => ({ data: PERFIL, error: null }) });
    const s = servicoIdentidade(f.cliente);
    expect(s.atualizarMeuPerfil.length).toBe(1); // só os dados
    expect(s.adicionarMeuServico.length).toBe(1); // só a categoria
    expect(s.removerMeuServico.length).toBe(1);
    // Mesmo que alguém passe argumentos a mais, o filtro é o da sessão.
    await (s.adicionarMeuServico as (...a: unknown[]) => Promise<unknown>)(5, OUTRA).catch(() => {});
    const escritas: Consulta[] = f.consultas.filter((c) => metodos(c).includes("insert"));
    expect(argumentos(escritas[0], "insert")).toEqual([[{ prestadora_id: EU, categoria_id: 5 }]]);
  });
});
