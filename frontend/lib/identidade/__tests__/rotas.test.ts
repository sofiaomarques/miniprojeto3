// Mapa de rotas (lib/identidade/rotas.ts): links da navbar, rotas
// protegidas e o "voltar para onde estava" depois do login.
import { describe, expect, it } from "vitest";
import { ehRotaProtegida, linkAtivo, linksVisiveis, navLinks, proximaSegura } from "../rotas";

const rotulos = (links: { rotulo: string }[]) => links.map((l) => l.rotulo);

describe("navLinks", () => {
  it("tem os links das três áreas, sem href repetido", () => {
    expect(new Set(navLinks.map((l) => l.area))).toEqual(new Set(["P1", "P2", "P3"]));
    expect(new Set(navLinks.map((l) => l.href)).size).toBe(navLinks.length);
  });

  it("todo link que exige login aponta para uma rota protegida", () => {
    for (const link of navLinks.filter((l) => l.visivelPara !== "todas")) {
      expect(ehRotaProtegida(link.href)).toBe(true);
    }
  });
});

describe("linksVisiveis", () => {
  it("deslogada: só os públicos", () => {
    expect(rotulos(linksVisiveis(false, undefined))).toEqual(["Buscar"]);
  });

  it("logada sem papel (onboarding pendente): só os públicos", () => {
    expect(rotulos(linksVisiveis(true, null))).toEqual(["Buscar"]);
  });

  it("cliente vê Minhas indicações; prestadora não", () => {
    expect(rotulos(linksVisiveis(true, "cliente"))).toEqual([
      "Buscar",
      "Conversas",
      "Minhas indicações",
      "Meu perfil",
    ]);
    expect(rotulos(linksVisiveis(true, "prestadora"))).toEqual(["Buscar", "Conversas", "Meu perfil"]);
  });
});

describe("ehRotaProtegida", () => {
  it.each(["/perfil", "/perfil/editar", "/chat", "/chat/123", "/minhas-indicacoes", "/onboarding"])(
    "%s exige login",
    (caminho) => expect(ehRotaProtegida(caminho)).toBe(true),
  );

  it.each(["/", "/buscar", "/prestadoras/abc", "/entrar", "/cadastro", "/auth/callback", "/chatbot", "/perfis"])(
    "%s é pública (inclusive nomes parecidos com rotas protegidas)",
    (caminho) => expect(ehRotaProtegida(caminho)).toBe(false),
  );
});

describe("linkAtivo", () => {
  it("destaca a rota e as páginas abaixo dela, sem confundir prefixos", () => {
    expect(linkAtivo("/chat", "/chat")).toBe(true);
    expect(linkAtivo("/chat/42", "/chat")).toBe(true);
    expect(linkAtivo("/chatbot", "/chat")).toBe(false);
    expect(linkAtivo("/", "/buscar")).toBe(false);
  });
});

describe("proximaSegura", () => {
  it.each([
    ["/chat", "/chat"],
    ["/chat/123", "/chat/123"],
    ["/buscar?categoria=2&cidade=Recife", "/buscar?categoria=2&cidade=Recife"],
    ["/perfil#fotos", "/perfil"], // o # não vai junto
  ])("aceita caminho interno %s", (valor, esperado) => {
    expect(proximaSegura(valor)).toBe(esperado);
  });

  it.each([
    "https://site-malicioso.com",
    "//site-malicioso.com",
    "/\\site-malicioso.com",
    "\\\\site-malicioso.com",
    "javascript:alert(1)",
    "chat",
    "",
    "/chat\nSet-Cookie: x",
    `/${"a".repeat(600)}`,
    "/entrar", // páginas de conta não servem de destino
    "/cadastro",
    "/onboarding",
    "/auth/callback?code=x",
    null,
    42,
  ])("recusa %j", (valor) => {
    expect(proximaSegura(valor)).toBeNull();
  });
});
