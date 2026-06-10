"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { CatalogoPaginacao } from "@/app/configurar/CatalogoConfiguracaoClient";
import {
  LABEL_STATUS_CONTRATO,
  STATUS_CONTRATO,
  type StatusContrato,
} from "../parceiros/types";
import { salvarContratoGerencia } from "./actions";

export type ContratoListItem = {
  id: string;
  parceiro_id: string;
  parceiro_nome: string;
  contrato: string;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  sla: string | null;
  status: StatusContrato;
  observacoes: string | null;
};

export type ContratoParceiroOpcao = {
  id: string;
  nome: string;
  codigo_interno: string | null;
  ativo: boolean;
};

type Props = {
  contratos: ContratoListItem[];
  parceiros: ContratoParceiroOpcao[];
  parceiroInicial?: string | null;
  pageVersion: string;
  erro?: string | null;
  salvo?: string | null;
};

type FiltrosContratos = {
  cliente: string;
  contrato: string;
  status: "todos" | StatusContrato;
};

const FILTROS_INICIAIS: FiltrosContratos = {
  cliente: "",
  contrato: "",
  status: "todos",
};

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";
const selectClass = inputClass;

function textoFiltro(valor: string | number | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
}

function formatarData(data: string | null) {
  if (!data) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${data}T00:00:00Z`)
  );
}

function CampoTexto({
  name,
  label,
  defaultValue = "",
  required = false,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  type?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={inputClass}
      />
    </label>
  );
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
  children: ReactNode;
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

function ParceiroSelect({
  parceiros,
  defaultValue,
}: {
  parceiros: ContratoParceiroOpcao[];
  defaultValue?: string | null;
}) {
  return (
    <label className={labelClass}>
      Cliente
      <select
        name="parceiro_id"
        defaultValue={defaultValue ?? ""}
        required
        className={selectClass}
      >
        <option value="">Selecione o cliente</option>
        {parceiros.map((parceiro) => (
          <option key={parceiro.id} value={parceiro.id}>
            {parceiro.nome}
            {parceiro.codigo_interno ? ` (${parceiro.codigo_interno})` : ""}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusSelect({ defaultValue = "ativo" }: { defaultValue?: StatusContrato }) {
  return (
    <label className={labelClass}>
      Status
      <select name="status" defaultValue={defaultValue} className={selectClass}>
        {STATUS_CONTRATO.map((status) => (
          <option key={status} value={status}>
            {LABEL_STATUS_CONTRATO[status]}
          </option>
        ))}
      </select>
    </label>
  );
}

function NovoContratoForm({
  parceiros,
  parceiroInicial,
}: {
  parceiros: ContratoParceiroOpcao[];
  parceiroInicial?: string | null;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-950">Novo contrato</h2>
        <p className="mt-1 text-xs text-gray-600">
          Cadastre o contrato na gerência e mantenha o cliente apenas como consulta vinculada.
        </p>
      </div>
      <form
        action={salvarContratoGerencia}
        className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.4fr_1.2fr_1fr_1fr_1fr_auto] xl:items-end"
      >
        <ParceiroSelect parceiros={parceiros} defaultValue={parceiroInicial} />
        <CampoTexto name="contrato" label="Contrato" required />
        <CampoTexto name="vigencia_inicio" label="Vigência início" type="date" />
        <CampoTexto name="vigencia_fim" label="Vigência fim" type="date" />
        <StatusSelect />
        <button
          type="submit"
          className="min-h-9 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Salvar
        </button>
        <div className="md:col-span-2 xl:col-span-3">
          <CampoTexto name="sla" label="SLA" />
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <CampoTexto name="observacoes" label="Observações" />
        </div>
      </form>
    </section>
  );
}

function ContratoRow({
  contrato,
  parceiros,
}: {
  contrato: ContratoListItem;
  parceiros: ContratoParceiroOpcao[];
}) {
  return (
    <form
      action={salvarContratoGerencia}
      className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
    >
      <input type="hidden" name="id" value={contrato.id} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1.2fr_1fr_1fr_1fr_auto] xl:items-end">
        <ParceiroSelect parceiros={parceiros} defaultValue={contrato.parceiro_id} />
        <CampoTexto name="contrato" label="Contrato" defaultValue={contrato.contrato} required />
        <CampoTexto
          name="vigencia_inicio"
          label="Vigência início"
          type="date"
          defaultValue={contrato.vigencia_inicio}
        />
        <CampoTexto
          name="vigencia_fim"
          label="Vigência fim"
          type="date"
          defaultValue={contrato.vigencia_fim}
        />
        <StatusSelect defaultValue={contrato.status} />
        <button
          type="submit"
          className="min-h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Atualizar
        </button>
        <div className="md:col-span-2 xl:col-span-2">
          <CampoTexto name="sla" label="SLA" defaultValue={contrato.sla} />
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <CampoTexto
            name="observacoes"
            label="Observações"
            defaultValue={contrato.observacoes}
          />
        </div>
        <div className="flex items-end">
          <Link
            href={`/cadastros/parceiros/${contrato.parceiro_id}`}
            className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
          >
            Abrir cliente
          </Link>
        </div>
      </div>
    </form>
  );
}

export function ContratosClient({
  contratos,
  parceiros,
  parceiroInicial,
  pageVersion,
  erro,
  salvo,
}: Props) {
  const [filtros, setFiltros] = useState<FiltrosContratos>({
    ...FILTROS_INICIAIS,
    cliente: parceiroInicial ?? "",
  });
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const contratosFiltrados = useMemo(
    () =>
      contratos.filter((contrato) => {
        const clienteMatch =
          !filtros.cliente || contrato.parceiro_id === filtros.cliente;
        const contratoMatch =
          textoFiltro(contrato.contrato).includes(textoFiltro(filtros.contrato)) ||
          textoFiltro(contrato.sla).includes(textoFiltro(filtros.contrato)) ||
          textoFiltro(contrato.parceiro_nome).includes(textoFiltro(filtros.contrato));
        const statusMatch =
          filtros.status === "todos" || contrato.status === filtros.status;

        return clienteMatch && contratoMatch && statusMatch;
      }),
    [contratos, filtros]
  );
  const totalPaginas = Math.max(1, Math.ceil(contratosFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const contratosPaginados = contratosFiltrados.slice(
    inicioPagina,
    inicioPagina + itensPorPagina
  );
  const primeiroItemVisivel =
    contratosFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const ultimoItemVisivel = Math.min(inicioPagina + itensPorPagina, contratosFiltrados.length);

  function atualizarFiltro<K extends keyof FiltrosContratos>(
    campo: K,
    valor: FiltrosContratos[K]
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
          <nav
            aria-label="Navegação de cadastros"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600"
          >
            <Link href="/cadastros/parceiros" className="hover:text-gray-950">
              Gerência
            </Link>
            <span aria-hidden="true" className="text-gray-400">
              &gt;
            </span>
            <span className="text-gray-950">Contratos</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
              Contratos
            </h1>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {pageVersion}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Cadastro gerencial de contratos vinculados a clientes e parceiros operacionais.
          </p>
        </div>
        <span className="w-fit rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
          Total: {contratos.length}
        </span>
      </div>

      {erro ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          Não foi possível salvar o contrato. Confira cliente, contrato e status.
        </div>
      ) : null}

      {salvo ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Contrato salvo com sucesso.
        </div>
      ) : null}

      <div className="space-y-4">
        <NovoContratoForm parceiros={parceiros} parceiroInicial={parceiroInicial} />

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-bold text-gray-950">Registros</h2>
            <p className="mt-1 text-xs text-gray-600">
              Pesquise contratos por cliente, nome, SLA ou status. A consulta do cliente usa estes vínculos.
            </p>
          </div>
          <div className="border-b border-gray-100 bg-white p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_1.5fr_0.9fr_auto] xl:items-end">
              <CampoFiltroSelecao
                label="Cliente"
                value={filtros.cliente}
                onChange={(valor) => atualizarFiltro("cliente", valor)}
              >
                <option value="">Todos</option>
                {parceiros.map((parceiro) => (
                  <option key={parceiro.id} value={parceiro.id}>
                    {parceiro.nome}
                  </option>
                ))}
              </CampoFiltroSelecao>
              <CampoFiltroTexto
                label="Busca"
                value={filtros.contrato}
                onChange={(valor) => atualizarFiltro("contrato", valor)}
                placeholder="Contrato, cliente ou SLA"
              />
              <CampoFiltroSelecao
                label="Status"
                value={filtros.status}
                onChange={(valor) =>
                  atualizarFiltro("status", valor as FiltrosContratos["status"])
                }
              >
                <option value="todos">Todos</option>
                {STATUS_CONTRATO.map((status) => (
                  <option key={status} value={status}>
                    {LABEL_STATUS_CONTRATO[status]}
                  </option>
                ))}
              </CampoFiltroSelecao>
              <button
                type="button"
                onClick={limparFiltros}
                className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white"
              >
                Limpar
              </button>
            </div>
            <div className="mt-3 hidden rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:grid lg:grid-cols-[1.4fr_1.2fr_1fr_1fr_1fr_auto]">
              <span>Cliente</span>
              <span>Contrato</span>
              <span>Início</span>
              <span>Fim</span>
              <span>Status</span>
              <span>Ação</span>
            </div>
          </div>
          <div className="space-y-3 bg-gray-50 p-3 sm:p-4">
            {contratosPaginados.map((contrato) => (
              <ContratoRow key={contrato.id} contrato={contrato} parceiros={parceiros} />
            ))}

            {contratos.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                Nenhum contrato cadastrado.
              </p>
            ) : null}

            {contratos.length > 0 && contratosFiltrados.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                Nenhum contrato encontrado com os filtros aplicados.
              </p>
            ) : null}
          </div>
          <CatalogoPaginacao
            primeiroItemVisivel={primeiroItemVisivel}
            ultimoItemVisivel={ultimoItemVisivel}
            totalItens={contratosFiltrados.length}
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

      <div className="sr-only">
        {contratosPaginados.map((contrato) => (
          <span key={`resumo-${contrato.id}`}>
            {contrato.parceiro_nome} {contrato.contrato} {formatarData(contrato.vigencia_inicio)}{" "}
            {formatarData(contrato.vigencia_fim)} {LABEL_STATUS_CONTRATO[contrato.status]}
          </span>
        ))}
      </div>
    </section>
  );
}
