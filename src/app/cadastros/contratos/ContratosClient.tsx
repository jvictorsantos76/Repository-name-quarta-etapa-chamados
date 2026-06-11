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
  descricao_contrato: string | null;
  valor: number | null;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  data_base: string | null;
  vencimento: string | null;
  dia_vencimento: number | null;
  periodicidade: string | null;
  valor_total_previsto: number | null;
  gerar_nota_fiscal: boolean;
  data_contrato: string | null;
  impressao_periodo_cobranca: string | null;
  cobrar_outro_contato: boolean;
  cobranca_parceiro_id: string | null;
  cobranca_parceiro_nome: string | null;
  renovacao_automatica: boolean;
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

const OPCOES_VENCIMENTO = [
  ["mes_corrente", "No mês corrente"],
  ["mes_subsequente", "No mês subsequente"],
  ["dia_fixo", "Dia fixo"],
  ["apos_emissao", "Após emissão"],
] as const;
const OPCOES_PERIODICIDADE = [
  ["mensal", "Mensal"],
  ["bimestral", "Bimestral"],
  ["trimestral", "Trimestral"],
  ["semestral", "Semestral"],
  ["anual", "Anual"],
  ["unico", "Único"],
] as const;
const OPCOES_IMPRESSAO = [
  ["nao_imprime", "Não imprime"],
  ["competencia", "Competência"],
  ["vencimento", "Vencimento"],
] as const;

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

