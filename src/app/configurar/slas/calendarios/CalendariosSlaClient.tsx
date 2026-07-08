"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CatalogoPaginacao } from "../../CatalogoConfiguracaoClient";
import { AgendaSemanalAtendimento } from "@/components/AgendaSemanalAtendimento";
import {
  montarAgendaAtendimentoInicial,
  serializarAgendaAtendimento,
  validarAgendaAtendimento,
  type DiaAtendimento,
} from "@/lib/agenda-semanal";
import { salvarCalendarioSla } from "../actions";

export type CalendarioSlaHorarioItem = {
  dia_semana: number;
  fechado: boolean;
  abre_as: string | null;
  fecha_as: string | null;
  ordem: number;
};

export type CalendarioSlaListItem = {
  id: string;
  nome: string;
  codigo: string;
  descricao: string | null;
  fuso_horario: string;
  regime_24x7: boolean;
  atendimento_feriados: boolean;
  ativo: boolean;
  atualizado_em: string;
  referencias: number;
  horarios: CalendarioSlaHorarioItem[];
};

type Props = {
  calendarios: CalendarioSlaListItem[];
  pageVersion: string;
  erroCarregamento?: string | null;
};

type Filtros = {
  busca: string;
  ativo: "todos" | "ativos" | "inativos";
  regime: "todos" | "24x7" | "agenda";
};

const FILTROS_INICIAIS: Filtros = {
  busca: "",
  ativo: "todos",
  regime: "todos",
};

const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";
const labelClass = "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";

function textoFiltro(valor: string | number | boolean | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
}

