"use client";

// Campo de senha com botão para mostrar/ocultar o que foi digitado, para a
// pessoa conferir a senha no celular antes de enviar.
import { useState, type ComponentProps } from "react";
import { IconeOlho, IconeOlhoRiscado } from "@/components/rede/icones";
import { CampoTexto } from "@/components/ui/CampoTexto";

type Props = Omit<ComponentProps<typeof CampoTexto>, "type" | "acessorio">;

export function CampoSenha(props: Props) {
  const [visivel, setVisivel] = useState(false);

  return (
    <CampoTexto
      {...props}
      type={visivel ? "text" : "password"}
      acessorio={
        <button
          type="button"
          onClick={() => setVisivel((v) => !v)}
          aria-label={visivel ? "Ocultar senha" : "Mostrar senha"}
          aria-pressed={visivel}
          className="flex h-10 w-10 items-center justify-center rounded-full text-suave hover:text-vinho focus-visible:outline-2 focus-visible:outline-vinho"
        >
          {visivel ? <IconeOlhoRiscado size={20} /> : <IconeOlho size={20} />}
        </button>
      }
    />
  );
}
