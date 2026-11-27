// /login é apelido de /entrar, para links antigos que ainda usam /login.
// Repassa só um ?next= interno; o resto é descartado.
import { redirect } from "next/navigation";
import { caminhoInterno } from "@/lib/identidade/auth";

export default async function PaginaLogin({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const next = caminhoInterno((await searchParams).next);
  redirect(next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar");
}
