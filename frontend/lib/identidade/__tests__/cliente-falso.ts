// Cliente Supabase de mentira para testar o service sem rede. Grava cada
// consulta (tabela + métodos chamados) e devolve a resposta configurada.
import type { ClienteSupabase } from "../service";

export type Chamada = { metodo: string; args: unknown[] };
export type Consulta = { tabela: string; chamadas: Chamada[] };
export type RespostaFalsa = { data: unknown; error: unknown };

type Opcoes = {
  // id da usuária logada; null = sem sessão.
  usuaria?: string | null;
  // erro devolvido por auth.getClaims (sobrepõe `usuaria`).
  erroAuth?: { name: string; status?: number; message: string };
  responder?: (consulta: Consulta) => RespostaFalsa;
};

const METODOS = ["select", "eq", "in", "is", "order", "update", "insert", "delete", "maybeSingle", "single"];

export function criarClienteFalso(opcoes: Opcoes = {}) {
  const consultas: Consulta[] = [];
  let chamadasAuth = 0;
  const responder = opcoes.responder ?? (() => ({ data: [], error: null }));

  function construtor(consulta: Consulta) {
    const alvo: Record<string, unknown> = {
      then(resolver: (r: RespostaFalsa) => unknown, rejeitar?: (e: unknown) => unknown) {
        return Promise.resolve()
          .then(() => responder(consulta))
          .then(resolver, rejeitar);
      },
    };
    for (const metodo of METODOS) {
      alvo[metodo] = (...args: unknown[]) => {
        consulta.chamadas.push({ metodo, args });
        return alvo;
      };
    }
    return alvo;
  }

  const cliente = {
    from(tabela: string) {
      const consulta: Consulta = { tabela, chamadas: [] };
      consultas.push(consulta);
      return construtor(consulta);
    },
    auth: {
      // Mesmo formato do getClaims real: sem sessão, data e error vêm null.
      async getClaims() {
        chamadasAuth++;
        if (opcoes.erroAuth) return { data: null, error: opcoes.erroAuth };
        const id = opcoes.usuaria ?? null;
        if (!id) return { data: null, error: null };
        return { data: { claims: { sub: id, role: "authenticated" } }, error: null };
      },
    },
  };

  return {
    cliente: cliente as unknown as ClienteSupabase,
    consultas,
    get chamadasAuth() {
      return chamadasAuth;
    },
  };
}

// Atalhos para ler o que o service pediu ao banco.
export const metodos = (c: Consulta) => c.chamadas.map((ch) => ch.metodo);
export const argumentos = (c: Consulta, metodo: string) =>
  c.chamadas.filter((ch) => ch.metodo === metodo).map((ch) => ch.args);
