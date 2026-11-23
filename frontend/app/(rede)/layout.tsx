// Telas do protótipo "Rede de Mulheres": só visual, com dados de exemplo.
export default function RedeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-areia font-corpo text-texto">
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
