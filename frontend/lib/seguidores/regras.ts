// Regras puras, iguais nos dois modos (mock e Supabase).
import { normalizarTexto } from "@/lib/descoberta/texto";

import type { Conexao } from "./types";

export const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Busca de pessoas: mesma normalização do `normalizar_texto` do banco, sem os
// curingas do ilike/PostgREST. Vazio (ou menos de 2 letras) = não busca.
export const TERMO_MINIMO = 2;

export function termoDeBusca(texto: string): string {
  const termo = normalizarTexto(texto).replace(/[%_,*\\()]/g, " ").replace(/\s+/g, " ").trim();
  return termo.length >= TERMO_MINIMO ? termo : "";
}

// Mais recentes primeiro; empate pelo nome.
export function ordenarConexoes(lista: Conexao[]): Conexao[] {
  return [...lista].sort(
    (a, b) => b.desde.localeCompare(a.desde) || a.pessoa.nome.localeCompare(b.pessoa.nome, "pt-BR"),
  );
}


// Para onde vai o clique numa pessoa: prestadora tem a página pública dela
// (descoberta); cliente, a página de pessoa (com as indicações).
export function linkDaPessoa(pessoa: { id: string; papel: string | null }): string {
  return pessoa.papel === "prestadora" ? `/prestadoras/${pessoa.id}` : `/pessoas/${pessoa.id}`;
}

export function linkDaLista(perfilId: string, tipo: "seguidores" | "seguindo"): string {
  return `/pessoas/${perfilId}/${tipo}`;
}
