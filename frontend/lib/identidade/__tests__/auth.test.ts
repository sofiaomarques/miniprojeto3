// Cadastro e login (lib/identidade/auth.ts) com um Supabase Auth falso.
import { describe, expect, it } from "vitest";
import {
  cadastrarConta,
  caminhoInterno,
  destinoAposLogin,
  entrarNaConta,
  lerCadastro,
  lerEntrada,
  mensagemErroAuth,
  MENSAGENS_AUTH,
  SENHA_MINIMA,
  validarConfirmacaoSenha,
  validarEmail,
  validarNome,
  validarSenhaNova,
  type ClienteAuth,
} from "../auth";

function formulario(campos: Record<string, string>): FormData {
  const form = new FormData();
  for (const [chave, valor] of Object.entries(campos)) form.set(chave, valor);
  return form;
}

const URL_CONFIRMACAO = "http://localhost:3000/auth/callback";
const SENHA = "senha-de-teste-123";

// Auth falso: guarda o que recebeu e devolve a resposta configurada.
function authFalso(resposta: { data?: unknown; error?: unknown; lancar?: unknown }) {
  const chamadas: { metodo: string; args: unknown }[] = [];
  const responder = async (metodo: string, args: unknown) => {
    chamadas.push({ metodo, args });
    if (resposta.lancar) throw resposta.lancar;
    return { data: resposta.data ?? { user: null, session: null }, error: resposta.error ?? null };
  };
  const auth = {
    signUp: (args: unknown) => responder("signUp", args),
    signInWithPassword: (args: unknown) => responder("signInWithPassword", args),
  } as unknown as ClienteAuth;
  return { auth, chamadas };
}

const erroAuth = (code: string, status = 400) => ({
  name: "AuthApiError",
  code,
  status,
  message: "mensagem interna do Supabase em inglês",
});

