"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  salvarCatalogoChamado,
  type CatalogoChamadoKind,
} from "./catalogos-actions";

export type CatalogoConfiguracaoItem = {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number | null;
  ativo: boolean;
};

type CatalogoConfiguracaoClientProps = {
  kind: Exclude<CatalogoChamadoKind, "status">;
  titulo: string;
  descricao: string;
  itens: CatalogoConfiguracaoItem[];
  erroCarregamento?: string | null;
};

type FiltrosCatalogo = {
  nome: string;
  descricao: string;
  ativo: "todos" | "ativos" | "inativos";
};

type CatalogoPaginacaoProps = {
  primeiroItemVisivel: number;
  ultimoItemVisivel: number;
  totalItens: number;
  itensPorPagina: number;
  opcoesItensPorPagina?: number[];
  paginaAtual: number;
  totalPaginas: number;
  onItensPorPaginaChange: (value: number) => void;
  onPaginaChange: (value: number) => void;
};

const FILTROS_INICIAIS: FiltrosCatalogo = {
  nome: "",
  descricao: "",
  ativo: "todos",
};

export const OPCOES_CATALOGOS_ITENS_POR_PAGINA = [10, 20, 30, 50];

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";
const selectClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

function textoFiltro(valor: string | number | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
}

function CampoFiltroTexto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function CampoFiltroSelecao({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        {children}
      </select>
    </label>
  );
}

