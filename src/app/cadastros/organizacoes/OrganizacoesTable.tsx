"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CatalogoPaginacao,
  OPCOES_CATALOGOS_ITENS_POR_PAGINA,
} from "@/app/configurar/CatalogoConfiguracaoClient";
import { alterarStatusOrganizacao } from "./actions";
import {
  LABEL_TIPO_ORGANIZACAO,
  TIPOS_ORGANIZACAO,
  type Organizacao,
  type TipoOrganizacao,
} from "./types";

type Props = {
  organizacoes: Organizacao[];
};

type FiltrosOrganizacoes = {
  busca: string;
  tipo: "todos" | TipoOrganizacao;
  status: "ativas" | "inativas" | "todas";
};

const FILTROS_INICIAIS: FiltrosOrganizacoes = {
  busca: "",
  tipo: "todos",
  status: "ativas",
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

function StatusButton({ organizacao }: { organizacao: Organizacao }) {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            try {
              await alterarStatusOrganizacao(organizacao.id, !organizacao.ativo);
              setErro(null);
              router.refresh();
            } catch {
              setErro("Não foi possível alterar o status.");
            }
          })
        }
        className="min-h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400"
      >
        {isPending
          ? "Salvando..."
          : organizacao.ativo
            ? "Inativar"
            : "Ativar"}
      </button>
      {erro ? <span className="text-xs font-semibold text-red-600">{erro}</span> : null}
    </div>
  );
}

export function OrganizacoesTable({ organizacoes }: Props) {
  const [filtros, setFiltros] = useState<FiltrosOrganizacoes>(FILTROS_INICIAIS);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  const organizacoesFiltradas = useMemo(
    () =>
      organizacoes.filter((organizacao) => {
        const busca = textoFiltro(filtros.busca);
        const buscaMatch =
          !busca ||
          textoFiltro(organizacao.nome).includes(busca) ||
          textoFiltro(organizacao.codigo_interno).includes(busca) ||
          textoFiltro(organizacao.id_externo).includes(busca);
        const tipoMatch =
          filtros.tipo === "todos" ||
          organizacao.tipo_organizacao === filtros.tipo;
        const statusMatch =
          filtros.status === "todas" ||
          (filtros.status === "ativas" && organizacao.ativo) ||
          (filtros.status === "inativas" && !organizacao.ativo);

        return buscaMatch && tipoMatch && statusMatch;
      }),
    [filtros, organizacoes]
  );

  const totalPaginas = Math.max(
    1,
    Math.ceil(organizacoesFiltradas.length / itensPorPagina)
  );
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const organizacoesPaginadas = organizacoesFiltradas.slice(
    inicioPagina,
    inicioPagina + itensPorPagina
  );
  const primeiroItemVisivel =
    organizacoesFiltradas.length === 0 ? 0 : inicioPagina + 1;
  const ultimoItemVisivel = Math.min(
    inicioPagina + itensPorPagina,
    organizacoesFiltradas.length
  );

  function atualizarFiltro<K extends keyof FiltrosOrganizacoes>(
    campo: K,
    valor: FiltrosOrganizacoes[K]
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
          Filtre, pagine e gerencie organizações sem excluir registros.
        </p>
      </div>

      <div className="border-b border-gray-100 bg-white p-3 sm:p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_1fr_0.8fr_auto] xl:items-end">
          <CampoFiltroTexto
            label="Busca"
            value={filtros.busca}
            onChange={(valor) => atualizarFiltro("busca", valor)}
            placeholder="Nome, código interno ou ID externo"
          />
          <CampoFiltroSelecao
            label="Tipo"
            value={filtros.tipo}
            onChange={(valor) =>
              atualizarFiltro("tipo", valor as FiltrosOrganizacoes["tipo"])
            }
          >
            <option value="todos">Todos</option>
            {TIPOS_ORGANIZACAO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {LABEL_TIPO_ORGANIZACAO[tipo]}
              </option>
            ))}
          </CampoFiltroSelecao>
          <CampoFiltroSelecao
            label="Status"
            value={filtros.status}
            onChange={(valor) =>
              atualizarFiltro("status", valor as FiltrosOrganizacoes["status"])
            }
          >
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
            <option value="todas">Todas</option>
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
        <table className="min-w-[1050px] w-full border-collapse text-left text-sm">
          <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Código interno</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Clientes</th>
              <th className="px-4 py-3">Possui filiais</th>
              <th className="px-4 py-3">Sistema externo padrão</th>
              <th className="px-4 py-3">ID externo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Atualizado em</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {organizacoesPaginadas.map((organizacao) => (
              <tr key={organizacao.id} className="align-top">
                <td className="px-4 py-3 font-semibold text-gray-950">
                  {organizacao.nome}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {organizacao.codigo_interno ?? "-"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {LABEL_TIPO_ORGANIZACAO[organizacao.tipo_organizacao]}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {organizacao.clientes_vinculados_count ?? 0}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {organizacao.possui_filiais ? "Sim" : "Não"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {organizacao.sistema_externo_padrao ?? "-"}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {organizacao.id_externo ?? "-"}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                      organizacao.ativo
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-gray-200 bg-gray-50 text-gray-600"
                    }`}
                  >
                    {organizacao.ativo ? "Ativa" : "Inativa"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {formatarData(organizacao.atualizado_em)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/cadastros/organizacoes/${organizacao.id}`}
                      className="inline-flex min-h-9 items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                    >
                      Ver / editar
                    </Link>
                    <StatusButton organizacao={organizacao} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {organizacoes.length === 0 ? (
        <p className="border-t border-gray-100 p-4 text-sm text-gray-600">
          Nenhuma organização cadastrada.
        </p>
      ) : null}

      {organizacoes.length > 0 && organizacoesFiltradas.length === 0 ? (
        <p className="border-t border-gray-100 p-4 text-sm text-gray-600">
          Nenhuma organização encontrada com os filtros aplicados.
        </p>
      ) : null}

      <CatalogoPaginacao
        primeiroItemVisivel={primeiroItemVisivel}
        ultimoItemVisivel={ultimoItemVisivel}
        totalItens={organizacoesFiltradas.length}
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
