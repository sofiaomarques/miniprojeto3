import { sair } from "@/app/(auth)/acoes";
import { Botao } from "@/components/ui/Botao";

// Logout: um formulário com Server Action funciona mesmo sem JavaScript.
export function BotaoSair() {
  return (
    <form action={sair}>
      <Botao type="submit" variante="texto">
        Sair
      </Botao>
    </form>
  );
}