describe("lerCadastro", () => {
  it("aceita dados válidos, apara nome e e-mail e põe o e-mail em minúsculas", () => {
    const r = lerCadastro(
      formulario({ nome: "  Ana  ", email: " Ana@Exemplo.COM ", senha: SENHA, confirmacao: SENHA }),
    );
    expect(r).toEqual({ ok: true, dados: { nome: "Ana", email: "ana@exemplo.com", senha: SENHA } });
  });

  it("não apara a senha (espaço também conta)", () => {
    const senha = `  ${SENHA}  `;
    const r = lerCadastro(formulario({ nome: "Ana", email: "a@b.co", senha, confirmacao: senha }));
    expect(r.ok && r.dados.senha).toBe(senha);
  });

  it("confirmação diferente da senha é recusada (e a senha não volta para a tela)", () => {
    const r = lerCadastro(
      formulario({ nome: "Ana", email: "a@b.co", senha: SENHA, confirmacao: `${SENHA}x` }),
    );
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.estado.campos).toEqual({ confirmacao: "As senhas não são iguais." });
    expect(JSON.stringify(r.estado)).not.toContain(SENHA);
  });

  it("confirmação vazia pede para digitar a senha de novo", () => {
    const r = lerCadastro(formulario({ nome: "Ana", email: "a@b.co", senha: SENHA }));
    expect(!r.ok && r.estado.campos).toEqual({ confirmacao: "Digite a senha de novo." });
  });

  it("confirmação diferente da senha em maiúsculas/minúsculas também é recusada", () => {
    const r = lerCadastro(
      formulario({ nome: "Ana", email: "a@b.co", senha: SENHA, confirmacao: SENHA.toUpperCase() }),
    );
    expect(r.ok).toBe(false);
  });

  it("aponta o erro de cada campo e devolve nome e e-mail, nunca a senha", () => {
    const r = lerCadastro(formulario({ nome: " ", email: "sem-arroba", senha: "curta", confirmacao: "outra" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    // Com a senha curta, a confirmação nem é comparada (um aviso por vez).
    expect(r.estado.campos).toEqual({
      nome: "Informe seu nome.",
      email: "E-mail inválido.",
      senha: `A senha precisa ter pelo menos ${SENHA_MINIMA} caracteres.`,
    });
    expect(r.estado.valores).toEqual({ nome: "", email: "sem-arroba" });
    expect(JSON.stringify(r.estado)).not.toContain("curta");
  });

  it("limita nome a 80 caracteres e senha a 72", () => {
    const r = lerCadastro(formulario({ nome: "a".repeat(81), email: "a@b.co", senha: "x".repeat(73) }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.estado.campos?.nome).toMatch(/80/);
    expect(r.estado.campos?.senha).toMatch(/72/);
  });

  it("campos ausentes viram erro, não exceção", () => {
    const r = lerCadastro(new FormData());
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(Object.keys(r.estado.campos ?? {}).sort()).toEqual(["email", "nome", "senha"]);
  });
});

describe("lerEntrada", () => {
  it("exige e-mail válido e senha preenchida", () => {
    const r = lerEntrada(formulario({ email: "", senha: "" }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.estado.campos).toEqual({ email: "E-mail inválido.", senha: "Informe sua senha." });
  });

  it("não aplica o mínimo de senha no login (contas antigas continuam entrando)", () => {
    expect(lerEntrada(formulario({ email: "a@b.co", senha: "123" })).ok).toBe(true);
  });

  it("e-mail sem @ é inválido, como no cadastro", () => {
    const r = lerEntrada(formulario({ email: "anagmail.com", senha: "x" }));
    expect(!r.ok && r.estado.campos?.email).toBe("E-mail inválido.");
  });

  it("não pede confirmação de senha no login", () => {
    expect(lerEntrada(formulario({ email: "a@b.co", senha: SENHA })).ok).toBe(true);
  });
});

describe("validadores usados ao vivo pelos formulários", () => {
  it("validarSenhaNova", () => {
    expect(validarSenhaNova("")).toBe("Crie uma senha.");
    expect(validarSenhaNova("1234567")).toMatch(/pelo menos 8/);
    expect(validarSenhaNova("12345678")).toBeUndefined();
    expect(validarSenhaNova("x".repeat(73))).toMatch(/72/);
  });

  it("validarConfirmacaoSenha", () => {
    expect(validarConfirmacaoSenha(SENHA, "")).toBe("Digite a senha de novo.");
    expect(validarConfirmacaoSenha(SENHA, "outra")).toBe("As senhas não são iguais.");
    expect(validarConfirmacaoSenha(SENHA, SENHA)).toBeUndefined();
  });

  it("validarNome", () => {
    expect(validarNome("   ")).toBe("Informe seu nome.");
    expect(validarNome(" Ana ")).toBeUndefined();
  });

  it("validarEmail: só confere se tem @", () => {
    for (const email of ["ana@gmail.com", "  Ana@Gmail.COM ", "a@b"]) {
      expect(validarEmail(email)).toBeUndefined();
    }
    for (const email of ["", "   ", "anagmail.com", "ana.gmail.com"]) {
      expect(validarEmail(email)).toBe("E-mail inválido.");
    }
  });
});

describe("mensagemErroAuth", () => {
  it.each([
    ["invalid_credentials", MENSAGENS_AUTH.credenciais],
    ["email_not_confirmed", MENSAGENS_AUTH.emailNaoConfirmado],
    ["user_already_exists", MENSAGENS_AUTH.emailJaUsado],
    ["email_exists", MENSAGENS_AUTH.emailJaUsado],
    ["weak_password", MENSAGENS_AUTH.senhaFraca],
    ["email_address_invalid", MENSAGENS_AUTH.emailInvalido],
    ["validation_failed", MENSAGENS_AUTH.emailInvalido],
    ["over_email_send_rate_limit", MENSAGENS_AUTH.muitasTentativas],
    ["over_request_rate_limit", MENSAGENS_AUTH.muitasTentativas],
    ["signup_disabled", MENSAGENS_AUTH.cadastroDesligado],
  ])("%s vira mensagem em português", (code, mensagem) => {
    expect(mensagemErroAuth(erroAuth(code))).toBe(mensagem);
  });

  it("falha de rede vira 'sem conexão'", () => {
    expect(mensagemErroAuth({ name: "AuthRetryableFetchError", status: 0 })).toBe(
      MENSAGENS_AUTH.semConexao,
    );
  });

  it("status 429 sem código vira 'muitas tentativas'", () => {
    expect(mensagemErroAuth({ status: 429 })).toBe(MENSAGENS_AUTH.muitasTentativas);
  });

  it("erro desconhecido nunca repassa a mensagem crua", () => {
    for (const erro of [erroAuth("algo_novo", 500), new Error("detalhe interno"), null, "texto"]) {
      expect(mensagemErroAuth(erro)).toBe(MENSAGENS_AUTH.desconhecido);
    }
  });
});

describe("cadastrarConta", () => {
  const dados = { nome: "Ana", email: "ana@exemplo.com", senha: SENHA };

  it("manda só o nome nos metadados e o link de confirmação", async () => {
    const f = authFalso({ data: { user: { identities: [{}] }, session: null } });
    await cadastrarConta(f.auth, dados, URL_CONFIRMACAO);
    expect(f.chamadas).toEqual([
      {
        metodo: "signUp",
        args: {
          email: "ana@exemplo.com",
          password: SENHA,
          options: { data: { nome: "Ana" }, emailRedirectTo: URL_CONFIRMACAO },
        },
      },
    ]);
  });

  it("com sessão (confirmação de e-mail desligada) já entra", async () => {
    const f = authFalso({ data: { user: { identities: [{}] }, session: { access_token: "x" } } });
    expect(await cadastrarConta(f.auth, dados, URL_CONFIRMACAO)).toEqual({ tipo: "logada" });
  });

  it("sem sessão pede para confirmar o e-mail", async () => {
    const f = authFalso({ data: { user: { identities: [{}] }, session: null } });
    expect(await cadastrarConta(f.auth, dados, URL_CONFIRMACAO)).toEqual({ tipo: "confirmar_email" });
  });

  it("e-mail já usado com confirmação ligada (usuário sem identidades) vira erro claro", async () => {
    const f = authFalso({ data: { user: { identities: [] }, session: null } });
    expect(await cadastrarConta(f.auth, dados, URL_CONFIRMACAO)).toEqual({
      tipo: "erro",
      mensagem: MENSAGENS_AUTH.emailJaUsado,
    });
  });

  it("erro do Supabase vira mensagem traduzida", async () => {
    const f = authFalso({ error: erroAuth("user_already_exists", 422) });
    expect(await cadastrarConta(f.auth, dados, URL_CONFIRMACAO)).toEqual({
      tipo: "erro",
      mensagem: MENSAGENS_AUTH.emailJaUsado,
    });
  });

  it("exceção (rede) não escapa", async () => {
    const f = authFalso({ lancar: { name: "AuthRetryableFetchError", status: 0 } });
    expect(await cadastrarConta(f.auth, dados, URL_CONFIRMACAO)).toEqual({
      tipo: "erro",
      mensagem: MENSAGENS_AUTH.semConexao,
    });
  });
});

describe("entrarNaConta", () => {
  const dados = { email: "ana@exemplo.com", senha: SENHA };

  it("entra com e-mail e senha", async () => {
    const f = authFalso({ data: { user: { id: "x" }, session: {} } });
    expect(await entrarNaConta(f.auth, dados)).toEqual({ tipo: "logada" });
    expect(f.chamadas).toEqual([
      { metodo: "signInWithPassword", args: { email: "ana@exemplo.com", password: SENHA } },
    ]);
  });

  it("senha errada vira 'e-mail ou senha incorretos'", async () => {
    const f = authFalso({ error: erroAuth("invalid_credentials") });
    expect(await entrarNaConta(f.auth, dados)).toEqual({
      tipo: "erro",
      mensagem: MENSAGENS_AUTH.credenciais,
    });
  });

  it("e-mail não confirmado avisa para abrir o link", async () => {
    const f = authFalso({ error: erroAuth("email_not_confirmed") });
    expect(await entrarNaConta(f.auth, dados)).toEqual({
      tipo: "erro",
      mensagem: MENSAGENS_AUTH.emailNaoConfirmado,
    });
  });

  it("exceção (rede) não escapa", async () => {
    const f = authFalso({ lancar: new TypeError("fetch failed") });
    expect((await entrarNaConta(f.auth, dados)).tipo).toBe("erro");
  });
});

describe("caminhoInterno (?next= do login)", () => {
  it("aceita caminhos do próprio site, com busca e âncora", () => {
    expect(caminhoInterno("/minhas-indicacoes")).toBe("/minhas-indicacoes");
    expect(caminhoInterno("/prestadoras/abc?x=1#y")).toBe("/prestadoras/abc?x=1#y");
  });

  it("recusa qualquer coisa que leve para fora do site", () => {
    for (const valor of [
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "/\t/evil.com",
      "/\n/evil.com",
      "javascript:alert(1)",
      "evil.com",
      "",
      null,
      undefined,
      42,
    ]) {
      expect(caminhoInterno(valor)).toBeNull();
    }
  });
});

describe("destinoAposLogin", () => {
  it("com papel, usa o next interno; next externo ou ausente vai para o início", () => {
    expect(destinoAposLogin({ papel: "cliente" }, "/minhas-indicacoes")).toBe("/minhas-indicacoes");
    expect(destinoAposLogin({ papel: "cliente" }, "//evil.com")).toBe("/");
    expect(destinoAposLogin({ papel: "cliente" }, null)).toBe("/");
  });

  it("sem papel, vai para o onboarding mesmo com next", () => {
    expect(destinoAposLogin({ papel: null }, "/minhas-indicacoes")).toBe("/onboarding");
  });

  it("sem papel vai para o onboarding; com papel, para o início", () => {
    expect(destinoAposLogin({ papel: null })).toBe("/onboarding");
    expect(destinoAposLogin(null)).toBe("/onboarding");
    expect(destinoAposLogin({ papel: "cliente" })).toBe("/");
    expect(destinoAposLogin({ papel: "prestadora" })).toBe("/");
  });
});
