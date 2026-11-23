import Link from "next/link";

import { classeBotao, classeCampo, Marca, Tela } from "@/components/rede/Tela";

const TIPOS = [
  { valor: "cliente", titulo: "Cliente", texto: "Moro sozinha e quero contratar serviços com segurança." },
  { valor: "prestadora", titulo: "Prestadora", texto: "Ofereço serviços e quero mostrar meu trabalho." },
];

export default function CadastroPage() {
  return (
    <Tela className="gap-[18px] px-6 py-8">
      <Marca />
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[32px] font-semibold leading-[1.1]">Crie sua conta</h1>
        <p className="text-[15px] leading-snug text-suave">
          Mulheres que contratam mulheres, com confiança e avaliações públicas.
        </p>
      </div>

      <fieldset className="flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2 p-0 text-[13px] font-bold uppercase tracking-[0.04em] text-suave">
          Eu sou
        </legend>
        {TIPOS.map((t, i) => (
          <label
            key={t.valor}
            className="flex cursor-pointer items-center gap-3 rounded-[18px] border-2 border-borda bg-papel p-3.5 has-[:checked]:border-vinho has-[:checked]:bg-rosa"
          >
            <input
              type="radio"
              name="tipo"
              value={t.valor}
              defaultChecked={i === 0}
              className="m-0 h-5 w-5 accent-vinho"
            />
            <span className="flex flex-col gap-0.5">
              <b className="text-base">{t.titulo}</b>
              <span className="text-[13.5px] leading-snug text-corpo">{t.texto}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-[13.5px] font-medium">
          Nome
          <input type="text" placeholder="Seu nome" className={classeCampo} />
        </label>
        <label className="flex flex-col gap-1 text-[13.5px] font-medium">
          E-mail
          <input type="email" placeholder="voce@email.com" className={classeCampo} />
        </label>
        <div className="flex gap-3">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[13.5px] font-medium">
            Cidade
            <input type="text" placeholder="João Pessoa" className={classeCampo} />
          </label>
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-[13.5px] font-medium">
            Senha
            <input type="password" placeholder="••••••••" className={classeCampo} />
          </label>
        </div>
      </div>

      <Link href="/" className={`${classeBotao} mt-1`}>
        Criar conta
      </Link>
      <p className="text-center text-[14.5px] text-suave">
        Já tem conta?{" "}
        <Link href="/login" className="inline-block px-1 py-2.5 font-bold text-vinho">
          Entrar
        </Link>
      </p>
    </Tela>
  );
}
