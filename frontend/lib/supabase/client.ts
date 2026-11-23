// Cliente Supabase para o navegador (Client Components).
import { createBrowserClient } from "@supabase/ssr";
import { lerConfigSupabase } from "./config";

// Retorna null em modo mock (NEXT_PUBLIC_USE_MOCKS=true).
export function criarClienteNavegador() {
  const config = lerConfigSupabase();
  if (!config) return null;

  return createBrowserClient(config.url, config.chave);
}