function CampoTexto({
  name,
  label,
  defaultValue = "",
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

export function CatalogoPaginacao({
  primeiroItemVisivel,
  ultimoItemVisivel,
  totalItens,
  itensPorPagina,
  opcoesItensPorPagina = OPCOES_CATALOGOS_ITENS_POR_PAGINA,
  paginaAtual,
  totalPaginas,
  onItensPorPaginaChange,
  onPaginaChange,
}: CatalogoPaginacaoProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-gray-100 bg-white px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm font-medium text-gray-600">
        Mostrando {primeiroItemVisivel}-{ultimoItemVisivel} de {totalItens} registro(s)
        filtrado(s).
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          Visualizar
          <select
            value={itensPorPagina}
            onChange={(event) => onItensPorPaginaChange(Number(event.target.value))}
            className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
          >
            {opcoesItensPorPagina.map((opcao) => (
              <option key={opcao} value={opcao}>
                {opcao}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onPaginaChange(1)}
            disabled={paginaAtual === 1}
            className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Primeiro
          </button>
          <button
            type="button"
            onClick={() => onPaginaChange(Math.max(1, paginaAtual - 1))}
            disabled={paginaAtual === 1}
            className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Voltar
          </button>
          <span className="min-h-9 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-700">
            {paginaAtual}/{totalPaginas}
          </span>
          <button
            type="button"
            onClick={() => onPaginaChange(Math.min(totalPaginas, paginaAtual + 1))}
            disabled={paginaAtual === totalPaginas}
            className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Avançar
          </button>
          <button
            type="button"
            onClick={() => onPaginaChange(totalPaginas)}
            disabled={paginaAtual === totalPaginas}
            className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white disabled:cursor-not-allowed disabled:text-gray-400"
          >
            Último
          </button>
        </div>
      </div>
    </div>
  );
}

function NovoCatalogoForm({ kind }: { kind: Exclude<CatalogoChamadoKind, "status"> }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-950">Novo item</h2>
        <p className="mt-1 text-xs text-gray-600">
          Cadastre registros pequenos de configuração mantendo a mesma estrutura operacional.
        </p>
      </div>
      <form action={salvarCatalogoChamado} className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.25fr_2fr_0.7fr_0.7fr_auto] xl:items-end">
        <input type="hidden" name="kind" value={kind} />
        <CampoTexto name="nome" label="Nome" required />
        <CampoTexto name="descricao" label="Descrição" />
        <CampoTexto name="ordem" label="Ordem" defaultValue="0" />
        <label className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold uppercase tracking-wide text-gray-700">
          <span>Ativo</span>
          <input
            type="checkbox"
            name="ativo"
            defaultChecked
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
    </section>
  );
}

function CatalogoRow({
  kind,
  item,
}: {
  kind: Exclude<CatalogoChamadoKind, "status">;
  item: CatalogoConfiguracaoItem;
}) {
  return (
    <form
      action={salvarCatalogoChamado}
      className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm lg:grid-cols-[1.3fr_2fr_0.7fr_0.7fr_auto] lg:items-end"
    >
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="id" value={item.id} />
      <CampoTexto name="nome" label="Nome" defaultValue={item.nome} required />
      <CampoTexto name="descricao" label="Descrição" defaultValue={item.descricao ?? ""} />
      <CampoTexto name="ordem" label="Ordem" defaultValue={String(item.ordem ?? 0)} />
      <label className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold uppercase tracking-wide text-gray-700">
        <span>Ativo</span>
        <input
          type="checkbox"
          name="ativo"
          defaultChecked={item.ativo}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
      </label>
      <button
        type="submit"
        className="min-h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
      >
        Atualizar
      </button>
    </form>
  );
}

export function CatalogoConfiguracaoClient({
  kind,
  titulo,
  descricao,
  itens,
  erroCarregamento,
}: CatalogoConfiguracaoClientProps) {
  const [filtros, setFiltros] = useState<FiltrosCatalogo>(FILTROS_INICIAIS);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const itensFiltrados = useMemo(
    () =>
      itens.filter((item) => {
        const nomeMatch = textoFiltro(item.nome).includes(textoFiltro(filtros.nome));
        const descricaoMatch = textoFiltro(item.descricao).includes(
          textoFiltro(filtros.descricao)
        );
        const ativoMatch =
          filtros.ativo === "todos" ||
          (filtros.ativo === "ativos" && item.ativo) ||
          (filtros.ativo === "inativos" && !item.ativo);

        return nomeMatch && descricaoMatch && ativoMatch;
      }),
    [filtros, itens]
  );

  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const itensPaginados = itensFiltrados.slice(inicioPagina, inicioPagina + itensPorPagina);
  const primeiroItemVisivel = itensFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const ultimoItemVisivel = Math.min(inicioPagina + itensPorPagina, itensFiltrados.length);

  function atualizarFiltro<K extends keyof FiltrosCatalogo>(
    campo: K,
    valor: FiltrosCatalogo[K]
  ) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
    setPaginaAtual(1);
  }

  function limparFiltros() {
    setFiltros(FILTROS_INICIAIS);
    setPaginaAtual(1);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link href="/chamados/novo" className="text-xs font-semibold text-blue-600">
            Voltar para novo chamado
          </Link>
          <h1 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">{titulo}</h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">{descricao}</p>
        </div>
        <span className="w-fit rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
          Total: {itens.length}
        </span>
      </div>

      {erroCarregamento ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {erroCarregamento}
        </div>
      ) : null}

      <div className="space-y-4">
        <NovoCatalogoForm kind={kind} />

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-bold text-gray-950">Registros</h2>
            <p className="mt-1 text-xs text-gray-600">
              Filtre, pagine e edite registros pequenos de configuração no padrão canônico.
            </p>
          </div>

          <div className="border-b border-gray-100 bg-white p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.2fr_2fr_0.9fr_auto] xl:items-end">
              <CampoFiltroTexto
                label="Nome"
                value={filtros.nome}
                onChange={(valor) => atualizarFiltro("nome", valor)}
                placeholder="Filtrar nome"
              />
              <CampoFiltroTexto
                label="Descrição"
                value={filtros.descricao}
                onChange={(valor) => atualizarFiltro("descricao", valor)}
                placeholder="Filtrar descrição"
              />
              <CampoFiltroSelecao
                label="Ativo"
                value={filtros.ativo}
                onChange={(valor) => atualizarFiltro("ativo", valor as FiltrosCatalogo["ativo"])}
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </CampoFiltroSelecao>
              <button
                type="button"
                onClick={limparFiltros}
                className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white"
              >
                Limpar
              </button>
            </div>
            <div className="mt-3 hidden rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:grid lg:grid-cols-[1.3fr_2fr_0.7fr_0.7fr_auto]">
              <span>Nome</span>
              <span>Descrição</span>
              <span>Ordem</span>
              <span>Ativo</span>
              <span>Ação</span>
            </div>
          </div>

          <div className="space-y-3 bg-gray-50 p-3 sm:p-4">
            {itensPaginados.map((item) => (
              <CatalogoRow key={item.id} kind={kind} item={item} />
            ))}

            {itens.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                Nenhum registro cadastrado.
              </p>
            ) : null}

            {itens.length > 0 && itensFiltrados.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                Nenhum registro encontrado com os filtros aplicados.
              </p>
            ) : null}
          </div>

          <CatalogoPaginacao
            primeiroItemVisivel={primeiroItemVisivel}
            ultimoItemVisivel={ultimoItemVisivel}
            totalItens={itensFiltrados.length}
            itensPorPagina={itensPorPagina}
            paginaAtual={paginaSegura}
            totalPaginas={totalPaginas}
            onItensPorPaginaChange={(value) => {
              setItensPorPagina(value);
              setPaginaAtual(1);
            }}
            onPaginaChange={setPaginaAtual}
          />
        </section>
      </div>
    </section>
  );
}
