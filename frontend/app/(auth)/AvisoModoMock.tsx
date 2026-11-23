import { Aviso } from "@/components/ui/Aviso";
import { usarMocks } from "@/lib/supabase/config";

// Lembra quem está com NEXT_PUBLIC_USE_MOCKS=true que estas telas precisam
// do Supabase de verdade.
export function AvisoModoMock() {
  if (!usarMocks) return null;
  return (
    <Aviso tipo="info">
      Modo de dados de mentira ligado (NEXT_PUBLIC_USE_MOCKS=true): cadastro e login não funcionam
      aqui.
    </Aviso>
  );
}
