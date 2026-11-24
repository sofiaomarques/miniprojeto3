"use client";
// A página só compõe componentes; as regras e queries ficam em lib/descoberta.

import { useEffect, useState } from "react";

import { CartaoPrestadora } from "@/components/descoberta/CartaoPrestadora";
import { FiltrosBuscaForm } from "@/components/descoberta/FiltrosBuscaForm";
import { buscarPrestadoras, listarCategorias } from "@/lib/descoberta/service";
import type { CategoriaResumo, FiltrosBusca, PrestadoraResumo } from "@/lib/descoberta/types";

const ESPERA_DIGITACAO_MS = 300;

export default function BuscarPage() {
  const [filtros, setFiltros] = useState<FiltrosBusca>({ ordenarPor: "nota" });
  const [categorias, setCategorias] = useState<CategoriaResumo[]>([]);
  const [prestadoras, setPrestadoras] = useState<PrestadoraResumo[] | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    listarCategorias()
      .then(setCategorias)
      .catch(() => setCategorias([])); // sem categorias o filtro some, a busca continua
  }, []);

  useEffect(() => {
    let atual = true; // ignora respostas de buscas antigas
    setPrestadoras(null);
    setErro(null);
    const espera = setTimeout(() => {
      buscarPrestadoras(filtros)
        .then((lista) => atual && setPrestadoras(lista))
        .catch(() => atual && setErro("Não consegui carregar as prestadoras. Tente de novo."));
    }, ESPERA_DIGITACAO_MS);
    return () => {
      atual = false;
      clearTimeout(espera);
    };
  }, [filtros]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Encontre uma prestadora</h1>
      <FiltrosBuscaForm categorias={categorias} filtros={filtros} onChange={setFiltros} />

      <div aria-live="polite">
        {erro && (
          <p role="alert" className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </p>
        )}
        {!erro && prestadoras === null && <p className="text-sm text-zinc-500">Carregando…</p>}
        {prestadoras?.length === 0 && (
          <p className="rounded border bg-white p-4 text-sm text-zinc-600">
            Nenhuma prestadora encontrada. Tente outra cidade ou outro serviço.
          </p>
        )}
      </div>

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