function formatarMoeda(valor: number | null | undefined) {
  if (valor === null || valor === undefined || !Number.isFinite(Number(valor))) {
    return "-";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function centavosTextoDeValor(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  return String(Math.round(Number(valor) * 100));
}

function numeroDeCentavos(centavosTexto: string) {
  return Number(centavosTexto || "0") / 100;
}

function valorDecimalDeCentavos(centavosTexto: string) {
  if (!centavosTexto) {
    return "";
  }

  return (Number(centavosTexto) / 100).toFixed(2);
}

function formatarMoedaCentavos(centavosTexto: string) {
  if (!centavosTexto) {
    return "";
  }

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(centavosTexto) / 100);
}

function parseDateUtc(valor: string | null | undefined) {
  if (!valor) {
    return null;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);

  if (!ano || !mes || !dia) {
    return null;
  }

  return new Date(Date.UTC(ano, mes - 1, dia));
}

function calcularParcelasPrevistas(
  inicioContrato: string,
  terminoContrato: string,
  periodicidade: string
) {
  if (periodicidade === "unico") {
    return 1;
  }

  const inicio = parseDateUtc(inicioContrato);
  const termino = parseDateUtc(terminoContrato);

  if (!inicio || !termino || termino < inicio) {
    return 1;
  }

  const meses =
    (termino.getUTCFullYear() - inicio.getUTCFullYear()) * 12 +
    (termino.getUTCMonth() - inicio.getUTCMonth()) +
    (termino.getUTCDate() > inicio.getUTCDate() ? 1 : 0);
  const mesesContratados = Math.max(1, meses);
  const intervaloMeses =
    periodicidade === "bimestral"
      ? 2
      : periodicidade === "trimestral"
        ? 3
        : periodicidade === "semestral"
          ? 6
          : periodicidade === "anual"
            ? 12
            : 1;

  return Math.max(1, Math.ceil(mesesContratados / intervaloMeses));
}

function calcularValorTotalPrevisto(
  valorCentavos: string,
  inicioContrato: string,
  terminoContrato: string,
  periodicidade: string
) {
  const parcelas = calcularParcelasPrevistas(
    inicioContrato,
    terminoContrato,
    periodicidade
  );

  return Math.round(numeroDeCentavos(valorCentavos) * parcelas * 100);
}

function CampoTexto({
  name,
  label,
  defaultValue = "",
  required = false,
  type = "text",
  inputMode,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  required?: boolean;
  type?: string;
  inputMode?: "text" | "numeric" | "decimal";
  onChange?: (value: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue ?? ""}
        required={required}
        onChange={(event) => onChange?.(event.target.value)}
        className={inputClass}
      />
    </label>
  );
}

function CampoMoeda({
  name,
  label,
  defaultValue,
  readOnly = false,
  centavosTextoControlado,
  onCentavosChange,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  readOnly?: boolean;
  centavosTextoControlado?: string;
  onCentavosChange?: (value: string) => void;
}) {
  const [centavosTextoInterno, setCentavosTextoInterno] = useState(() =>
    centavosTextoDeValor(defaultValue)
  );
  const centavosTexto = centavosTextoControlado ?? centavosTextoInterno;

  return (
    <label className={labelClass}>
      {label}
      <input type="hidden" name={name} value={valorDecimalDeCentavos(centavosTexto)} />
      <input
        type="text"
        value={formatarMoedaCentavos(centavosTexto)}
        inputMode="numeric"
        placeholder="R$ 0,00"
        readOnly={readOnly}
        onChange={(event) => {
          const proximoValor = somenteDigitos(event.currentTarget.value);
          onCentavosChange?.(proximoValor);
          setCentavosTextoInterno(proximoValor);
        }}
        className={inputClass}
      />
    </label>
  );
}

function CampoSelecao({
  name,
  label,
  defaultValue,
  children,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  children: ReactNode;
  onChange?: (value: string) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        name={name}
        defaultValue={defaultValue ?? ""}
        onChange={(event) => onChange?.(event.target.value)}
        className={selectClass}
      >
        {children}
      </select>
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

function labelParceiro(parceiro: ContratoParceiroOpcao) {
  return `${parceiro.nome}${parceiro.codigo_interno ? ` (${parceiro.codigo_interno})` : ""}`;
}

function ConsultaParceiro({
  name,
  label,
  parceiros,
  defaultValue,
  excludeIds = [],
  onSelectedChange,
  required = false,
}: {
  name: string;
  label: string;
  parceiros: ContratoParceiroOpcao[];
  defaultValue?: string | null;
  excludeIds?: string[];
  onSelectedChange?: (id: string) => void;
  required?: boolean;
}) {
  const parceiroInicial = parceiros.find((parceiro) => parceiro.id === defaultValue) ?? null;
  const [busca, setBusca] = useState(parceiroInicial ? labelParceiro(parceiroInicial) : "");
  const [selecionadoId, setSelecionadoId] = useState(defaultValue ?? "");
  const [aberto, setAberto] = useState(false);
  const idsExcluidos = useMemo(() => new Set(excludeIds.filter(Boolean)), [excludeIds]);
  const termo = textoFiltro(busca);
  const deveMostrarOpcoes = aberto && !selecionadoId && busca.trim().length > 0;

  const opcoes = parceiros
    .filter((parceiro) => {
      if (idsExcluidos.has(parceiro.id)) {
        return false;
      }

      if (!termo) {
        return false;
      }

      return (
        textoFiltro(parceiro.nome).includes(termo) ||
        textoFiltro(parceiro.codigo_interno).includes(termo)
      );
    })
    .slice(0, 8);

  return (
    <label className={`${labelClass} relative`}>
      {label}
      <input type="hidden" name={name} value={selecionadoId} />
      <input
        type="search"
        value={busca}
        onChange={(event) => {
          const novoValor = event.target.value;
          setBusca(novoValor);
          setSelecionadoId("");
          onSelectedChange?.("");
          setAberto(novoValor.trim().length > 0);
        }}
        onFocus={() => setAberto(!selecionadoId && busca.trim().length > 0)}
        onBlur={() => window.setTimeout(() => setAberto(false), 120)}
        placeholder="Pesquisar por nome ou código"
        className={inputClass}
        aria-required={required}
      />
      {deveMostrarOpcoes ? (
        <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-30 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
          {opcoes.length > 0 ? (
            opcoes.map((parceiro) => (
              <button
                key={parceiro.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setSelecionadoId(parceiro.id);
                  setBusca(labelParceiro(parceiro));
                  setAberto(false);
                  onSelectedChange?.(parceiro.id);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-gray-800 transition hover:bg-gray-50"
              >
                <span className="truncate">{labelParceiro(parceiro)}</span>
                <span className="text-xs font-semibold text-gray-500">
                  {parceiro.ativo ? "Ativo" : "Inativo"}
                </span>
              </button>
            ))
          ) : (
            <span className="block px-3 py-2 text-sm text-gray-500">
              Nenhum cliente encontrado.
            </span>
          )}
        </div>
      ) : null}
    </label>
  );
}

function StatusSelect({ defaultValue = "ativo" }: { defaultValue?: StatusContrato }) {
  return (
    <CampoSelecao name="status" label="Situação" defaultValue={defaultValue}>
      {STATUS_CONTRATO.map((status) => (
        <option key={status} value={status}>
          {LABEL_STATUS_CONTRATO[status]}
        </option>
      ))}
    </CampoSelecao>
  );
}

function ContratoForm({
  contrato,
  parceiros,
  parceiroInicial,
  onCancel,
}: {
  contrato: ContratoListItem | null;
  parceiros: ContratoParceiroOpcao[];
  parceiroInicial?: string | null;
  onCancel: () => void;
}) {
  const hoje = new Date().toISOString().slice(0, 10);
  const [cobrarOutroContato, setCobrarOutroContato] = useState(
    contrato?.cobrar_outro_contato ?? false
  );
  const [parceiroSelecionadoId, setParceiroSelecionadoId] = useState(
    contrato?.parceiro_id ?? parceiroInicial ?? ""
  );
  const [valorCentavos, setValorCentavos] = useState(() =>
    centavosTextoDeValor(contrato?.valor)
  );
  const [inicioContrato, setInicioContrato] = useState(
    contrato?.vigencia_inicio ?? contrato?.data_contrato ?? hoje
  );
  const [terminoContrato, setTerminoContrato] = useState(
    contrato?.vigencia_fim ?? ""
  );
  const [periodicidade, setPeriodicidade] = useState(
    contrato?.periodicidade ?? "mensal"
  );
  const valorTotalPrevistoCentavos = calcularValorTotalPrevisto(
    valorCentavos,
    inicioContrato,
    terminoContrato,
    periodicidade
  ).toString();

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-950">
            {contrato ? "Editar contrato" : "Novo contrato"}
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Preencha os dados comerciais e fiscais do contrato vinculado ao cliente.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex min-h-9 w-fit items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
      <form action={salvarContratoGerencia} className="space-y-5 p-4">
        <input type="hidden" name="id" value={contrato?.id ?? ""} />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <div className="xl:col-span-4">
            <ConsultaParceiro
              name="parceiro_id"
              label="Cliente"
              parceiros={parceiros}
              defaultValue={contrato?.parceiro_id ?? parceiroInicial}
              onSelectedChange={setParceiroSelecionadoId}
              required
            />
          </div>
          <label className="flex min-h-9 items-center gap-2 self-end rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700 xl:col-span-2">
            <input
              type="checkbox"
              name="cobrar_outro_contato"
              checked={cobrarOutroContato}
              onChange={(event) => setCobrarOutroContato(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Cobrar de outro contato
          </label>
          {cobrarOutroContato ? (
            <div className="md:col-span-2 xl:col-span-6">
              <ConsultaParceiro
                key={`cobranca-${parceiroSelecionadoId}`}
                name="cobranca_parceiro_id"
                label="Cliente de cobrança"
                parceiros={parceiros}
                defaultValue={
                  contrato?.cobranca_parceiro_id === parceiroSelecionadoId
                    ? null
                    : contrato?.cobranca_parceiro_id
                }
                excludeIds={parceiroSelecionadoId ? [parceiroSelecionadoId] : []}
                required
              />
            </div>
          ) : (
            <input type="hidden" name="cobranca_parceiro_id" value="" />
          )}
          <CampoTexto
            name="contrato"
            label="Número do contrato"
            defaultValue={contrato?.contrato}
            required
          />
          <div className="md:col-span-2 xl:col-span-3">
            <CampoTexto
              name="descricao_contrato"
              label="Descrição do contrato"
              defaultValue={contrato?.descricao_contrato}
            />
          </div>
          <StatusSelect defaultValue={contrato?.status ?? "ativo"} />
          <CampoTexto
            name="vigencia_inicio"
            label="Início do contrato"
            type="date"
            defaultValue={inicioContrato}
            onChange={setInicioContrato}
          />
          <input type="hidden" name="data_contrato" value={inicioContrato} />
          <CampoTexto
            name="vigencia_fim"
            label="Término do contrato"
            type="date"
            defaultValue={terminoContrato}
            onChange={setTerminoContrato}
          />
          <CampoMoeda
            name="valor"
            label="Valor"
            defaultValue={contrato?.valor}
            centavosTextoControlado={valorCentavos}
            onCentavosChange={setValorCentavos}
          />
          <CampoTexto
            name="data_base"
            label="Data base"
            type="date"
            defaultValue={contrato?.data_base ?? hoje}
          />
          <CampoSelecao
            name="vencimento"
            label="Vencimento"
            defaultValue={contrato?.vencimento ?? "mes_corrente"}
          >
            {OPCOES_VENCIMENTO.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </CampoSelecao>
          <CampoTexto
            name="dia_vencimento"
            label="Dia"
            defaultValue={contrato?.dia_vencimento}
            inputMode="numeric"
          />
          <CampoSelecao
            name="periodicidade"
            label="Periodicidade"
            defaultValue={periodicidade}
            onChange={setPeriodicidade}
          >
            {OPCOES_PERIODICIDADE.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </CampoSelecao>
          <CampoMoeda
            name="valor_total_previsto"
            label="Valor total previsto"
            centavosTextoControlado={valorTotalPrevistoCentavos}
            readOnly
          />
          <CampoSelecao
            name="impressao_periodo_cobranca"
            label="Impressão do período de cobrança"
            defaultValue={contrato?.impressao_periodo_cobranca ?? "nao_imprime"}
          >
            {OPCOES_IMPRESSAO.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </CampoSelecao>
          <label className="flex min-h-9 items-center gap-2 self-end rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
            <input
              type="checkbox"
              name="renovacao_automatica"
              defaultChecked={contrato?.renovacao_automatica ?? false}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Renovação automática
          </label>
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <h3 className="text-sm font-bold text-gray-950">Nota fiscal</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <CampoSelecao
              name="gerar_nota_fiscal"
              label="Gerar nota fiscal"
              defaultValue={contrato?.gerar_nota_fiscal ? "sim" : "nao"}
            >
              <option value="nao">Não</option>
              <option value="sim">Sim</option>
            </CampoSelecao>
            <CampoTexto name="sla" label="SLA" defaultValue={contrato?.sla} />
          </div>
        </div>

        <label className={labelClass}>
          Observações
          <textarea
            name="observacoes"
            defaultValue={contrato?.observacoes ?? ""}
            rows={4}
            className={`${inputClass} min-h-24 resize-y`}
          />
        </label>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Salvar
          </button>
        </div>
      </form>
    </section>
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
  const [formAberto, setFormAberto] = useState(false);
  const [contratoEmEdicaoId, setContratoEmEdicaoId] = useState("");
  const contratoEmEdicao =
    contratos.find((contrato) => contrato.id === contratoEmEdicaoId) ?? null;

  const contratosFiltrados = useMemo(
    () =>
      contratos.filter((contrato) => {
        const clienteMatch =
          !filtros.cliente || contrato.parceiro_id === filtros.cliente;
        const contratoMatch =
          textoFiltro(contrato.contrato).includes(textoFiltro(filtros.contrato)) ||
          textoFiltro(contrato.descricao_contrato).includes(textoFiltro(filtros.contrato)) ||
          textoFiltro(contrato.sla).includes(textoFiltro(filtros.contrato)) ||
          textoFiltro(contrato.parceiro_nome).includes(textoFiltro(filtros.contrato));
        const statusMatch =
          filtros.status === "todos" || contrato.status === filtros.status;

        return clienteMatch && contratoMatch && statusMatch;
      }),
    [contratos, filtros]
  );
  const valorTotalPrevisto = contratos.reduce(
    (total, contrato) =>
      total + Number(contrato.valor_total_previsto ?? contrato.valor ?? 0),
    0
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

  function novoContrato() {
    setContratoEmEdicaoId("");
    setFormAberto(true);
  }

  function editarContrato(id: string) {
    setContratoEmEdicaoId(id);
    setFormAberto(true);
  }

  function fecharFormulario() {
    setContratoEmEdicaoId("");
    setFormAberto(false);
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-fit rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
            Total: {contratos.length}
          </span>
          <span className="w-fit rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
            Previsto: {formatarMoeda(valorTotalPrevisto)}
          </span>
          <button
            type="button"
            onClick={novoContrato}
            className="inline-flex min-h-10 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Novo contrato
          </button>
        </div>
      </div>

      {erro ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          Não foi possível salvar o contrato. Confira cliente, contrato e situação.
        </div>
      ) : null}

      {salvo ? (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
          Contrato salvo com sucesso.
        </div>
      ) : null}

      <div className="space-y-4">
        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-bold text-gray-950">Registros</h2>
            <p className="mt-1 text-xs text-gray-600">
              Pesquise contratos por cliente, descrição, número, SLA ou situação.
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
                    {labelParceiro(parceiro)}
                  </option>
                ))}
              </CampoFiltroSelecao>
              <CampoFiltroTexto
                label="Busca"
                value={filtros.contrato}
                onChange={(valor) => atualizarFiltro("contrato", valor)}
                placeholder="Número, descrição, cliente ou SLA"
              />
              <CampoFiltroSelecao
                label="Situação"
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
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Número</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Valor</th>
                  <th className="px-4 py-3">Periodicidade</th>
                  <th className="px-4 py-3">Vencimento</th>
                  <th className="px-4 py-3">Situação</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contratosPaginados.map((contrato) => (
                  <tr key={contrato.id} className="align-top">
                    <td className="px-4 py-3 font-semibold text-gray-950">
                      <div>{contrato.parceiro_nome}</div>
                      {contrato.cobranca_parceiro_nome ? (
                        <div className="mt-1 text-xs font-semibold text-gray-500">
                          Cobrança: {contrato.cobranca_parceiro_nome}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{contrato.contrato}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {contrato.descricao_contrato || contrato.observacoes || "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatarMoeda(contrato.valor)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {OPCOES_PERIODICIDADE.find(([value]) => value === contrato.periodicidade)?.[1] ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {contrato.dia_vencimento
                        ? `Dia ${contrato.dia_vencimento}`
                        : formatarData(contrato.vigencia_fim)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {LABEL_STATUS_CONTRATO[contrato.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => editarContrato(contrato.id)}
                          className="min-h-9 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                        >
                          Ver / editar
                        </button>
                        <Link
                          href={`/cadastros/parceiros/${contrato.parceiro_id}`}
                          className="min-h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                        >
                          Abrir cliente
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {contratos.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-sm text-gray-600">
                      Nenhum contrato cadastrado.
                    </td>
                  </tr>
                ) : null}

                {contratos.length > 0 && contratosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-4 text-sm text-gray-600">
                      Nenhum contrato encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
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

        {formAberto ? (
          <ContratoForm
            key={contratoEmEdicao?.id ?? "novo-contrato"}
            contrato={contratoEmEdicao}
            parceiros={parceiros}
            parceiroInicial={parceiroInicial}
            onCancel={fecharFormulario}
          />
        ) : null}
      </div>
    </section>
  );
}
