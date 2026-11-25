// Quem está logada, para o botão "Conversar" decidir entre iniciar a conversa
// e mandar para o login. Só a descoberta usa isto por enquanto.
// TODO: quando a identidade da P1 (#14/#15) entrar no main, trocar pelo helper
// dela (lib/identidade) e apagar este arquivo.
import { criarClienteNavegador } from "@/lib/supabase/client";

import type { Papel } from "./identidade-provisoria";
import { CLIENTES_MOCK } from "./mocks";
import { USAR_MOCKS } from "./service";

// Devolve o uuid da cliente logada, ou null se ninguém está logada.
// No modo mock não há login: finge a primeira cliente de exemplo, para a
// conversa poder ser testada sem banco.
export async function usuarioAtualId(): Promise<string | null> {
  if (USAR_MOCKS) return CLIENTES_MOCK[0]?.id ?? null;

  const cliente = criarClienteNavegador();
  if (!cliente) return null;

  const { data } = await cliente.auth.getUser();
  return data.user?.id ?? null;
}

export type UsuarioAtual = { id: string; papel: Papel | null };

// Quem está logada e com qual papel, para decidir se a tela mostra o formulário
// de avaliação. `papel` é null se o perfil ainda não pôde ser lido.
export async function usuarioAtual(): Promise<UsuarioAtual | null> {
  const id = await usuarioAtualId();
  if (!id) return null;

  if (USAR_MOCKS) {
    return { id, papel: CLIENTES_MOCK.find((c) => c.id === id)?.papel ?? null };
  }

  const cliente = criarClienteNavegador();
  if (!cliente) return { id, papel: null };
  const { data, error } = await cliente.from("perfis").select("papel").eq("id", id).maybeSingle();
  if (error) {
    console.error("Erro ao ler o papel da usuária:", error);
    return { id, papel: null };
  }
  return { id, papel: (data?.papel as Papel | undefined) ?? null };
}
