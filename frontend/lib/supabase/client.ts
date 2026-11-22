// Cliente Supabase para o navegador (Client Components).
// As variáveis NEXT_PUBLIC_* precisam ser lidas de forma literal para o Next
// conseguir embuti-las no bundle do navegador.
import { createBrowserClient } from "@supabase/ssr";

export function criarClienteNavegador() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !chave) {
    throw new Error(
      "Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (ver .env.local.example).",
    );
  }

  return createBrowserClient(url, chave);
}
