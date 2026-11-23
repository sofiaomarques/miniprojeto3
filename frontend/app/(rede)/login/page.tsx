import Link from "next/link";

import { IconeEscudo } from "@/components/rede/icones";
import { classeBotao, classeCampo, Marca, Tela } from "@/components/rede/Tela";

export default function LoginPage() {
  return (
    <Tela>
      <div className="flex h-[330px] flex-col justify-between rounded-b-[44px] bg-rosa px-6 py-8">
        <Marca fundo="papel" />
        <div className="flex flex-col gap-2.5">
          <h1 className="font-display text-[38px] font-semibold leading-[1.08]">
            Que bom ter você de volta.
          </h1>
          <p className="text-[15.5px] leading-[1.45] text-corpo">
            Encontre profissionais mulheres de confiança perto de você.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-4 px-6 py-8">
        <label className="flex flex-col gap-1 text-[13.5px] font-medium">
          E-mail
          <input type="email" placeholder="voce@email.com" className={`${classeCampo} h-12`} />
        </label>
        <label className="flex flex-col gap-1 text-[13.5px] font-medium">
          Senha
          <input type="password" placeholder="••••••••" className={`${classeCampo} h-12`} />
        </label>
        <Link href="/" className={`${classeBotao} mt-2`}>
          Entrar
        </Link>
        <p className="mt-2 text-center text-[14.5px] text-suave">
          Ainda não tem conta?{" "}
          <Link href="/cadastro" className="inline-block px-1 py-2.5 font-bold text-vinho">
            Cadastre-se
          </Link>
        </p>
      </div>

      <div className="mx-6 mb-8 mt-auto flex items-start gap-3 rounded-[18px] bg-areia p-4">
        <IconeEscudo size={24} className="shrink-0 text-vinho" />
        <p className="text-[13.5px] leading-[1.45] text-corpo">
          Toda prestadora tem perfil, fotos de trabalhos e avaliações públicas de outras clientes.
        </p>
      </div>
    </Tela>
  );
}
