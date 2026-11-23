// Endereço público das fotos de portfólio (bucket 'portfolio', público, criado
// pela 01_identidade.sql). A URL sai do cliente do navegador sem chamada de rede.
import { criarClienteNavegador } from "@/lib/supabase/client";

import { USAR_MOCKS } from "./service";

// Devolve null em modo mock (os caminhos de exemplo não existem no Storage):
// a galeria mostra um quadro de exemplo no lugar da foto.
export function urlFotoPortfolio(caminho: string): string | null {
  if (USAR_MOCKS) return null;

  const cliente = criarClienteNavegador();
  if (!cliente) return null;

  return cliente.storage.from("portfolio").getPublicUrl(caminho).data.publicUrl;
}
