// Integração com um Supabase LOCAL (supabase start) que tenha a 01 aplicada.
// Fica pulado sem as variáveis abaixo, e se recusa a rodar fora de localhost.
//
//   IDENTIDADE_TESTE_SUPABASE_URL=http://127.0.0.1:54321 \
//   IDENTIDADE_TESTE_SUPABASE_CHAVE=<publishable key do `supabase status`> \
//   npm test
//
// Cria três contas descartáveis (cliente, duas prestadoras) e confere, com o
// service e com o cliente cru, que a RLS e os triggers seguram o que devem.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { beforeAll, describe, expect, it, vi } from "vitest";
import type { ErroIdentidade } from "../erros";
import type { ServicoIdentidade } from "../types";

const URL_TESTE = process.env.IDENTIDADE_TESTE_SUPABASE_URL ?? "";
const CHAVE_TESTE = process.env.IDENTIDADE_TESTE_SUPABASE_CHAVE ?? "";
const configurado = URL_TESTE !== "" && CHAVE_TESTE !== "";

function exigirAmbienteLocal() {
  const host = new URL(URL_TESTE).hostname;
  if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
    throw new Error("Integração só roda contra Supabase local (localhost).");
  }
  if (!CHAVE_TESTE.startsWith("sb_publishable_")) {
    throw new Error("Use a publishable key local, nunca a secret/service_role.");
  }
}

