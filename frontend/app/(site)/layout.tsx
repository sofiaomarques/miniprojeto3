import Link from "next/link";

// Moldura das páginas já existentes (busca e página da prestadora).
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
        </div>
      </nav>
      <main className="mx-auto max-w-3xl px-4 py-6">{children}</main>
    </div>
  );
}
