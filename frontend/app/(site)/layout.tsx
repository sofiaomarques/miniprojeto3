import Link from "next/link";

import { MenuConta } from "@/components/identidade/MenuConta";
import { NavegacaoPrincipal } from "@/components/identidade/NavegacaoPrincipal";

// Moldura das páginas já existentes (busca, página da prestadora e minhas indicações).
export default function SiteLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <nav className="border-b bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-6 px-4 py-3">
          <Link href="/" className="font-bold">
            Rede de Mulheres
          </Link>
          <NavegacaoPrincipal />
          <MenuConta />
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
