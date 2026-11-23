// Quem está logada, para o botão "Conversar" decidir entre iniciar a conversa
// e mandar para o login. Só a descoberta usa isto por enquanto.
// TODO: quando a identidade da P1 (#14/#15) entrar no main, trocar pelo helper
// dela (lib/identidade) e apagar este arquivo.
import { criarClienteNavegador } from "@/lib/supabase/client";

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
