"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CatalogoPaginacao,
  OPCOES_CATALOGOS_ITENS_POR_PAGINA,
} from "@/app/configurar/CatalogoConfiguracaoClient";
import { alterarStatusParceiro } from "./actions";
import {
  LABEL_SITUACAO_PARCEIRO,
  LABEL_TIPO_PARCEIRO,
  SITUACOES_PARCEIRO,
  TIPOS_PARCEIRO,
  type ParceiroResumo,
  type SituacaoParceiro,
  type TipoParceiro,
} from "./types";

type Props = {
  parceiros: ParceiroResumo[];
};

type FiltrosParceiros = {
  busca: string;
  tipo: "todos" | TipoParceiro;
  situacao: "todas" | SituacaoParceiro;
  origem: "todos" | "legado" | "novo";
};

const FILTROS_INICIAIS: FiltrosParceiros = {
  busca: "",
  tipo: "todos",
  situacao: "todas",
  origem: "todos",
};

const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";
const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";

function textoFiltro(valor: string | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
}

function formatarData(valor: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(valor));
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
        className={inputClass}
      >
        {children}
      </select>
    </label>
  );
}

function StatusButton({ parceiro }: { parceiro: ParceiroResumo }) {
  const router = useRouter();
  const [erro, setErro] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await alterarStatusParceiro(parceiro.id, !parceiro.ativo);
              setErro("");
              router.refresh();
            } catch {
              setErro("Não foi possível alterar o status.");
            }
          })
        }
        className="min-h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {isPending ? "Salvando..." : parceiro.ativo ? "Inativar" : "Ativar"}
      </button>
      {erro ? <span className="text-xs font-semibold text-red-600">{erro}</span> : null}
    </div>
  );
}

export function ParceirosTable({ parceiros }: Props) {
  const [filtros, setFiltros] = useState<FiltrosParceiros>(FILTROS_INICIAIS);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const parceirosFiltrados = useMemo(
    () =>
      parceiros.filter((parceiro) => {
        const busca = textoFiltro(filtros.busca);
        const buscaMatch =
          !busca ||
          textoFiltro(parceiro.razao_social).includes(busca) ||
          textoFiltro(parceiro.nome_fantasia).includes(busca) ||
          textoFiltro(parceiro.codigo_interno).includes(busca) ||
          textoFiltro(parceiro.cnpj_cpf).includes(busca);
        const tipoMatch =
          filtros.tipo === "todos" || parceiro.tipo_parceiro === filtros.tipo;
        const situacaoMatch =
          filtros.situacao === "todas" ||
          parceiro.situacao === filtros.situacao;
        const origemMatch =
          filtros.origem === "todos" ||
          (filtros.origem === "legado" && parceiro.cliente_legado_id) ||
          (filtros.origem === "novo" && !parceiro.cliente_legado_id);

        return buscaMatch && tipoMatch && situacaoMatch && origemMatch;
      }),
    [filtros, parceiros]
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(parceirosFiltrados.length / itensPorPagina)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const parceirosPaginados = parceirosFiltrados.slice(
    inicioPagina,
    inicioPagina + itensPorPagina
  );
  const primeiroItemVisivel =
    parceirosFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const ultimoItemVisivel = Math.min(
    inicioPagina + itensPorPagina,
    parceirosFiltrados.length
  );

  function atualizarFiltro<K extends keyof FiltrosParceiros>(
    campo: K,
    valor: FiltrosParceiros[K]
  ) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
    setPaginaAtual(1);
  }

  function limparFiltros() {
    setFiltros(FILTROS_INICIAIS);
    setPaginaAtual(1);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-950">Registros</h2>
        <p className="mt-1 text-xs text-gray-600">
          A coluna de vínculo mostra se o cadastro mestre está conectado ao cliente legado usado nos chamados.
        </p>
      </div>

      <div className="border-b border-gray-100 bg-white p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1fr_1fr_auto] xl:items-end">
          <CampoFiltroTexto
            label="Busca"
            value={filtros.busca}
            onChange={(valor) => atualizarFiltro("busca", valor)}
            placeholder="Razão, fantasia, documento ou código"
          />
          <CampoFiltroSelecao
            label="Tipo"
            value={filtros.tipo}
            onChange={(valor) =>
              atualizarFiltro("tipo", valor as FiltrosParceiros["tipo"])
            }
          >
            <option value="todos">Todos</option>
            {TIPOS_PARCEIRO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {LABEL_TIPO_PARCEIRO[tipo]}
              </option>
            ))}
          </CampoFiltroSelecao>
          <CampoFiltroSelecao
            label="Situação"
            value={filtros.situacao}
            onChange={(valor) =>
              atualizarFiltro("situacao", valor as FiltrosParceiros["situacao"])
            }
          >
            <option value="todas">Todas</option>
            {SITUACOES_PARCEIRO.map((situacao) => (
              <option key={situacao} value={situacao}>
                {LABEL_SITUACAO_PARCEIRO[situacao]}
              </option>
            ))}
          </CampoFiltroSelecao>
          <CampoFiltroSelecao
            label="Origem"
            value={filtros.origem}
            onChange={(valor) =>
              atualizarFiltro("origem", valor as FiltrosParceiros["origem"])
            }
          >
            <option value="todos">Todos</option>
            <option value="legado">Backfill legado</option>
            <option value="novo">Novo domínio</option>
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
        <table className="min-w-[1220px] w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome fantasia</th>
              <th className="px-4 py-3">Razão social</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Documento</th>
              <th className="px-4 py-3">Segmento</th>
              <th className="px-4 py-3">Situação</th>
              <th className="px-4 py-3">Vínculo operacional</th>
              <th className="px-4 py-3">Filiais</th>
              <th className="px-4 py-3">Atualizado em</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {parceirosPaginados.map((parceiro) => (
              <tr key={parceiro.id} className="align-top">
                <td className="px-4 py-3 font-semibold text-gray-950">
                  {parceiro.nome_fantasia}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {parceiro.razao_social}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {LABEL_TIPO_PARCEIRO[parceiro.tipo_parceiro]}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {parceiro.cnpj_cpf ?? "-"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {parceiro.segmento ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      parceiro.ativo
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >
                    {LABEL_SITUACAO_PARCEIRO[parceiro.situacao]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <span className="font-semibold text-gray-900">
                    {parceiro.cliente_legado_id
                      ? parceiro.cliente_legado_nome ?? "Cliente legado"
                      : "Sem cliente legado"}
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {parceiro.cliente_legado_id
                      ? "Sincroniza com chamados"
                      : "Ainda não deriva chamados legados"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {parceiro.filiais_count ?? 0}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatarData(parceiro.atualizado_em)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/cadastros/parceiros/${parceiro.id}`}
                      className="inline-flex min-h-9 items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Ver / editar
                    </Link>
                    <StatusButton parceiro={parceiro} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {parceiros.length === 0 ? (
        <p className="border-t border-gray-100 p-4 text-sm text-gray-600">
          Nenhum parceiro cadastrado.
        </p>
      ) : null}

      {parceiros.length > 0 && parceirosFiltrados.length === 0 ? (
        <p className="border-t border-gray-100 p-4 text-sm text-gray-600">
          Nenhum parceiro encontrado com os filtros aplicados.
        </p>
      ) : null}

      <CatalogoPaginacao
        primeiroItemVisivel={primeiroItemVisivel}
        ultimoItemVisivel={ultimoItemVisivel}
        totalItens={parceirosFiltrados.length}
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
    </section>
  );
}