function codigoPreview(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function CalendarioForm({
  calendario,
  onSaved,
}: {
  calendario?: CalendarioSlaListItem | null;
  onSaved: () => void;
}) {
  const [nome, setNome] = useState(calendario?.nome ?? "");
  const [codigo, setCodigo] = useState(calendario?.codigo ?? "");
  const [descricao, setDescricao] = useState(calendario?.descricao ?? "");
  const [fusoHorario, setFusoHorario] = useState(
    calendario?.fuso_horario ?? "America/Fortaleza"
  );
  const [regime24x7, setRegime24x7] = useState(calendario?.regime_24x7 ?? false);
  const [atendimentoFeriados, setAtendimentoFeriados] = useState(
    calendario?.atendimento_feriados ?? false
  );
  const [ativo, setAtivo] = useState(calendario?.ativo ?? true);
  const [agenda, setAgenda] = useState<DiaAtendimento[]>(() =>
    montarAgendaAtendimentoInicial(calendario?.horarios)
  );
  const [erroAgenda, setErroAgenda] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();
  const codigoEfetivo = codigo || codigoPreview(nome);

  function salvar() {
    const erroValidacaoAgenda = regime24x7 ? "" : validarAgendaAtendimento(agenda);
    setErroAgenda(erroValidacaoAgenda);

    if (erroValidacaoAgenda) {
      return;
    }

    setErro("");
    setMensagem("");
    startTransition(async () => {
      const resultado = await salvarCalendarioSla({
        id: calendario?.id,
        nome,
        codigo: codigoEfetivo,
        descricao,
        fuso_horario: fusoHorario,
        regime_24x7: regime24x7,
        atendimento_feriados: atendimentoFeriados,
        ativo,
        horarios: serializarAgendaAtendimento(agenda),
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
            {calendario ? "Editar horário" : "Novo horário"}
          </h2>
          <p className="mt-1 text-xs text-gray-600">
            Define a agenda de funcionamento reutilizada por parceiros e SLAs.
          </p>
        </div>
      </div>
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
          Fuso horário
          <input
            value={fusoHorario}
            onChange={(event) => setFusoHorario(event.target.value)}
            className={inputClass}
          />
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
        <label className="md:col-span-2 xl:col-span-4">
          <span className={labelClass}>Descrição</span>
          <textarea
            value={descricao}
            onChange={(event) => setDescricao(event.target.value)}
            rows={3}
            className={`${inputClass} min-h-20 resize-y`}
          />
        </label>
      </div>
      <div className="grid gap-3 border-t border-gray-100 p-4 md:grid-cols-2">
        <label className="flex min-h-9 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={regime24x7}
            onChange={(event) => setRegime24x7(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Regime 24x7
        </label>
        <label className="flex min-h-9 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={atendimentoFeriados}
            onChange={(event) => setAtendimentoFeriados(event.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          Atendimento em feriados
        </label>
        {!regime24x7 ? (
          <AgendaSemanalAtendimento
            agenda={agenda}
            onChange={(proximaAgenda) => {
              setAgenda(proximaAgenda);
              setErroAgenda("");
            }}
            erro={erroAgenda}
          />
        ) : (
          <p className="md:col-span-full rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
            Funcionamento 24x7: a agenda semanal não limita a disponibilidade.
          </p>
        )}
      </div>
      {erro || mensagem ? (
        <div className="border-t border-gray-100 px-4 py-3">
          {erro ? <p className="text-sm font-semibold text-red-600">{erro}</p> : null}
          {mensagem ? <p className="text-sm font-semibold text-emerald-700">{mensagem}</p> : null}
        </div>
      ) : null}
      <div className="flex flex-col gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={salvar}
          disabled={isPending}
          className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-wait disabled:opacity-70"
        >
          {isPending ? "Salvando..." : "Salvar horário"}
        </button>
      </div>
    </section>
  );
}

export function CalendariosSlaClient({
  calendarios,
  pageVersion,
  erroCarregamento,
}: Props) {
  const [editandoId, setEditandoId] = useState("");
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const calendarioEmEdicao = calendarios.find((item) => item.id === editandoId) ?? null;
  const calendariosFiltrados = useMemo(
    () =>
      calendarios.filter((item) => {
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
        const regimeMatch =
          filtros.regime === "todos" ||
          (filtros.regime === "24x7" && item.regime_24x7) ||
          (filtros.regime === "agenda" && !item.regime_24x7);

        return buscaMatch && ativoMatch && regimeMatch;
      }),
    [calendarios, filtros]
  );
  const totalPaginas = Math.max(1, Math.ceil(calendariosFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const itensPaginados = calendariosFiltrados.slice(inicioPagina, inicioPagina + itensPorPagina);
  const primeiroItemVisivel = calendariosFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const ultimoItemVisivel = Math.min(inicioPagina + itensPorPagina, calendariosFiltrados.length);

  function atualizarFiltro<K extends keyof Filtros>(campo: K, valor: Filtros[K]) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
    setPaginaAtual(1);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <nav className="flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Link href="/configurar/slas" className="hover:text-gray-950">Configurar</Link>
            <span className="text-gray-400">&gt;</span>
            <span className="text-gray-950">Horários de Funcionamento</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
              Horários de Funcionamento
            </h1>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {pageVersion}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Cadastre agendas de trabalho reutilizadas no funcionamento dos parceiros e na contagem de SLA.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <span className="w-fit rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
            Total: {calendarios.length}
          </span>
          <button
            type="button"
            onClick={() => setEditandoId("")}
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Novo horário
          </button>
        </div>
      </div>

      {erroCarregamento ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {erroCarregamento}
        </div>
      ) : null}

      <div className="space-y-4">
        {!erroCarregamento ? (
          <CalendarioForm
            key={calendarioEmEdicao?.id ?? "novo"}
            calendario={calendarioEmEdicao}
            onSaved={() => setEditandoId("")}
          />
        ) : null}

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3">
            <h2 className="text-base font-bold text-gray-950">Registros</h2>
            <p className="mt-1 text-xs text-gray-600">
              Filtre e edite horários de funcionamento reutilizáveis.
            </p>
          </div>
          <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-2 xl:grid-cols-[1.5fr_0.8fr_0.8fr_auto] xl:items-end">
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
              Regime
              <select
                value={filtros.regime}
                onChange={(event) => atualizarFiltro("regime", event.target.value as Filtros["regime"])}
                className={inputClass}
              >
                <option value="todos">Todos</option>
                <option value="24x7">24x7</option>
                <option value="agenda">Agenda semanal</option>
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
            <table className="min-w-[980px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Regime</th>
                  <th className="px-4 py-3">Feriados</th>
                  <th className="px-4 py-3">Vínculos</th>
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
                    <td className="px-4 py-3 text-gray-700">
                      {item.regime_24x7 ? "24x7" : "Agenda semanal"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.atendimento_feriados ? "Conta feriados" : "Ignora feriados"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.referencias}</td>
                    <td className="px-4 py-3 text-gray-700">{formatarData(item.atualizado_em)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setEditandoId(item.id)}
                        className="min-h-9 rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
                {calendarios.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-sm text-gray-600">
                      Nenhum calendário cadastrado.
                    </td>
                  </tr>
                ) : null}
                {calendarios.length > 0 && calendariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-4 text-sm text-gray-600">
                      Nenhum calendário encontrado com os filtros aplicados.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <CatalogoPaginacao
            primeiroItemVisivel={primeiroItemVisivel}
            ultimoItemVisivel={ultimoItemVisivel}
            totalItens={calendariosFiltrados.length}
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
