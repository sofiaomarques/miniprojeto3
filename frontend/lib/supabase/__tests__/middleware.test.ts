// Guarda de rotas do middleware (lib/supabase/middleware.ts) com um
// Supabase falso: sessão, perfil e renovação de cookies simulados.
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
  process.env.NEXT_PUBLIC_USE_MOCKS = "false";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://exemplo.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_teste";
  delete process.env.NEXT_PUBLIC_VERCEL_ENV;
});

type Cenario = {
  usuaria: string | null;
  papel?: "cliente" | "prestadora" | null;
  erroPerfil?: boolean;
  renovarCookie?: boolean; // simula o Supabase trocando o token expirado
};

let cenario: Cenario = { usuaria: null };
let consultasPerfil = 0;

vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _chave: string,
    opcoes: {
      cookies: {
        setAll: (c: { name: string; value: string; options: object }[], h: Record<string, string>) => void;
      };
    },
  ) => ({
    auth: {
      async getClaims() {
        if (cenario.renovarCookie) {
          opcoes.cookies.setAll([{ name: "sb-token", value: "novo", options: { path: "/" } }], {
            "Cache-Control": "private, no-store",
          });
        }
        return cenario.usuaria
          ? { data: { claims: { sub: cenario.usuaria } }, error: null }
          : { data: null, error: null };
      },
    },
    from(tabela: string) {
      expect(tabela).toBe("perfis");
      const consulta = {
        select: () => consulta,
        eq: (coluna: string, valor: string) => {
          expect([coluna, valor]).toEqual(["id", cenario.usuaria]);
          return consulta;
        },
        maybeSingle: async () => {
          consultasPerfil++;
          if (cenario.erroPerfil) return { data: null, error: { code: "500", message: "falhou" } };
          return { data: { papel: cenario.papel ?? null }, error: null };
        },
      };
      return consulta;
    },
  }),
}));

import { atualizarSessao } from "../middleware";

const EU = "00000000-0000-4000-8000-0000000000c1";
const pedir = (caminho: string) => atualizarSessao(new NextRequest(`http://localhost:3000${caminho}`));
const destino = (r: Response) => {
  const local = r.headers.get("location");
  return local ? new URL(local).pathname + new URL(local).search : null;
};

beforeEach(() => {
  cenario = { usuaria: null };
  consultasPerfil = 0;
});

describe("rotas públicas", () => {
  it.each(["/", "/buscar", "/prestadoras/abc", "/p/ana", "/entrar", "/cadastro", "/onboarding", "/auth/callback"])(
    "%s passa sem login e sem consultar o banco",
    async (caminho) => {
      const r = await pedir(caminho);
      expect(destino(r)).toBeNull();
      expect(consultasPerfil).toBe(0);
    },
  );

  it("logada sem papel navega pelas públicas (não consulta o perfil)", async () => {
    cenario = { usuaria: EU, papel: null };
    expect(destino(await pedir("/buscar"))).toBeNull();
    expect(consultasPerfil).toBe(0);
  });
});

describe("rotas protegidas", () => {
  it("sem login vai para /entrar guardando a página pedida", async () => {
    const r = await pedir("/chat/123?aba=fotos");
    expect(r.status).toBe(307);
    expect(destino(r)).toBe("/entrar?next=%2Fchat%2F123%3Faba%3Dfotos");
  });

  it.each(["/perfil", "/chat", "/minhas-indicacoes", "/avaliar/ana"])(
    "%s sem login também vai para /entrar",
    async (caminho) => {
      expect(destino(await pedir(caminho))?.startsWith("/entrar?next=")).toBe(true);
    },
  );

  it("logada com papel entra", async () => {
    cenario = { usuaria: EU, papel: "cliente" };
    expect(destino(await pedir("/chat"))).toBeNull();
    expect(consultasPerfil).toBe(1);
  });

  it("logada sem papel vai para o onboarding", async () => {
    cenario = { usuaria: EU, papel: null };
    expect(destino(await pedir("/perfil"))).toBe("/onboarding");
  });

  it("/onboarding é público para o middleware (sem laço): a própria página cuida", async () => {
    cenario = { usuaria: EU, papel: null };
    expect(destino(await pedir("/onboarding"))).toBeNull();
    expect(consultasPerfil).toBe(0);
  });

  it("erro do banco ao ler o papel deixa passar (a página trata)", async () => {
    cenario = { usuaria: EU, erroPerfil: true };
    expect(destino(await pedir("/chat"))).toBeNull();
  });
});

describe("cookies renovados", () => {
  it("sem redirecionamento: vão na resposta", async () => {
    cenario = { usuaria: EU, papel: "prestadora", renovarCookie: true };
    const r = await pedir("/perfil");
    expect(r.headers.get("set-cookie")).toContain("sb-token=novo");
  });

  it("com redirecionamento: vão junto, para a sessão não cair", async () => {
    cenario = { usuaria: EU, papel: null, renovarCookie: true };
    const r = await pedir("/chat");
    expect(destino(r)).toBe("/onboarding");
    expect(r.headers.get("set-cookie")).toContain("sb-token=novo");
    expect(r.headers.get("cache-control")).toBe("private, no-store");
  });
});
