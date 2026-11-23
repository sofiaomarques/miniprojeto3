// Telas de conta (cadastro, login e onboarding): coluna estreita e centrada.
export default function LayoutConta({ children }: Readonly<{ children: React.ReactNode }>) {
  return <div className="mx-auto max-w-sm py-6">{children}</div>;
}
