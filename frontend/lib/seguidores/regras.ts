// Regras puras, iguais nos dois modos (mock e Supabase).
import { normalizarTexto } from "@/lib/descoberta/texto";

import type { Conexao } from "./types";

export const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Busca de pessoas: mesma normalização do `normalizar_texto` do banco, sem os
// curingas do ilike/PostgREST. Vazio = não busca.
export function termoDeBusca(texto: string): string {
  return normalizarTexto(texto).replace(/[%_,*\\()]/g, " ").replace(/\s+/g, " ").trim();
}

// Mais recentes primeiro; empate pelo nome.
export function ordenarConexoes(lista: Conexao[]): Conexao[] {
  return [...lista].sort(
    (a, b) => b.desde.localeCompare(a.desde) || a.pessoa.nome.localeCompare(b.pessoa.nome, "pt-BR"),
  );
}


