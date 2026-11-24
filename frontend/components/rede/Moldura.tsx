// Fundo, cores de texto e fontes do protótipo "Rede de Mulheres". Usado pelos
// grupos (rede) e (auth), para cadastro, login e onboarding terem o mesmo visual.
export function MolduraRede({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-areia font-corpo text-texto">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:opsz,wght@9..144,500;9..144,600&display=swap"
        precedence="default"
      />
      {children}
    </div>
  );
}
