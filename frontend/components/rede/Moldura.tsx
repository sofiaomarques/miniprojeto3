// Fundo, cores de texto e fontes do protótipo "Rede de Mulheres". Usado pelos
// grupos (rede) e (auth), para cadastro, login e onboarding terem o mesmo visual.
// flow-root: a margem da Tela estreita (no computador) fica dentro do fundo.
export function MolduraRede({ children }: { children: React.ReactNode }) {
  return (
    <div className="flow-root min-h-dvh bg-areia font-corpo text-texto">
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@400;700&display=swap"
        precedence="default"
      />
      {children}
    </div>
  );
}
