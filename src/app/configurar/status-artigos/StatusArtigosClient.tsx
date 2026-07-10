"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  CatalogoPaginacao,
  OPCOES_CATALOGOS_ITENS_POR_PAGINA,
} from "../CatalogoConfiguracaoClient";
import { alterarStatusArtigoAtivo, salvarStatusArtigo } from "./actions";

export type StatusArtigoListItem = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  ordem: number | null;
  ativo: boolean;
  eh_padrao: boolean;
  publica_artigo: boolean;
  arquiva_artigo: boolean;
  referencias: number;
};

type DraftStatus = {
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  eh_padrao: boolean;
  publica_artigo: boolean;
  arquiva_artigo: boolean;
};

type Props = {
  itens: StatusArtigoListItem[];
  erroCarregamento?: string | null;
};

const NOVO_STATUS_INICIAL: DraftStatus = {
  nome: "",
  descricao: "",
  cor: "#64748b",
  ordem: 0,
  ativo: true,
  eh_padrao: false,
  publica_artigo: false,
  arquiva_artigo: false,
};

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 read-only:bg-gray-100 read-only:text-gray-500";

function normalizarCodigoPreview(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function textoFiltro(valor: string | number | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
}

function CampoTexto({
  label,
  value,
  onChange,
  readOnly = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readOnly}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function CampoBooleano({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
    </label>
  );
}

function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className: string;
}) {
  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

function NovoStatusForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftStatus>(NOVO_STATUS_INICIAL);
  const [mensagem, setMensagem] = useState("Autosave ativo");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const codigoPreview = normalizarCodigoPreview(draft.nome) || "status_automatico";

  function salvar() {
    if (!draft.nome.trim() || !draft.descricao.trim()) {
      setErro("Informe nome e descrição antes de salvar.");
      return;
    }

    startTransition(async () => {
      const resultado = await salvarStatusArtigo(draft);
      if (!resultado.ok) {
        setErro(resultado.error);
        setMensagem("Erro ao salvar");
        return;
      }

      setDraft(NOVO_STATUS_INICIAL);
      setErro(null);
      setMensagem(resultado.message ?? "Status salvo.");
      router.refresh();
    });
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-950">Novo status de artigo</h2>
          <p className="mt-1 text-xs text-gray-600">
            Configure o ciclo editorial usado no formulário da Base de Conhecimento.
          </p>
        </div>
        <span className="inline-flex min-h-7 w-fit items-center rounded-full border border-blue-100 bg-blue-50 px-3 text-xs font-semibold text-blue-700">
          {isPending ? "Salvando..." : mensagem}
        </span>
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_2fr_0.8fr_0.8fr]">
        <CampoTexto label="Código" value={codigoPreview} readOnly />
        <CampoTexto
          label="Nome"
          value={draft.nome}
          onChange={(nome) => {
            setDraft((atual) => ({ ...atual, nome }));
            setErro(null);
          }}
          placeholder="Em validação técnica"
        />
        <CampoTexto
          label="Descrição"
          value={draft.descricao}
          onChange={(descricao) => {
            setDraft((atual) => ({ ...atual, descricao }));
            setErro(null);
          }}
          placeholder="Uso operacional desse status"
        />
        <label className={labelClass}>
          Cor
          <input
            type="color"
            value={draft.cor}
            onChange={(event) =>
              setDraft((atual) => ({ ...atual, cor: event.target.value }))
            }
            className="mt-1 h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-2"
          />
        </label>
        <label className={labelClass}>
          Ordem
          <input
            type="number"
            min={0}
            value={draft.ordem}
            onChange={(event) =>
              setDraft((atual) => ({
                ...atual,
                ordem: Number(event.target.value || 0),
              }))
            }
            className={inputClass}
          />
        </label>
      </div>
      <div className="grid gap-3 border-t border-gray-100 p-4 md:grid-cols-4">
        <CampoBooleano
          label="Ativo"
          checked={draft.ativo}
          onChange={(ativo) => setDraft((atual) => ({ ...atual, ativo }))}
        />
        <CampoBooleano
          label="Padrão"
          checked={draft.eh_padrao}
          onChange={(eh_padrao) =>
            setDraft((atual) => ({ ...atual, eh_padrao }))
          }
        />
        <CampoBooleano
          label="Publica artigo"
          checked={draft.publica_artigo}
          onChange={(publica_artigo) =>
            setDraft((atual) => ({ ...atual, publica_artigo }))
          }
        />
        <CampoBooleano
          label="Arquiva artigo"
          checked={draft.arquiva_artigo}
          onChange={(arquiva_artigo) =>
            setDraft((atual) => ({ ...atual, arquiva_artigo }))
          }
        />
      </div>
      <div className="flex flex-col gap-2 border-t border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
        {erro ? <p className="text-sm font-semibold text-red-700">{erro}</p> : <span />}
        <button
          type="button"
          onClick={salvar}
          disabled={isPending}
          className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Salvar status
        </button>
      </div>
    </section>
  );
}

