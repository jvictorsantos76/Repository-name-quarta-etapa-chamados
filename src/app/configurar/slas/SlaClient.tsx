"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CatalogoPaginacao } from "../CatalogoConfiguracaoClient";
import {
  alterarStatusSla,
  duplicarSla,
  salvarSla,
  type SlaMetaInput,
} from "./actions";

export type CalendarioSlaOpcao = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
};

export type SlaMetaItem = SlaMetaInput & {
  id: string;
};

export type SlaListItem = {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  tipo: "padrao" | "contratual" | "especial";
  calendario_sla_id: string;
  calendario_nome: string;
  ativo: boolean;
  observacoes_internas: string | null;
  versao_atual: number;
  atualizado_em: string;
  metas: SlaMetaItem[];
  vinculos: number;
  versoes: number;
};

type Props = {
  slas: SlaListItem[];
  calendarios: CalendarioSlaOpcao[];
  pageVersion: string;
  erroCarregamento?: string | null;
};

type Filtros = {
  busca: string;
  ativo: "todos" | "ativos" | "inativos";
  tipo: "todos" | "padrao" | "contratual" | "especial";
  calendario: string;
};

const FILTROS_INICIAIS: Filtros = {
  busca: "",
  ativo: "todos",
  tipo: "todos",
  calendario: "",
};

const TIPOS_SLA = [
  ["padrao", "Padrão"],
  ["contratual", "Contratual"],
  ["especial", "Especial"],
] as const;
const PRIORIDADES = [
  ["critica", "P1 - Crítica"],
  ["alta", "P2 - Alta"],
  ["media", "P3 - Média"],
  ["baixa", "P4 - Baixa"],
] as const;
const METAS = [
  ["primeira_resposta", "Primeira resposta"],
  ["inicio_remoto", "Início remoto"],
  ["chegada_presencial", "Chegada presencial"],
  ["resolucao", "Resolução"],
] as const;
const PRAZOS_PADRAO: Record<string, number> = {
  critica_primeira_resposta: 15,
  critica_inicio_remoto: 30,
  critica_chegada_presencial: 120,
  critica_resolucao: 240,
  alta_primeira_resposta: 30,
  alta_inicio_remoto: 60,
  alta_chegada_presencial: 240,
  alta_resolucao: 480,
  media_primeira_resposta: 120,
  media_inicio_remoto: 240,
  media_chegada_presencial: 480,
  media_resolucao: 960,
  baixa_primeira_resposta: 240,
  baixa_inicio_remoto: 480,
  baixa_chegada_presencial: 960,
  baixa_resolucao: 1440,
};
const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";
const labelClass = "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";

function criarMetasPadrao(): SlaMetaInput[] {
  return PRIORIDADES.flatMap(([prioridade]) =>
    METAS.map(([meta_codigo]) => ({
      prioridade,
      meta_codigo,
      prazo_minutos: PRAZOS_PADRAO[`${prioridade}_${meta_codigo}`],
      ativa: true,
      permitir_pausa: meta_codigo !== "primeira_resposta",
      usar_janela_cliente: meta_codigo === "chegada_presencial",
    }))
  );
}

