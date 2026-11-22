// Cliente Supabase para o servidor (Server Components, Server Actions e Route Handlers).
// Crie um cliente novo a cada request: ele lê os cookies da request atual.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function criarClienteServidor() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.local.example).",
    );
  }

  // No Next 15, cookies() é assíncrono.
  const cookieStore = await cookies();

  return createServerClient(url, chave, {
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
          // Server Components não podem gravar cookies. Pode ignorar: a
          // renovação da sessão nos cookies fica a cargo do middleware.
        }
      },
    },
  });
}