export function StatusArtigosClient({ itens, erroCarregamento }: Props) {
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [ativo, setAtivo] = useState("todos");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [isPending, startTransition] = useTransition();

  const itensFiltrados = useMemo(
    () =>
      itens.filter((item) => {
        const texto = [item.codigo, item.nome, item.descricao].map(textoFiltro).join(" ");
        return (
          (!busca.trim() || texto.includes(textoFiltro(busca))) &&
          (ativo === "todos" ||
            (ativo === "ativos" && item.ativo) ||
            (ativo === "inativos" && !item.ativo))
        );
      }),
    [ativo, busca, itens]
  );

  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const primeiroIndice = (paginaSegura - 1) * itensPorPagina;
  const itensPaginados = itensFiltrados.slice(
    primeiroIndice,
    primeiroIndice + itensPorPagina
  );

  function alternarAtivo(id: string, valor: boolean) {
    startTransition(async () => {
      await alterarStatusArtigoAtivo(id, valor);
      router.refresh();
    });
  }

  return (
    <section className="mx-auto max-w-7xl px-6 pb-10 md:px-8">
      <div className="mb-6">
        <Link href="/ferramentas/base-conhecimento" className="text-sm font-semibold text-blue-600">
          Voltar para Base de Conhecimento
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-950">Status de artigos</h1>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">
          Cadastro do ciclo editorial usado nos artigos técnicos da Base de Conhecimento.
        </p>
      </div>

      <div className="space-y-5">
        {erroCarregamento ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {erroCarregamento}
          </div>
        ) : null}
        <NovoStatusForm />

        <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-gray-100 p-4 md:grid-cols-[1fr_220px]">
            <CampoTexto
              label="Busca"
              value={busca}
              onChange={(valor) => {
                setBusca(valor);
                setPaginaAtual(1);
              }}
              placeholder="Código, nome ou descrição"
            />
            <label className={labelClass}>
              Situação
              <select
                value={ativo}
                onChange={(event) => {
                  setAtivo(event.target.value);
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

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">Descrição</th>
                  <th className="px-4 py-3">Regras</th>
                  <th className="px-4 py-3">Referências</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {itensPaginados.map((item) => (
                  <tr key={item.id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-gray-700">
                      {item.codigo}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 font-bold text-gray-950">
                        <span
                          className="h-3 w-3 rounded-full border border-gray-200"
                          style={{ backgroundColor: item.cor ?? "#64748b" }}
                        />
                        {item.nome}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {item.descricao ?? "Sem descrição"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {item.eh_padrao ? (
                          <Chip className="border-blue-200 bg-blue-50 text-blue-700">
                            Padrão
                          </Chip>
                        ) : null}
                        {item.publica_artigo ? (
                          <Chip className="border-green-200 bg-green-50 text-green-700">
                            Publica
                          </Chip>
                        ) : null}
                        {item.arquiva_artigo ? (
                          <Chip className="border-red-200 bg-red-50 text-red-700">
                            Arquiva
                          </Chip>
                        ) : null}
                        <Chip
                          className={
                            item.ativo
                              ? "border-gray-200 bg-gray-50 text-gray-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }
                        >
                          {item.ativo ? "Ativo" : "Inativo"}
                        </Chip>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.referencias}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => alternarAtivo(item.id, !item.ativo)}
                        disabled={isPending || item.referencias > 0}
                        className="text-xs font-bold text-blue-700 hover:text-blue-900 disabled:cursor-not-allowed disabled:text-gray-400"
                      >
                        {item.ativo ? "Inativar" : "Ativar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
        </section>
      </div>
    </section>
  );
}
