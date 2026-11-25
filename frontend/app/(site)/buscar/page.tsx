"use client";
// A página só compõe componentes; as regras e queries ficam em lib/descoberta.

import { useEffect, useState } from "react";

import { CartaoPrestadora } from "@/components/descoberta/CartaoPrestadora";
import { Carregando, Erro, Vazio } from "@/components/descoberta/Estados";
import { FiltrosBuscaForm } from "@/components/descoberta/FiltrosBuscaForm";
import { buscarPrestadoras, listarCategorias } from "@/lib/descoberta/service";
import type { CategoriaResumo, FiltrosBusca, PrestadoraResumo } from "@/lib/descoberta/types";

const ESPERA_DIGITACAO_MS = 300;
const FILTROS_INICIAIS: FiltrosBusca = { ordenarPor: "nota" };

export default function BuscarPage() {
  const [filtros, setFiltros] = useState<FiltrosBusca>(FILTROS_INICIAIS);
  const [categorias, setCategorias] = useState<CategoriaResumo[]>([]);
  const [prestadoras, setPrestadoras] = useState<PrestadoraResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  // Muda a cada "Tentar de novo" para a busca rodar outra vez.
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch((err) => {
        console.error("Erro ao carregar as categorias:", err);
        setCategorias([]); // sem categorias o filtro fica só com "Todos", a busca continua
      });
  }, []);

  useEffect(() => {
    let atual = true; // ignora respostas de buscas antigas
    setPrestadoras(null);
    setErro(null);
    const espera = setTimeout(() => {
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

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Encontre uma prestadora</h1>
      <FiltrosBuscaForm categorias={categorias} filtros={filtros} onChange={setFiltros} />

      {erro && <Erro mensagem={erro} onTentarDeNovo={() => setTentativa((t) => t + 1)} />}
      {!erro && prestadoras === null && <Carregando texto="Buscando prestadoras…" />}

      <div aria-live="polite" className="text-sm text-zinc-600">
        {prestadoras && prestadoras.length > 0 && (
          <p>
            {prestadoras.length} {prestadoras.length === 1 ? "prestadora encontrada" : "prestadoras encontradas"}
          </p>
        )}
      </div>

      {prestadoras?.length === 0 && (
        <Vazio>
          {temFiltro ? (
            <>
              Nenhuma prestadora encontrada com esses filtros.{" "}
              <button
                type="button"
                onClick={() => setFiltros({ ordenarPor: filtros.ordenarPor })}
                className="font-medium underline"
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
        <ul className="grid gap-3 sm:grid-cols-2">
          {prestadoras.map((p) => (
            <li key={p.id}>
              <CartaoPrestadora prestadora={p} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