const novoCliente = () =>
  createClient(URL_TESTE, CHAVE_TESTE, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

type Conta = { id: string; cliente: SupabaseClient };

async function criarConta(rotulo: string, nome: string): Promise<Conta> {
  const cliente = novoCliente();
  const email = `p1-13-${rotulo}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const { data, error } = await cliente.auth.signUp({
    email,
    password: `Senha-${Math.random().toString(36).slice(2)}-forte!`,
    options: { data: { nome } },
  });
  if (error || !data.session || !data.user) throw new Error(`signUp falhou: ${error?.message}`);
  return { id: data.user.id, cliente };
}

// Preparação do teste (o onboarding é da #14): define o papel direto no banco,
// como a própria usuária, o que a 01 permite uma única vez.
async function definirPapel(conta: Conta, papel: "cliente" | "prestadora") {
  const { error } = await conta.cliente.from("perfis").update({ papel }).eq("id", conta.id);
  if (error) throw new Error(`definir papel falhou: ${error.code}`);
}

async function carregar(flag: "true" | "false") {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", flag);
  vi.stubEnv("NEXT_PUBLIC_VERCEL_ENV", "");
  return { ...(await import("../service")), ...(await import("../mocks")) };
}

async function codigo(promessa: Promise<unknown>): Promise<string> {
  try {
    await promessa;
    return "ok";
  } catch (erro) {
    return (erro as ErroIdentidade).codigo ?? `erro cru: ${String(erro)}`;
  }
}

describe.skipIf(!configurado)("integração com Supabase local", () => {
  let real: Awaited<ReturnType<typeof carregar>>;
  let cliente: Conta; // papel cliente
  let bia: Conta; // prestadora
  let cris: Conta; // prestadora
  let semPapel: Conta;
  let anonima: ServicoIdentidade;
  let svcCliente: ServicoIdentidade;
  let svcBia: ServicoIdentidade;
  let svcCris: ServicoIdentidade;

  beforeAll(async () => {
    exigirAmbienteLocal();
    real = await carregar("false");
    [cliente, bia, cris, semPapel] = await Promise.all([
      criarConta("cliente", "Ana Teste"),
      criarConta("bia", "Bia Teste"),
      criarConta("cris", "Cris Teste"),
      criarConta("sempapel", ""),
    ]);
    await definirPapel(cliente, "cliente");
    await definirPapel(bia, "prestadora");
    await definirPapel(cris, "prestadora");
    anonima = real.servicoIdentidade(novoCliente());
    svcCliente = real.servicoIdentidade(cliente.cliente);
    svcBia = real.servicoIdentidade(bia.cliente);
    svcCris = real.servicoIdentidade(cris.cliente);
  }, 60_000);

  describe("leitura", () => {
    it("perfil existente e inexistente, inclusive sem login", async () => {
      const perfil = await anonima.obterPerfil(bia.id);
      expect(perfil).toMatchObject({ id: bia.id, papel: "prestadora", nome: "Bia Teste" });
      expect(Object.keys(perfil!).sort()).toEqual([...real.COLUNAS_PERFIL].sort());
      expect(await anonima.obterPerfil("99999999-9999-4999-8999-999999999999")).toBeNull();
      expect(await anonima.obterPerfil("nao-e-uuid")).toBeNull();
    });

    it("perfil antes do onboarding: papel e nome null", async () => {
      const perfil = await real.servicoIdentidade(semPapel.cliente).obterMeuPerfil();
      expect(perfil).toMatchObject({ id: semPapel.id, papel: null, nome: null });
    });

    it("listarPerfis ignora inválidos e repetidos, em ordem de id", async () => {
      const perfis = await anonima.listarPerfis([cris.id, bia.id, "lixo", bia.id]);
      expect(perfis.map((p) => p.id)).toEqual([bia.id, cris.id].sort());
    });

    it("categorias: o seed da 01, igual ao mock", async () => {
      const mock = await carregar("true");
      expect(await anonima.listarCategorias()).toEqual(await mock.servicoIdentidade(null).listarCategorias());
    });

    it("RLS de leitura: só prestadoras são públicas; cliente e sem papel só para a dona", async () => {
      const svcSemPapel = real.servicoIdentidade(semPapel.cliente);
      // Quem não é a dona não vê cliente nem conta sem papel.
      for (const svc of [anonima, svcBia, svcCris]) {
        expect(await svc.obterPerfil(cliente.id)).toBeNull();
        expect(await svc.obterPerfil(semPapel.id)).toBeNull();
        expect((await svc.obterPerfil(bia.id))?.id).toBe(bia.id);
      }
      expect(await svcSemPapel.obterPerfil(cliente.id)).toBeNull();
      expect(await svcCliente.obterPerfil(semPapel.id)).toBeNull();
      // A dona vê o próprio perfil.
      expect((await svcCliente.obterPerfil(cliente.id))?.id).toBe(cliente.id);
      expect((await svcSemPapel.obterPerfil(semPapel.id))?.id).toBe(semPapel.id);
      // listarPerfis segue a mesma regra.
      const ids = [bia.id, cliente.id, semPapel.id];
      expect((await anonima.listarPerfis(ids)).map((p) => p.id)).toEqual([bia.id]);
      expect((await svcCliente.listarPerfis(ids)).map((p) => p.id).sort()).toEqual(
        [bia.id, cliente.id].sort(),
      );
    });

    it("obterMeuPerfil: null deslogada, o próprio perfil logada", async () => {
      expect(await anonima.obterMeuPerfil()).toBeNull();
      expect((await svcCliente.obterMeuPerfil())?.id).toBe(cliente.id);
      expect((await svcBia.obterMeuPerfil())?.id).toBe(bia.id);
    });
  });

  describe("atualizarMeuPerfil", () => {
    it("altera os campos permitidos da própria conta", async () => {
      const antes = (await svcCliente.obterMeuPerfil())!;
      const depois = await svcCliente.atualizarMeuPerfil({
        nome: "  Ana Atualizada ",
        bio: "Cliente de teste",
        cidade: "João Pessoa",
        avatar_url: "https://exemplo.com/ana.png",
      });
      expect(depois).toMatchObject({
        id: cliente.id,
        papel: "cliente",
        nome: "Ana Atualizada",
        bio: "Cliente de teste",
        cidade: "João Pessoa",
        avatar_url: "https://exemplo.com/ana.png",
        criado_em: antes.criado_em,
      });
      expect(Date.parse(depois.atualizado_em)).toBeGreaterThanOrEqual(Date.parse(antes.atualizado_em));
      expect(await svcCliente.obterPerfil(cliente.id)).toEqual(depois);
    });

    it("deslogada não altera nada", async () => {
      expect(await codigo(anonima.atualizarMeuPerfil({ bio: "x" }))).toBe("nao_autenticada");
    });

    it("campo protegido é recusado pelo service", async () => {
      for (const dados of [{ papel: "prestadora" }, { id: bia.id }, { criado_em: "2000-01-01T00:00:00Z" }]) {
        expect(await codigo(svcCliente.atualizarMeuPerfil(dados as never))).toBe("validacao");
      }
      expect((await svcCliente.obterMeuPerfil())?.papel).toBe("cliente");
    });
  });

  describe("serviços da prestadora", () => {
    it("prestadora adiciona e remove os próprios serviços", async () => {
      const novo = await svcBia.adicionarMeuServico(5);
      expect(novo).toMatchObject({ prestadora_id: bia.id, categoria_id: 5 });
      expect(Object.keys(novo).sort()).toEqual([...real.COLUNAS_SERVICO].sort());
      expect(await codigo(svcBia.adicionarMeuServico(5))).toBe("conflito");
      expect(await codigo(svcBia.adicionarMeuServico(999_999))).toBe("validacao");

      // Leitura pública: a cliente (e a anônima) veem os serviços da Bia.
      expect((await anonima.listarServicosDaPrestadora(bia.id)).map((s) => s.categoria_id)).toEqual([5]);

      await svcBia.removerMeuServico(5);
      expect(await codigo(svcBia.removerMeuServico(5))).toBe("nao_encontrado");
      expect(await anonima.listarServicosDaPrestadora(bia.id)).toEqual([]);
    });

    it("cliente, conta sem papel e anônima não cadastram serviço", async () => {
      expect(await codigo(svcCliente.adicionarMeuServico(1))).toBe("permissao");
      expect(await codigo(real.servicoIdentidade(semPapel.cliente).adicionarMeuServico(1))).toBe("permissao");
      expect(await codigo(anonima.adicionarMeuServico(1))).toBe("nao_autenticada");
    });

    it("uma prestadora não remove o serviço da outra", async () => {
      await svcBia.adicionarMeuServico(2);
      // Pelo service: Cris só alcança as próprias linhas.
      expect(await codigo(svcCris.removerMeuServico(2))).toBe("nao_encontrado");
      expect((await anonima.listarServicosDaPrestadora(bia.id)).map((s) => s.categoria_id)).toEqual([2]);
      await svcBia.removerMeuServico(2);
    });
  });

  describe("fotos do portfólio (só leitura; escrita é da #17)", () => {
    it("lista as fotos da prestadora no formato do tipo", async () => {
      expect(await anonima.listarFotosDaPrestadora(bia.id)).toEqual([]);
      // Preparação: a Bia insere o registro direto (o upload é da #17).
      const { error } = await bia.cliente
        .from("fotos_portfolio")
        .insert({ prestadora_id: bia.id, caminho: `${bia.id}/teste.jpg` });
      expect(error).toBeNull();
      const fotos = await anonima.listarFotosDaPrestadora(bia.id);
      expect(fotos).toHaveLength(1);
      expect(fotos[0]).toMatchObject({ prestadora_id: bia.id, caminho: `${bia.id}/teste.jpg` });
      expect(Object.keys(fotos[0]).sort()).toEqual([...real.COLUNAS_FOTO].sort());
      expect(typeof fotos[0].id).toBe("number");
    });
  });

  // Mesmo indo direto ao banco (sem o service), uma conta não mexe na outra.
  describe("RLS entre duas contas, com o cliente cru", () => {
    it("cliente não altera o perfil da prestadora", async () => {
      const { data, error } = await cliente.cliente
        .from("perfis")
        .update({ bio: "invadido" })
        .eq("id", bia.id)
        .select("id");
      expect(error).toBeNull();
      expect(data).toEqual([]); // RLS filtrou: zero linhas
      expect((await anonima.obterPerfil(bia.id))?.bio).not.toBe("invadido");
    });

    it("papel já definido não muda; id e criado_em não mudam", async () => {
      const papel = await cliente.cliente.from("perfis").update({ papel: "prestadora" }).eq("id", cliente.id);
      expect(papel.error?.code).toBe("42501");
      const criado = await cliente.cliente
        .from("perfis")
        .update({ criado_em: "2000-01-01T00:00:00Z" })
        .eq("id", cliente.id);
      expect(criado.error?.code).toBe("42501"); // sem GRANT na coluna
      const id = await cliente.cliente.from("perfis").update({ id: bia.id }).eq("id", cliente.id);
      expect(id.error?.code).toBe("42501");
      expect((await svcCliente.obterMeuPerfil())?.papel).toBe("cliente");
    });

    it("prestadora não insere nem apaga serviço/foto em nome da outra", async () => {
      const servico = await cris.cliente
        .from("servicos_prestadora")
        .insert({ prestadora_id: bia.id, categoria_id: 3 });
      expect(servico.error?.code).toBe("42501");

      const foto = await cris.cliente
        .from("fotos_portfolio")
        .insert({ prestadora_id: bia.id, caminho: `${bia.id}/intrusa.jpg` });
      expect(foto.error?.code).toBe("42501");

      const apagou = await cris.cliente.from("fotos_portfolio").delete().eq("prestadora_id", bia.id).select("id");
      expect(apagou.data).toEqual([]);
      expect(await anonima.listarFotosDaPrestadora(bia.id)).toHaveLength(1);
    });

    it("anônima não escreve em nenhuma tabela", async () => {
      const anon = novoCliente();
      const perfis = await anon.from("perfis").update({ bio: "x" }).eq("id", bia.id).select("id");
      expect(perfis.error?.code ?? (perfis.data?.length === 0 ? "0 linhas" : "alterou")).not.toBe("alterou");
      const servico = await anon.from("servicos_prestadora").insert({ prestadora_id: bia.id, categoria_id: 1 });
      expect(servico.error?.code).toBe("42501");
      const categoria = await anon.from("categorias_servico").insert({ nome: "Invasora" });
      expect(categoria.error?.code).toBe("42501");
    });
  });

  describe("mesmo contrato do mock", () => {
    it("os mesmos cenários dão os mesmos códigos de erro nos dois modos", async () => {
      const mock = await carregar("true");
      const svcMock = mock.servicoIdentidade(null);
      const comoMock = (id: string | null) => mock.definirUsuariaMock(id);

      // [descrição, conta no mock, serviço real, operação]
      const cenarios: [string, string | null, ServicoIdentidade, (s: ServicoIdentidade) => Promise<unknown>][] = [
        ["deslogada atualiza", null, anonima, (s) => s.atualizarMeuPerfil({ bio: "x" })],
        ["deslogada adiciona serviço", null, anonima, (s) => s.adicionarMeuServico(1)],
        ["deslogada remove serviço", null, anonima, (s) => s.removerMeuServico(1)],
        ["cliente adiciona serviço", mock.ID_CLIENTE_BEATRIZ, svcCliente, (s) => s.adicionarMeuServico(1)],
        ["sem papel adiciona serviço", mock.ID_SEM_PAPEL, real.servicoIdentidade(semPapel.cliente), (s) => s.adicionarMeuServico(1)],
        ["categoria inexistente", mock.ID_PRESTADORA_MARINA, svcBia, (s) => s.adicionarMeuServico(999_999)],
        ["remove serviço que não tem", mock.ID_PRESTADORA_MARINA, svcBia, (s) => s.removerMeuServico(8)],
        ["campo protegido", mock.ID_PRESTADORA_MARINA, svcBia, (s) => s.atualizarMeuPerfil({ papel: "cliente" } as never)],
        ["nome vazio", mock.ID_PRESTADORA_MARINA, svcBia, (s) => s.atualizarMeuPerfil({ nome: " " })],
        ["atualização válida", mock.ID_PRESTADORA_MARINA, svcBia, (s) => s.atualizarMeuPerfil({ cidade: "Natal" })],
        ["adiciona serviço novo", mock.ID_PRESTADORA_MARINA, svcBia, (s) => s.adicionarMeuServico(6)],
        ["adiciona repetido", mock.ID_PRESTADORA_MARINA, svcBia, (s) => s.adicionarMeuServico(6)],
        ["remove o novo", mock.ID_PRESTADORA_MARINA, svcBia, (s) => s.removerMeuServico(6)],
      ];

      for (const [descricao, contaMock, svcReal, operacao] of cenarios) {
        comoMock(contaMock);
        const [r, m] = [await codigo(operacao(svcReal)), await codigo(operacao(svcMock))];
        expect({ descricao, real: r }).toEqual({ descricao, real: m });
      }
    });

    it("as respostas têm as mesmas chaves e tipos nos dois modos", async () => {
      const m = await carregar("true");
      const mock = m.servicoIdentidade(null);
      const formato = (v: unknown) =>
        Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, x === null ? "null|*" : typeof x]));
      const compativel = (a: Record<string, string>, b: Record<string, string>) =>
        Object.keys(a).sort().join() === Object.keys(b).sort().join() &&
        Object.keys(a).every((k) => a[k] === b[k] || a[k] === "null|*" || b[k] === "null|*");

      const pares: [unknown, unknown][] = [
        [await svcBia.obterMeuPerfil(), await mock.obterMeuPerfil()],
        [(await anonima.listarCategorias())[0], (await mock.listarCategorias())[0]],
        [
          (await anonima.listarFotosDaPrestadora(bia.id))[0],
          (await mock.listarFotosDaPrestadora(m.ID_PRESTADORA_MARINA))[0],
        ],
      ];
      for (const [doReal, doMock] of pares) {
        expect(doReal).toBeTruthy();
        expect(compativel(formato(doReal), formato(doMock))).toBe(true);
      }
    });
  });
});
