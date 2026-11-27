// Rotas protegidas (lib/identidade/rotas.ts), usadas pelo middleware.
import { describe, expect, it } from "vitest";
import { ehRotaProtegida } from "../rotas";

describe("ehRotaProtegida", () => {
  it.each([
    "/perfil",
    "/perfil/editar",
    "/perfil/fotos",
    "/perfil/precos",
    "/chat",
    "/chat/123",
    "/minhas-indicacoes",
    "/avaliar/ana",
    "/pessoas",
    "/pessoas/abc/seguidores",
  ])(
    "%s exige login",
    (caminho) => expect(ehRotaProtegida(caminho)).toBe(true),
  );

  it.each(["/", "/buscar", "/prestadoras/abc", "/entrar", "/cadastro", "/onboarding", "/auth/callback", "/chatbot", "/perfis", "/pessoal"])(
    "%s é pública (inclusive nomes parecidos com rotas protegidas)",
    (caminho) => expect(ehRotaProtegida(caminho)).toBe(false),
  );
});
