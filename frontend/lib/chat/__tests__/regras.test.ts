// Regras puras do chat (lib/chat/types.ts e service.ts): juntar mensagens sem
// duplicar, ordenar conversas e contar caracteres como o Postgres.
import { describe, expect, it } from "vitest";

import { contarCaracteres, validarTexto } from "../service";
import { type Conversa, juntarMensagens, type Mensagem, ordenarConversas } from "../types";

function msg(id: number, criadaEm: string): Mensagem {
  return { id, conversaId: 1, autorId: "a", texto: `m${id}`, criadaEm, lidaEm: null };
}

describe("juntarMensagens", () => {
  const lista = [msg(1, "2026-11-25T10:00:00Z"), msg(2, "2026-11-25T10:01:00Z")];

  it("acrescenta a mensagem nova no fim", () => {
    const nova = msg(3, "2026-11-25T10:02:00Z");
    expect(juntarMensagens(lista, nova).map((m) => m.id)).toEqual([1, 2, 3]);
  });

  it("não duplica a mesma mensagem (resposta do insert + evento do Realtime)", () => {
    const repetida = msg(2, "2026-11-25T10:01:00Z");
    const resultado = juntarMensagens(lista, repetida);
    expect(resultado.map((m) => m.id)).toEqual([1, 2]);
    expect(resultado).toBe(lista); // nada mudou: mesma referência, sem re-render
  });

  it("põe na ordem certa uma mensagem que chegou atrasada", () => {
    const atrasada = msg(5, "2026-11-25T10:00:30Z");
    expect(juntarMensagens(lista, atrasada).map((m) => m.id)).toEqual([1, 5, 2]);
  });

  it("desempata pelo id quando o horário é igual", () => {
    const mesmaHora = msg(0, "2026-11-25T10:01:00Z");
    expect(juntarMensagens(lista, mesmaHora).map((m) => m.id)).toEqual([1, 0, 2]);
  });

  it("não altera a lista recebida", () => {
    const copia = [...lista];
    juntarMensagens(lista, msg(3, "2026-11-25T10:02:00Z"));
    expect(lista).toEqual(copia);
  });
});

describe("ordenarConversas", () => {
  function conversa(id: number, criadaEm: string, ultimaMensagemEm: string | null): Conversa {
    return {
      id,
      clienteId: "c",
      prestadoraId: "p",
      criadaEm,
      ultimaMensagemEm,
      outra: { id: "p", nome: "P", avatarUrl: null, papel: "prestadora" },
      ultimaMensagem: null,
      naoLidas: 0,
    };
  }

  it("mensagem mais recente primeiro; conversas sem mensagem no fim, mais novas antes", () => {
    const lista = [
      conversa(1, "2026-11-20T00:00:00Z", "2026-11-21T00:00:00Z"),
      conversa(2, "2026-11-24T00:00:00Z", null),
      conversa(3, "2026-11-19T00:00:00Z", "2026-11-25T00:00:00Z"),
      conversa(4, "2026-11-22T00:00:00Z", null),
    ];
    expect(ordenarConversas(lista).map((c) => c.id)).toEqual([3, 1, 2, 4]);
  });
});

describe("limite de 2000 caracteres", () => {
  it("emoji conta 1 caractere, como o char_length do Postgres", () => {
    expect(contarCaracteres("oi 👋")).toBe(4);
    expect("oi 👋".length).toBe(5); // o .length do JS contaria 5
  });

  it("aceita 2000 emojis e recusa 2001", () => {
    expect(() => validarTexto("😀".repeat(2000))).not.toThrow();
    expect(() => validarTexto("😀".repeat(2001))).toThrow(/2000/);
  });

  it("recusa mensagem só com espaços e quebras de linha", () => {
    expect(() => validarTexto(" \n\t ")).toThrow();
  });
});
