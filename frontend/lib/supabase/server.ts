// Cliente Supabase para o servidor (Server Components, Server Actions e Route Handlers).
// Crie um cliente novo a cada request: ele lê os cookies da request atual.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { lerConfigSupabase } from "./config";

// Retorna null em modo mock (NEXT_PUBLIC_USE_MOCKS=true).
export async function criarClienteServidor() {
  const config = lerConfigSupabase();
  if (!config) return null;

  // No Next 15, cookies() é assíncrono.
  const cookieStore = await cookies();

  return createServerClient(config.url, config.chave, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesParaGravar) {
        try {
          cookiesParaGravar.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components não podem gravar cookies. Pode ignorar: o
          // middleware.ts (lib/supabase/middleware.ts) renova a sessão e grava
          // os cookies a cada request.
        }
      },
    },
  });
}
