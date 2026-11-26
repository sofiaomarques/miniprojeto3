"use client";

// Tela de busca (página inicial): filtro por cidade, chips de serviço e
// ordenação, com os dados do service da descoberta. Os filtros ficam na URL
// (?categoria=&cidade=&ordem=) para o link poder ser compartilhado.
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { IconeFechar, IconePino } from "@/components/rede/icones";
import { Rotulo } from "@/components/rede/Tela";
import { buscarPrestadoras, listarCategorias } from "@/lib/descoberta/service";
import type {
  CategoriaResumo,
  FiltrosBusca,
  OrdenarPor,
  PrestadoraResumo,
} from "@/lib/descoberta/types";
import type { Perfil } from "@/lib/identidade/types";

import { Avatar, tomDaPosicao } from "./Avatar";
import { textoCategorias, textoCidade } from "./Categorias";
import { Carregando, Erro, Vazio } from "./Estados";
import { SeloNota } from "./Estrelas";

const ESPERA_DIGITACAO_MS = 300;

type Props = { perfil: Perfil | null; filtrosIniciais: FiltrosBusca };

function paraUrl(filtros: FiltrosBusca): string {
  const params = new URLSearchParams();
  if (filtros.categoriaId) params.set("categoria", String(filtros.categoriaId));
  if (filtros.cidade?.trim()) params.set("cidade", filtros.cidade.trim());
  if (filtros.ordenarPor === "preco") params.set("ordem", "preco");
  const texto = params.toString();
  return texto ? `/?${texto}` : "/";
}

