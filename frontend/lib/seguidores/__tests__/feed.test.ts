// O feed junta quem eu sigo (seguidores) com as indicações (descoberta), no
// modo mock. A flag é lida quando o service carrega, por isso o import dinâmico.
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ID_CLIENTE_BEATRIZ,
  ID_CLIENTE_FERNANDA,
  ID_PRESTADORA_MARINA,
  definirUsuariaMock,
  redefinirMocks,
} from "@/lib/identidade/mocks";

vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");

beforeEach(async () => {
  redefinirMocks();
  (await import("../service-mock")).redefinirSeguidoresMock();
  (await import("@/lib/descoberta/service-mock")).redefinirAvaliacoesMock();
});

describe("listarIndicacoesDeQuemSigo", () => {
  it("mostra só indicações de quem eu sigo, mais recentes primeiro", async () => {
    const { listarIndicacoesDeQuemSigo, deixarDeSeguir } = await import("../service");
    definirUsuariaMock(ID_CLIENTE_BEATRIZ); // segue a Fernanda e a Marina

    const feed = await listarIndicacoesDeQuemSigo();
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.every((a) => a.clienteId === ID_CLIENTE_FERNANDA)).toBe(true);
    expect(feed.map((a) => a.criadaEm)).toEqual([...feed.map((a) => a.criadaEm)].sort().reverse());

    await deixarDeSeguir(ID_CLIENTE_FERNANDA);
    expect(await listarIndicacoesDeQuemSigo()).toEqual([]);
  });

  it("prestadora seguida não traz indicação (só cliente avalia)", async () => {
    const { listarIndicacoesDeQuemSigo } = await import("../service");
    definirUsuariaMock(ID_PRESTADORA_MARINA); // segue só a Joana
    expect(await listarIndicacoesDeQuemSigo()).toEqual([]);
  });
});