function codigoPreview(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function textoFiltro(valor: string | number | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

function labelTipo(tipo: SlaListItem["tipo"]) {
  return TIPOS_SLA.find(([value]) => value === tipo)?.[1] ?? tipo;
}

function labelMeta(metaCodigo: string) {
  return METAS.find(([value]) => value === metaCodigo)?.[1] ?? metaCodigo;
}

function labelPrioridade(prioridade: string) {
  return PRIORIDADES.find(([value]) => value === prioridade)?.[1] ?? prioridade;
}

function SlaForm({
  sla,
  calendarios,
  onSaved,
}: {
  sla?: SlaListItem | null;
  calendarios: CalendarioSlaOpcao[];
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(sla?.nome ?? "");
  const [codigo, setCodigo] = useState(sla?.codigo ?? "");
  const [descricao, setDescricao] = useState(sla?.descricao ?? "");
  const [tipo, setTipo] = useState<SlaListItem["tipo"]>(sla?.tipo ?? "padrao");
  const [calendarioId, setCalendarioId] = useState(
    sla?.calendario_sla_id ?? calendarios.find((item) => item.ativo)?.id ?? ""
  );
  const [ativo, setAtivo] = useState(sla?.ativo ?? true);
  const [observacoes, setObservacoes] = useState(sla?.observacoes_internas ?? "");
  const [metas, setMetas] = useState<SlaMetaInput[]>(() =>
    sla?.metas.length
      ? sla.metas.map((meta) => ({
          meta_codigo: meta.meta_codigo,
          prioridade: meta.prioridade,
          prazo_minutos: meta.prazo_minutos,
          ativa: meta.ativa,
          permitir_pausa: meta.permitir_pausa,
          usar_janela_cliente: meta.usar_janela_cliente,
        }))
      : criarMetasPadrao()
  );
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();
  const codigoEfetivo = codigo || codigoPreview(nome);

  function atualizarMeta(
    prioridade: SlaMetaInput["prioridade"],
    metaCodigo: string,
    patch: Partial<SlaMetaInput>
  ) {
    setMetas((atuais) =>
      atuais.map((meta) =>
        meta.prioridade === prioridade && meta.meta_codigo === metaCodigo
          ? { ...meta, ...patch }
          : meta
      )
    );
  }

  function salvar() {
    setErro("");
    setMensagem("");
    startTransition(async () => {
      const resultado = await salvarSla({
        id: sla?.id,
        nome,
        codigo: codigoEfetivo,
        descricao,
        tipo,
        calendario_sla_id: calendarioId,
        ativo,
        observacoes_internas: observacoes,
        metas,
      });

      if (!resultado.ok) {
        setErro(resultado.error);
        return;
      }

      setMensagem(resultado.message);
      onSaved();
    });
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-950">
            {sla ? `Editar SLA v${sla.versao_atual}` : "Novo SLA"}
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Cadastro estrutural do acordo. Cálculo automático entra em fase posterior.
          </p>
        </div>
        <button
          type="button"
          onClick={salvar}
          disabled={isPending || calendarios.length === 0}
          className="min-h-9 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Salvando..." : "Salvar SLA"}
        </button>
      </div>
      {calendarios.length === 0 ? (
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          Cadastre um calendário de SLA antes de criar o SLA.
        </div>
      ) : null}
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
        <label className={labelClass}>
          Nome
          <input value={nome} onChange={(event) => setNome(event.target.value)} className={inputClass} />
        </label>
        <label className={labelClass}>
          Código
          <input
            value={codigoEfetivo}
            onChange={(event) => setCodigo(event.target.value)}
            className={inputClass}
          />
        </label>
        <label className={labelClass}>
          Tipo
          <select
            value={tipo}
            onChange={(event) => setTipo(event.target.value as SlaListItem["tipo"])}
            className={inputClass}
          >
            {TIPOS_SLA.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex min-h-9 items-center gap-2 self-end rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={ativo}
            onChange={(event) => setAtivo(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Ativo
        </label>
        <label className="md:col-span-2">
          <span className={labelClass}>Calendário do SLA</span>
          <select
            value={calendarioId}
            onChange={(event) => setCalendarioId(event.target.value)}
            className={inputClass}
          >
            <option value="">Selecione</option>
            {calendarios.map((calendario) => (
              <option key={calendario.id} value={calendario.id}>
                {calendario.nome} ({calendario.codigo})
              </option>
            ))}
          </select>
        </label>
        <label className="md:col-span-2">
          <span className={labelClass}>Descrição</span>
          <textarea
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            rows={3}
            className={`${inputClass} min-h-20 resize-y`}
          />
        </label>
        <label className="md:col-span-2 xl:col-span-4">
          <span className={labelClass}>Observações internas</span>
          <textarea
            value={observacoes}
            onChange={(event) => setObservacoes(event.target.value)}
            rows={3}
            className={`${inputClass} min-h-20 resize-y`}
          />
        </label>
      </div>
      <div className="border-t border-gray-100 p-4">
        <h3 className="text-sm font-bold text-gray-950">Metas por prioridade</h3>
        <div className="mt-3 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
            <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-3 py-2">Prioridade</th>
                <th className="px-3 py-2">Meta</th>
                <th className="px-3 py-2">Prazo (min)</th>
                <th className="px-3 py-2">Ativa</th>
                <th className="px-3 py-2">Permite pausa</th>
                <th className="px-3 py-2">Usa janela do cliente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {metas.map((meta) => (
                <tr key={`${meta.prioridade}-${meta.meta_codigo}`}>
                  <td className="px-3 py-2 font-semibold text-gray-950">
                    {labelPrioridade(meta.prioridade)}
                  </td>
                  <td className="px-3 py-2 text-gray-700">{labelMeta(meta.meta_codigo)}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={meta.prazo_minutos}
                      onChange={(event) =>
                        atualizarMeta(meta.prioridade, meta.meta_codigo, {
                          prazo_minutos: Number(event.target.value || 0),
                        })
                      }
                      className={inputClass}
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={meta.ativa}
                      onChange={(event) =>
                        atualizarMeta(meta.prioridade, meta.meta_codigo, {
                          ativa: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={meta.permitir_pausa}
                      onChange={(event) =>
                        atualizarMeta(meta.prioridade, meta.meta_codigo, {
                          permitir_pausa: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={meta.usar_janela_cliente}
                      onChange={(event) =>
                        atualizarMeta(meta.prioridade, meta.meta_codigo, {
                          usar_janela_cliente: event.target.checked,
                        })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {erro || mensagem ? (
        <div className="border-t border-gray-100 px-4 py-3">
          {erro ? <p className="text-sm font-semibold text-red-600">{erro}</p> : null}
          {mensagem ? <p className="text-sm font-semibold text-emerald-700">{mensagem}</p> : null}
        </div>
      ) : null}
    </section>
  );
}

function AcoesSla({ item, onMessage }: { item: SlaListItem; onMessage: (message: string) => void }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const resultado = await alterarStatusSla(item.id, !item.ativo);
            onMessage(resultado.ok ? resultado.message : resultado.error);
          })
        }
        className="min-h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-wait"
      >
        {item.ativo ? "Inativar" : "Ativar"}
      </button>
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const resultado = await duplicarSla(item.id);
            onMessage(resultado.ok ? resultado.message : resultado.error);
          })
        }
        className="min-h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-wait"
      >
        Duplicar
      </button>
    </div>
  );
}

export function SlaClient({ slas, calendarios, pageVersion, erroCarregamento }: Props) {
  const [editandoId, setEditandoId] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [mensagemAcao, setMensagemAcao] = useState("");
  const slaEmEdicao = slas.find((item) => item.id === editandoId) ?? null;
  const slasFiltrados = useMemo(
    () =>
      slas.filter((item) => {
        const busca = textoFiltro(filtros.busca);
        const buscaMatch =
          !busca ||
          textoFiltro(item.nome).includes(busca) ||
          textoFiltro(item.codigo).includes(busca) ||
          textoFiltro(item.descricao).includes(busca);
        const ativoMatch =
          filtros.ativo === "todos" ||
          (filtros.ativo === "ativos" && item.ativo) ||
          (filtros.ativo === "inativos" && !item.ativo);
        const tipoMatch = filtros.tipo === "todos" || item.tipo === filtros.tipo;
        const calendarioMatch =
          !filtros.calendario || item.calendario_sla_id === filtros.calendario;

        return buscaMatch && ativoMatch && tipoMatch && calendarioMatch;
      }),
    [filtros, slas]
  );
  const totalPaginas = Math.max(1, Math.ceil(slasFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const itensPaginados = slasFiltrados.slice(inicioPagina, inicioPagina + itensPorPagina);
  const primeiroItemVisivel = slasFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const ultimoItemVisivel = Math.min(inicioPagina + itensPorPagina, slasFiltrados.length);

  function atualizarFiltro<K extends keyof Filtros>(campo: K, valor: Filtros[K]) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
    setPaginaAtual(1);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link href="/chamados/novo" className="text-xs font-semibold text-blue-600">
            Voltar para novo chamado
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">SLAs</h1>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {pageVersion}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Modelos contratuais de prazos para chamados. A janela operacional do cliente permanece separada.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-fit rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
            Total: {slas.length}
          </span>
          <Link
            href="/configurar/slas/calendarios"
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Horários de Funcionamento
          </Link>
        </div>
      </div>

      {erroCarregamento ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {erroCarregamento}
        </div>
      ) : null}
      {mensagemAcao ? (
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm font-semibold text-blue-700">
          {mensagemAcao}
        </div>
      ) : null}

      <div className="space-y-4">
        <SlaForm
          key={slaEmEdicao?.id ?? "novo"}
          sla={slaEmEdicao}
          calendarios={calendarios}
          onSaved={() => setEditandoId("")}
        />

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-bold text-gray-950">Registros</h2>
            <p className="mt-1 text-xs text-gray-600">
              Filtre, edite, duplique e inative SLAs sem exclusão física.
            </p>
          </div>
          <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-2 xl:grid-cols-[1.5fr_0.8fr_0.8fr_1fr_auto] xl:items-end">
            <label className={labelClass}>
              Busca
              <input
                value={filtros.busca}
                onChange={(event) => atualizarFiltro("busca", event.target.value)}
                placeholder="Nome, código ou descrição"
                className={inputClass}
              />
            </label>
            <label className={labelClass}>
              Status
              <select
                value={filtros.ativo}
                onChange={(event) => atualizarFiltro("ativo", event.target.value as Filtros["ativo"])}
                className={inputClass}
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </select>
            </label>
            <label className={labelClass}>
              Tipo
              <select
                value={filtros.tipo}
                onChange={(event) => atualizarFiltro("tipo", event.target.value as Filtros["tipo"])}
                className={inputClass}
              >
                <option value="todos">Todos</option>
                {TIPOS_SLA.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Calendário
              <select
                value={filtros.calendario}
                onChange={(event) => atualizarFiltro("calendario", event.target.value)}
                className={inputClass}
              >
                <option value="">Todos</option>
                {calendarios.map((calendario) => (
                  <option key={calendario.id} value={calendario.id}>
                    {calendario.nome}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setFiltros(FILTROS_INICIAIS)}
              className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white"
            >
              Limpar
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[1160px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Calendário</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Metas</th>
                  <th className="px-4 py-3">Vínculos</th>
                  <th className="px-4 py-3">Versão</th>
                  <th className="px-4 py-3">Atualizado</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itensPaginados.map((item) => (
                  <tr key={item.id} className="align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gray-950">{item.nome}</div>
                      <div className="mt-1 text-xs text-gray-500">
                        {item.ativo ? "Ativo" : "Inativo"}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{item.codigo}</td>
                    <td className="px-4 py-3 text-gray-700">{item.calendario_nome}</td>
                    <td className="px-4 py-3 text-gray-700">{labelTipo(item.tipo)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.metas.filter((meta) => meta.ativa).length}/{item.metas.length}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.vinculos}</td>
                    <td className="px-4 py-3 text-gray-700">v{item.versao_atual}</td>
                    <td className="px-4 py-3 text-gray-700">{formatarData(item.atualizado_em)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setEditandoId(item.id)}
                          className="min-h-9 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                        >
                          Editar
                        </button>
                        <AcoesSla item={item} onMessage={setMensagemAcao} />
                      </div>
                    </td>
                  </tr>
                ))}
                {slas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-4 text-sm text-gray-600">
                      Nenhum SLA cadastrado.
                    </td>
                  </tr>
                ) : null}
                {slas.length > 0 && slasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-4 text-sm text-gray-600">
                      Nenhum SLA encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <CatalogoPaginacao
            primeiroItemVisivel={primeiroItemVisivel}
            ultimoItemVisivel={ultimoItemVisivel}
            totalItens={slasFiltrados.length}
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
