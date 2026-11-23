import Link from "next/link";

// Estado deslogado das telas do chat: leva para o login (P1) e volta depois.
export function AvisoDeslogada({ voltarPara }: { voltarPara: string }) {
  return (
    <div className="space-y-2 rounded border bg-white p-4 text-sm text-zinc-600">
      <p>Entre na sua conta para ver suas conversas.</p>
      <Link
        href={`/entrar?next=${encodeURIComponent(voltarPara)}`}
        className="font-medium text-rose-700 underline"
      >
        Entrar
      </Link>
    </div>
  );
}
