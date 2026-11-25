// /buscar era a busca antiga; a busca agora é a página inicial.
import { redirect } from "next/navigation";

export default async function BuscarAntigo({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = new URLSearchParams();
  for (const [chave, valor] of Object.entries(await searchParams)) {
    if (typeof valor === "string") params.set(chave, valor);
  }
  const texto = params.toString();
  redirect(texto ? `/?${texto}` : "/");
}