export function BuscaPrestadoras({ perfil, filtrosIniciais }: Props) {
  const [filtros, setFiltros] = useState<FiltrosBusca>(filtrosIniciais);
  const [categorias, setCategorias] = useState<CategoriaResumo[]>([]);
  const [prestadoras, setPrestadoras] = useState<PrestadoraResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Muda a cada "Tentar de novo" para a busca rodar outra vez.
  const [tentativa, setTentativa] = useState(0);
  const campoCidade = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listarCategorias().then(setCategorias, (err) => {
      console.error("Erro ao carregar as categorias:", err);
      setCategorias([]); // sem categorias fica só o chip "Todos"; a busca continua
    });
  }, []);

  useEffect(() => {
    let atual = true; // ignora respostas de buscas antigas
    window.history.replaceState(null, "", paraUrl(filtros));
    // A lista anterior fica na tela durante a espera; só some quando a busca começa.
    const espera = setTimeout(() => {
      setPrestadoras(null);
      setErro(null);
      buscarPrestadoras(filtros).then(
        (lista) => atual && setPrestadoras(lista),
        (err) => {
          if (!atual) return;
          console.error("Erro ao buscar prestadoras:", err);
          setErro("Não consegui carregar as prestadoras.");
        },
      );
    }, ESPERA_DIGITACAO_MS);
    return () => {
      atual = false;
      clearTimeout(espera);
    };
  }, [filtros, tentativa]);

  const temFiltro = Boolean(filtros.categoriaId || filtros.cidade?.trim());
  const chips = [{ id: undefined, nome: "Todos" }, ...categorias];

  return (
    <>
      <div className="flex flex-col gap-3.5 rounded-b-[28px] bg-rosa px-5 pb-4 pt-5">
        <div className="flex items-center justify-end gap-3 text-[13.5px]">
          {!perfil ? (
            <Link href="/entrar" className="inline-block px-1 py-2.5 font-bold text-vinho">
              Entrar
            </Link>
          ) : !perfil.papel ? (
            <Link href="/onboarding" className="inline-block px-1 py-2.5 font-bold text-vinho">
              Concluir cadastro
            </Link>
          ) : (
            <span className="truncate py-2.5 text-corpo">
              Olá, {perfil.nome?.split(" ")[0] ?? "você"}
            </span>
          )}
        </div>
        <h1 className="font-display text-[26px] font-semibold leading-[1.15] md:text-[34px]">
          Do que você precisa hoje?
        </h1>
        {/* A busca já roda enquanto se digita; o submit só fecha o teclado do celular. */}
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            campoCidade.current?.blur();
          }}
          className="flex h-12 items-center gap-2.5 rounded-3xl bg-papel pl-3.5 pr-1.5 text-suave has-[input:focus]:outline-2 has-[input:focus]:outline-vinho md:max-w-xl"
        >
          <IconePino size={20} className="shrink-0 text-vinho" />
          <input
            ref={campoCidade}
            type="search"
            enterKeyHint="search"
            aria-label="Cidade"
            placeholder="Em qual cidade? Ex.: João Pessoa"
            value={filtros.cidade ?? ""}
            onChange={(e) => setFiltros({ ...filtros, cidade: e.target.value })}
            className="min-w-0 flex-1 bg-transparent text-base text-texto outline-none placeholder:text-suave [&::-webkit-search-cancel-button]:appearance-none"
          />
          {filtros.cidade && (
            <button
              type="button"
              aria-label="Limpar cidade"
              onClick={() => {
                setFiltros({ ...filtros, cidade: undefined });
                campoCidade.current?.focus();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-vinho hover:bg-rosa-claro focus-visible:outline-2 focus-visible:outline-vinho"
            >
              <IconeFechar size={18} />
            </button>
          )}
        </form>
      </div>

      {/* No computador (lg) os serviços viram uma coluna ao lado da lista. */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:gap-7">
        <nav
          aria-label="Serviços"
          className="flex gap-2 overflow-x-auto px-5 pb-1 pt-3.5 md:px-0 lg:w-56 lg:shrink-0 lg:sticky lg:top-16 lg:flex-col lg:self-start lg:overflow-visible lg:pt-6"
        >
          {chips.map((c) => {
            const on = c.id === filtros.categoriaId;
            return (
              <button
                key={c.id ?? "todos"}
                type="button"
                onClick={() => setFiltros({ ...filtros, categoriaId: c.id })}
                aria-pressed={on}
                className={`flex h-10 shrink-0 items-center rounded-full px-3.5 text-[13.5px] lg:h-auto lg:min-h-10 lg:py-2 lg:text-left focus-visible:outline-2 focus-visible:outline-vinho ${
                  on ? "bg-vinho font-bold text-white" : "bg-areia font-medium text-texto"
                }`}
              >
                {c.nome}
              </button>
            );
          })}
        </nav>

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 pb-4 pt-2 md:overflow-visible md:px-0 md:pb-10 lg:pt-6">
          <div className="flex items-center justify-between gap-2">
            <Rotulo>{filtros.ordenarPor === "preco" ? "Menor preço primeiro" : "Melhores avaliadas"}</Rotulo>
            <label className="flex items-center gap-1 text-[13px] text-suave">
              <span className="sr-only">Ordenar por</span>
              <select
                value={filtros.ordenarPor ?? "nota"}
                onChange={(e) => setFiltros({ ...filtros, ordenarPor: e.target.value as OrdenarPor })}
                className="min-h-11 rounded-full bg-transparent px-2 text-[13px] font-bold text-vinho"
              >
                <option value="nota">Melhor nota</option>
                <option value="preco">Menor preço</option>
              </select>
            </label>
          </div>

          {erro && <Erro mensagem={erro} onTentarDeNovo={() => setTentativa((t) => t + 1)} />}
          {!erro && prestadoras === null && <Carregando texto="Buscando prestadoras…" />}

          <p aria-live="polite" className="sr-only">
            {prestadoras
              ? `${prestadoras.length} ${prestadoras.length === 1 ? "prestadora encontrada" : "prestadoras encontradas"}`
              : ""}
          </p>

          {prestadoras?.length === 0 && (
            <Vazio>
              {temFiltro ? (
                <>
                  Nenhuma prestadora encontrada com esses filtros.{" "}
                  <button
                    type="button"
                    onClick={() => setFiltros({ ordenarPor: filtros.ordenarPor })}
                    className="font-bold text-vinho underline"
                  >
                    Limpar filtros
                  </button>
                </>
              ) : (
                "Ainda não há prestadoras cadastradas."
              )}
            </Vazio>
          )}

          {prestadoras && prestadoras.length > 0 && (
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {prestadoras.map((p, i) => (
                <li key={p.id}>
                  <Link
                    href={`/prestadoras/${p.id}`}
                    className="flex h-full w-full items-center gap-3 rounded-[20px] border border-borda bg-papel p-3.5 hover:border-vinho/40 focus-visible:outline-2 focus-visible:outline-vinho active:bg-rosa-claro"
                  >
                    <Avatar nome={p.nome} url={p.avatarUrl} tamanho={52} fundo={tomDaPosicao(i)} />
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <b className="truncate text-base">{p.nome}</b>
                      {p.categorias.length > 0 && (
                        <span className="truncate text-[13.5px] text-suave">
                          {textoCategorias(p.categorias)}
                        </span>
                      )}
                      {/* Cidade em linha própria: no fim da linha de serviços ela sumia no truncate. */}
                      <span className="flex min-w-0 items-center gap-1 text-[13px] text-suave">
                        <IconePino size={14} className="shrink-0 text-vinho" />
                        <span className="truncate">
                          {textoCidade(p.cidade)} ·{" "}
                          {p.totalAvaliacoes === 0
                            ? "Sem avaliações ainda"
                            : `${p.totalAvaliacoes} ${p.totalAvaliacoes === 1 ? "avaliação" : "avaliações"}`}
                        </span>
                      </span>
                    </div>
                    <SeloNota nota={p.notaMedia} total={p.totalAvaliacoes} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
