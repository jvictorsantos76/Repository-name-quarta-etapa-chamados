"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CatalogoPaginacao,
  OPCOES_CATALOGOS_ITENS_POR_PAGINA,
} from "../CatalogoConfiguracaoClient";
import { salvarTipoArtigo } from "./actions";

export type TipoArtigoListItem = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number | null;
  ativo: boolean;
  eh_padrao: boolean;
  referencias: number;
};

type Props = {
  itens: TipoArtigoListItem[];
  erroCarregamento?: string | null;
};

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

function textoFiltro(valor: string | number | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
}

function normalizarCodigoPreview(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function TipoArtigoForm({ item }: { item?: TipoArtigoListItem }) {
  const [nome, setNome] = useState(item?.nome ?? "");

  return (
    <form
      action={salvarTipoArtigo}
      className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[1fr_1fr_2fr_0.6fr_0.6fr_0.7fr_auto] lg:items-end"
    >
      <input type="hidden" name="id" value={item?.id ?? ""} />
      <label className={labelClass}>
        Código
        <input
          value={item?.codigo ?? normalizarCodigoPreview(nome)}
          readOnly
          className={`${inputClass} bg-gray-100 text-gray-500`}
        />
      </label>
      <label className={labelClass}>
        Nome
        <input
          name="nome"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          required
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Descrição
        <input
          name="descricao"
          defaultValue={item?.descricao ?? ""}
          className={inputClass}
        />
      </label>
      <label className={labelClass}>
        Ordem
        <input
          name="ordem"
          type="number"
          min={0}
          defaultValue={item?.ordem ?? 0}
          className={inputClass}
        />
      </label>
      <label className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
        <span>Ativo</span>
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={item?.ativo ?? true}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </label>
      <label className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
        <span>Padrão</span>
        <input
          type="checkbox"
          name="eh_padrao"
          defaultChecked={item?.eh_padrao ?? false}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </label>
      <button
        type="submit"
        className="min-h-9 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
      >
        Salvar
      </button>
    </form>
  );
}

export function TiposArtigoClient({ itens, erroCarregamento }: Props) {
  const [busca, setBusca] = useState("");
  const [situacao, setSituacao] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);

  const itensFiltrados = useMemo(() => {
    const termo = textoFiltro(busca);
    return itens.filter((item) => {
      const texto = [item.codigo, item.nome, item.descricao].map(textoFiltro).join(" ");
      return (
        (!termo || texto.includes(termo)) &&
        (situacao === "todos" ||
          (situacao === "ativos" && item.ativo) ||
          (situacao === "inativos" && !item.ativo))
      );
    });
  }, [busca, itens, situacao]);

  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const primeiroIndice = (paginaSegura - 1) * itensPorPagina;
  const itensPaginados = itensFiltrados.slice(primeiroIndice, primeiroIndice + itensPorPagina);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-10 md:px-8">
      <div className="mb-6">
        <Link href="/ferramentas/base-conhecimento" className="text-sm font-semibold text-blue-600">
          Voltar para Base de Conhecimento
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-950">Tipos de artigo</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Cadastro dos tipos usados para classificar artigos técnicos e governar o formulário editorial.
        </p>
      </div>

      {erroCarregamento ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {erroCarregamento}
        </div>
      ) : null}

      <TipoArtigoForm />

      <div className="mt-5 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className={labelClass}>
            Busca
            <input
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPaginaAtual(1);
              }}
              className={inputClass}
              placeholder="Código, nome ou descrição"
            />
          </label>
          <label className={labelClass}>
            Situação
            <select
              value={situacao}
              onChange={(event) => {
                setSituacao(event.target.value);
                setPaginaAtual(1);
              }}
              className={inputClass}
            >
              <option value="todos">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </label>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {itensPaginados.map((item) => (
          <TipoArtigoForm key={item.id} item={item} />
        ))}
        {itensFiltrados.length === 0 ? (
          <p className="rounded-lg border border-gray-200 bg-white p-4 text-sm font-medium text-gray-600">
            Nenhum tipo de artigo encontrado.
          </p>
        ) : null}
      </div>

      <div className="mt-5 overflow-hidden rounded-lg border border-gray-200">
        <CatalogoPaginacao
          primeiroItemVisivel={itensFiltrados.length === 0 ? 0 : primeiroIndice + 1}
          ultimoItemVisivel={Math.min(primeiroIndice + itensPorPagina, itensFiltrados.length)}
          totalItens={itensFiltrados.length}
          itensPorPagina={itensPorPagina}
          opcoesItensPorPagina={OPCOES_CATALOGOS_ITENS_POR_PAGINA}
          paginaAtual={paginaSegura}
          totalPaginas={totalPaginas}
          onItensPorPaginaChange={(value) => {
            setItensPorPagina(value);
            setPaginaAtual(1);
          }}
          onPaginaChange={setPaginaAtual}
        />
      </div>
    </section>
  );
}

