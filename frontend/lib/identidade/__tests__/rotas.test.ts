// Mapa de rotas (lib/identidade/rotas.ts): links da navbar, rotas
// protegidas e link ativo.
import { describe, expect, it } from "vitest";
import { ehRotaProtegida, linkAtivo, linksVisiveis, navLinks } from "../rotas";

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

  it("cliente e prestadora veem os mesmos links (indicações ficam no perfil)", () => {
    expect(rotulos(linksVisiveis(true, "cliente"))).toEqual(["Buscar", "Conversas", "Meu perfil"]);
    expect(rotulos(linksVisiveis(true, "prestadora"))).toEqual(["Buscar", "Conversas", "Meu perfil"]);
  });

  it("nenhum link aponta para as rotas antigas, que só redirecionam", () => {
    const hrefs = navLinks.map((l) => l.href);
    for (const antiga of ["/buscar", "/minhas-indicacoes", "/login"]) {
      expect(hrefs).not.toContain(antiga);
    }
  });
});

describe("ehRotaProtegida", () => {
  it.each(["/perfil", "/perfil/editar", "/chat", "/chat/123", "/minhas-indicacoes", "/avaliar/ana"])(
    "%s exige login",
    (caminho) => expect(ehRotaProtegida(caminho)).toBe(true),
  );

  it.each(["/", "/buscar", "/prestadoras/abc", "/entrar", "/cadastro", "/onboarding", "/auth/callback", "/chatbot", "/perfis"])(
    "%s é pública (inclusive nomes parecidos com rotas protegidas)",
    (caminho) => expect(ehRotaProtegida(caminho)).toBe(false),
  );
});

describe("linkAtivo", () => {
  it("destaca a rota e as páginas abaixo dela, sem confundir prefixos", () => {
    expect(linkAtivo("/chat", "/chat")).toBe(true);
    expect(linkAtivo("/chat/42", "/chat")).toBe(true);
    expect(linkAtivo("/chatbot", "/chat")).toBe(false);
    expect(linkAtivo("/perfil", "/p")).toBe(false);
  });

  it("Buscar (/) só fica ativo na página inicial", () => {
    expect(linkAtivo("/", "/")).toBe(true);
    expect(linkAtivo("/chat", "/")).toBe(false);
    expect(linkAtivo("/perfil", "/")).toBe(false);
  });
});
