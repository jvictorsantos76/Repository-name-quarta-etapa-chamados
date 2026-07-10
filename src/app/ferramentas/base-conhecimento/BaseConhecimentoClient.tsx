"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CatalogoPaginacao,
  OPCOES_CATALOGOS_ITENS_POR_PAGINA,
} from "@/app/configurar/CatalogoConfiguracaoClient";
import { salvarArtigoBaseConhecimento } from "./actions";

export type BaseConhecimentoCategoria = {
  id: string;
  nome: string;
  slug: string;
  cor: string | null;
  ativo: boolean;
};

export type BaseConhecimentoTag = {
  id: string;
  nome: string;
  slug: string;
  cor: string | null;
  ativo: boolean;
};

export type BaseConhecimentoStatus = {
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
};

export type BaseConhecimentoTipo = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ordem: number | null;
  ativo: boolean;
  eh_padrao: boolean;
};

export type BaseConhecimentoOrganizacao = {
  id: string;
  nome: string;
  tipo_organizacao: string;
  ativo: boolean;
};

export type BaseConhecimentoAnexo = {
  id: string;
  artigo_id: string;
  nome_arquivo: string;
  tipo_mime: string | null;
  tamanho_bytes: number | null;
  criado_em: string;
};

export type BaseConhecimentoArtigo = {
  id: string;
  titulo: string;
  slug: string | null;
  tipo: string;
  status: string;
  confidencialidade: string;
  publico_alvo: string;
  categoria_id: string | null;
  resumo: string | null;
  conteudo: string | null;
  url: string | null;
  ordem: number | null;
  ativo: boolean;
  atualizado_em: string | null;
  publicado_em: string | null;
  revisado_em: string | null;
  proxima_revisao_em: string | null;
  tags: BaseConhecimentoTag[];
  anexos: BaseConhecimentoAnexo[];
  organizacao_ids: string[];
};

type Props = {
  artigos: BaseConhecimentoArtigo[];
  categorias: BaseConhecimentoCategoria[];
  tags: BaseConhecimentoTag[];
  statusOptions: BaseConhecimentoStatus[];
  tipoOptions: BaseConhecimentoTipo[];
  organizacoes: BaseConhecimentoOrganizacao[];
  podeEditar: boolean;
  erroCarregamento?: string | null;
};

type Filtros = {
  busca: string;
  tipo: string;
  status: string;
  confidencialidade: string;
  categoriaId: string;
  tagId: string;
};

const FILTROS_INICIAIS: Filtros = {
  busca: "",
  tipo: "todos",
  status: "todos",
  confidencialidade: "todos",
  categoriaId: "todos",
  tagId: "todos",
};

const CONFIDENCIALIDADES = [
  ["publica", "Pública"],
  ["cliente_especifico", "Cliente específico"],
  ["tecnico", "Técnico"],
  ["interno_restrito", "Interno restrito"],
  ["confidencial", "Confidencial"],
];

const PUBLICOS = [
  ["cliente", "Cliente"],
  ["tecnico", "Técnico"],
  ["interno", "Interno"],
  ["gestao", "Gestão"],
];

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";
const selectClass = inputClass;

function textoFiltro(valor: string | number | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
}

function gerarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function labelDe(opcoes: string[][], valor: string | null | undefined) {
  return opcoes.find(([value]) => value === valor)?.[1] ?? valor ?? "Não informado";
}

function labelCatalogo(
  opcoes: Array<{ codigo: string; nome: string }>,
  valor: string | null | undefined
) {
  return opcoes.find((opcao) => opcao.codigo === valor)?.nome ?? valor ?? "Não informado";
}

function formatarData(valor: string | null | undefined) {
  if (!valor) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(valor));
}

function formatarTamanho(bytes: number | null) {
  if (!bytes) {
    return "Tamanho não informado";
  }

  if (bytes < 1024 * 1024) {
    return `${Math.ceil(bytes / 1024)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function classeStatus(status: BaseConhecimentoStatus | undefined) {
  if (status?.publica_artigo) {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status?.codigo === "em_revisao") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (status?.arquiva_artigo) {
    return "border-red-200 bg-red-50 text-red-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

function classeConfidencialidade(confidencialidade: string) {
  if (confidencialidade === "confidencial") {
    return "border-red-200 bg-red-50 text-red-700";
  }

  if (confidencialidade === "interno_restrito") {
    return "border-purple-200 bg-purple-50 text-purple-700";
  }

  if (confidencialidade === "tecnico") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-gray-200 bg-gray-50 text-gray-700";
}

function Chip({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}
    >
      {children}
    </span>
  );
}

function CampoTexto({
  name,
  label,
  defaultValue = "",
  value,
  onChange,
  required = false,
  placeholder,
  readOnly = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        defaultValue={value === undefined ? defaultValue : undefined}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        required={required}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`${inputClass} ${readOnly ? "cursor-not-allowed bg-gray-100 text-gray-500" : ""}`}
      />
    </label>
  );
}

function CampoSelecao({
  name,
  label,
  defaultValue,
  children,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        className={selectClass}
      >
        {children}
      </select>
    </label>
  );
}

function TagInput({ tagsIniciais }: { tagsIniciais: BaseConhecimentoTag[] }) {
  const [tags, setTags] = useState(tagsIniciais.map((tag) => tag.nome));
  const [valor, setValor] = useState("");

  function adicionarTags(texto: string) {
    const novasTags = texto
      .split(/[,\n\t]+/)
      .map((tag) => tag.trim().replace(/\s+/g, " "))
      .filter(Boolean);

    if (novasTags.length === 0) {
      return;
    }

    setTags((atuais) => {
      const mapa = new Map(atuais.map((tag) => [tag.toLowerCase(), tag]));
      novasTags.forEach((tag) => mapa.set(tag.toLowerCase(), tag));
      return Array.from(mapa.values()).slice(0, 12);
    });
    setValor("");
  }

  function removerTag(tagRemovida: string) {
    setTags((atuais) => atuais.filter((tag) => tag !== tagRemovida));
  }

  return (
    <label className={labelClass}>
      Tags
      <input type="hidden" name="tags" value={tags.join(", ")} />
      <div className="mt-1 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
        <div className="flex min-h-8 flex-wrap items-center gap-2">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removerTag(tag)}
              className="inline-flex min-h-7 items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700"
              title="Remover tag"
            >
              {tag}
            </button>
          ))}
          <input
            value={valor}
            onChange={(event) => setValor(event.target.value)}
            onBlur={() => adicionarTags(valor)}
            onKeyDown={(event) => {
              if (event.key === "Tab" || event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                adicionarTags(valor);
              }
            }}
            placeholder="Digite e pressione Tab"
            className="min-h-8 min-w-48 flex-1 bg-transparent text-sm font-medium text-gray-950 outline-none"
          />
        </div>
      </div>
    </label>
  );
}

function ConteudoTecnicoEditor({ defaultValue = "" }: { defaultValue?: string }) {
  const [html, setHtml] = useState(defaultValue);

  function executar(comando: string, valor?: string) {
    document.execCommand(comando, false, valor);
    setHtml(document.querySelector<HTMLElement>("[data-conteudo-editor]")?.innerHTML ?? "");
  }

  function inserirLink() {
    const url = window.prompt("URL do link");
    if (url?.trim()) {
      executar("createLink", url.trim());
    }
  }

  function inserirImagem() {
    const url = window.prompt("URL da imagem");
    if (url?.trim()) {
      executar("insertImage", url.trim());
    }
  }

  return (
    <label className={labelClass}>
      Conteúdo técnico
      <input type="hidden" name="conteudo" value={html} />
      <div className="mt-1 overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-gray-100 bg-gray-50 p-2">
          {[
            ["bold", "B"],
            ["italic", "I"],
            ["insertUnorderedList", "Lista"],
            ["insertOrderedList", "1."],
          ].map(([comando, label]) => (
            <button
              key={comando}
              type="button"
              onClick={() => executar(comando)}
              className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => executar("formatBlock", "h2")}
            className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => executar("formatBlock", "h3")}
            className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
          >
            H3
          </button>
          <button
            type="button"
            onClick={inserirLink}
            className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
          >
            Link
          </button>
          <button
            type="button"
            onClick={inserirImagem}
            className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100"
          >
            Imagem
          </button>
        </div>
        <div
          data-conteudo-editor
          contentEditable
          suppressContentEditableWarning
          onInput={(event) => setHtml(event.currentTarget.innerHTML)}
          dangerouslySetInnerHTML={{ __html: defaultValue }}
          className="min-h-56 w-full px-3 py-3 text-sm leading-6 text-gray-800 outline-none prose-headings:font-bold"
        />
      </div>
    </label>
  );
}

function ArtigoForm({
  artigo,
  categorias,
  statusOptions,
  tipoOptions,
  organizacoes,
  onCancel,
}: {
  artigo?: BaseConhecimentoArtigo;
  categorias: BaseConhecimentoCategoria[];
  statusOptions: BaseConhecimentoStatus[];
  tipoOptions: BaseConhecimentoTipo[];
  organizacoes: BaseConhecimentoOrganizacao[];
  onCancel: () => void;
}) {
  const [titulo, setTitulo] = useState(artigo?.titulo ?? "");
  const [confidencialidade, setConfidencialidade] = useState(
    artigo?.confidencialidade ?? "tecnico"
  );
  const slugGerado = gerarSlug(titulo);
  const statusPadrao =
    artigo?.status ??
    statusOptions.find((status) => status.eh_padrao)?.codigo ??
    statusOptions[0]?.codigo ??
    "";
  const tipoPadrao =
    artigo?.tipo ??
    tipoOptions.find((tipo) => tipo.eh_padrao)?.codigo ??
    tipoOptions[0]?.codigo ??
    "";

  return (
    <form
      action={salvarArtigoBaseConhecimento}
      encType="multipart/form-data"
      className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4"
    >
      <input type="hidden" name="id" value={artigo?.id ?? ""} />
      <div className="grid gap-4 lg:grid-cols-3">
        <CampoTexto
          name="titulo"
          label="Título"
          value={titulo}
          onChange={setTitulo}
          required
        />
        <CampoTexto
          name="slug"
          label="Slug automático"
          value={slugGerado || artigo?.slug || ""}
          readOnly
        />
        <CampoSelecao
          name="status"
          label="Status"
          defaultValue={statusPadrao}
        >
          {statusOptions.map((status) => (
            <option key={status.id} value={status.codigo}>
              {status.nome}
            </option>
          ))}
        </CampoSelecao>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <CampoSelecao name="tipo" label="Tipo" defaultValue={tipoPadrao}>
          {tipoOptions.map((tipo) => (
            <option key={tipo.id} value={tipo.codigo}>
              {tipo.nome}
            </option>
          ))}
        </CampoSelecao>
        <CampoSelecao
          name="categoria_id"
          label="Categoria"
          defaultValue={artigo?.categoria_id ?? ""}
        >
          <option value="">Selecione</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </CampoSelecao>
        <label className={labelClass}>
          Confidencialidade
          <select
            name="confidencialidade"
            value={confidencialidade}
            onChange={(event) => setConfidencialidade(event.target.value)}
            className={selectClass}
          >
            {CONFIDENCIALIDADES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <CampoSelecao
          name="publico_alvo"
          label="Público"
          defaultValue={artigo?.publico_alvo ?? "tecnico"}
        >
          {PUBLICOS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </CampoSelecao>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_160px_180px]">
        <CampoTexto
          name="url"
          label="URL complementar"
          defaultValue={artigo?.url ?? ""}
          placeholder="https://..."
        />
        <CampoTexto
          name="ordem"
          label="Ordem"
          defaultValue={String(artigo?.ordem ?? 0)}
        />
        <CampoTexto
          name="proxima_revisao_em"
          label="Próxima revisão"
          defaultValue={artigo?.proxima_revisao_em ?? ""}
          placeholder="AAAA-MM-DD"
        />
      </div>

      {confidencialidade === "cliente_especifico" ? (
        <label className={labelClass}>
          Organizações autorizadas
          <select
            name="organizacao_ids"
            multiple
            defaultValue={artigo?.organizacao_ids ?? []}
            size={Math.min(6, Math.max(3, organizacoes.length))}
            className={selectClass}
          >
            {organizacoes.map((organizacao) => (
              <option key={organizacao.id} value={organizacao.id}>
                {organizacao.nome}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <TagInput tagsIniciais={artigo?.tags ?? []} />

      <label className={labelClass}>
        Resumo
        <textarea
          name="resumo"
          defaultValue={artigo?.resumo ?? ""}
          rows={2}
          className={inputClass}
        />
      </label>

      <ConteudoTecnicoEditor defaultValue={artigo?.conteudo ?? ""} />

      <label className={labelClass}>
        Anexo
        <input
          name="anexo"
          type="file"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.csv,.xlsx"
          className="mt-1 w-full rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700"
        />
      </label>

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          {artigo ? "Atualizar artigo" : "Salvar artigo"}
        </button>
      </div>
    </form>
  );
}

export function BaseConhecimentoClient({
  artigos,
  categorias,
  tags,
  statusOptions,
  tipoOptions,
  organizacoes,
  podeEditar,
  erroCarregamento,
}: Props) {
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [artigoSelecionadoId, setArtigoSelecionadoId] = useState(artigos[0]?.id ?? "");
  const [artigoEmEdicaoId, setArtigoEmEdicaoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);

  const categoriasPorId = useMemo(
    () => new Map(categorias.map((categoria) => [categoria.id, categoria])),
    [categorias]
  );
  const statusPorCodigo = useMemo(
    () => new Map(statusOptions.map((status) => [status.codigo, status])),
    [statusOptions]
  );

  const artigosFiltrados = useMemo(() => {
    return artigos.filter((artigo) => {
      const busca = textoFiltro(filtros.busca);
      const categoria = artigo.categoria_id
        ? categoriasPorId.get(artigo.categoria_id)?.nome
        : "";
      const textoArtigo = [
        artigo.titulo,
        artigo.slug,
        artigo.resumo,
        artigo.conteudo,
        categoria,
        ...artigo.tags.map((tag) => tag.nome),
      ]
        .map(textoFiltro)
        .join(" ");

      return (
        (!busca || textoArtigo.includes(busca)) &&
        (filtros.tipo === "todos" || artigo.tipo === filtros.tipo) &&
        (filtros.status === "todos" || artigo.status === filtros.status) &&
        (filtros.confidencialidade === "todos" ||
          artigo.confidencialidade === filtros.confidencialidade) &&
        (filtros.categoriaId === "todos" ||
          artigo.categoria_id === filtros.categoriaId) &&
        (filtros.tagId === "todos" ||
          artigo.tags.some((tag) => tag.id === filtros.tagId))
      );
    });
  }, [artigos, categoriasPorId, filtros]);

  const totalPaginas = Math.max(1, Math.ceil(artigosFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const primeiroIndice = (paginaSegura - 1) * itensPorPagina;
  const artigosPaginados = artigosFiltrados.slice(
    primeiroIndice,
    primeiroIndice + itensPorPagina
  );
  const artigoSelecionado =
    artigos.find((artigo) => artigo.id === artigoSelecionadoId) ??
    artigosPaginados[0] ??
    artigos[0];
  const artigoEmEdicao = artigos.find((artigo) => artigo.id === artigoEmEdicaoId);

  function atualizarFiltro<K extends keyof Filtros>(key: K, value: Filtros[K]) {
    setFiltros((atuais) => ({ ...atuais, [key]: value }));
    setPaginaAtual(1);
  }

  return (
    <div className="space-y-5">
      {erroCarregamento ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {erroCarregamento}
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-950">Artigos operacionais</h2>
            <p className="mt-1 text-sm text-gray-600">
              Procedimentos, checklists e soluções recorrentes para atendimento técnico.
            </p>
          </div>
          {podeEditar ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/configurar/status-artigos"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Status
              </Link>
              <Link
                href="/configurar/tipos-artigo"
                className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Tipos
              </Link>
              <button
                type="button"
                onClick={() => {
                  setCriando(true);
                  setArtigoEmEdicaoId(null);
                }}
                className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
              >
                Novo artigo
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
          <label className={labelClass}>
            Busca
            <input
              value={filtros.busca}
              onChange={(event) => atualizarFiltro("busca", event.target.value)}
              placeholder="Título, resumo, conteúdo ou tag"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Tipo
            <select
              value={filtros.tipo}
              onChange={(event) => atualizarFiltro("tipo", event.target.value)}
              className={selectClass}
            >
              <option value="todos">Todos</option>
              {tipoOptions.map((tipo) => (
                <option key={tipo.id} value={tipo.codigo}>
                  {tipo.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Status
            <select
              value={filtros.status}
              onChange={(event) => atualizarFiltro("status", event.target.value)}
              className={selectClass}
            >
              <option value="todos">Todos</option>
              {statusOptions.map((status) => (
                <option key={status.id} value={status.codigo}>
                  {status.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Confidencialidade
            <select
              value={filtros.confidencialidade}
              onChange={(event) =>
                atualizarFiltro("confidencialidade", event.target.value)
              }
              className={selectClass}
            >
              <option value="todos">Todas</option>
              {CONFIDENCIALIDADES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Categoria
            <select
              value={filtros.categoriaId}
              onChange={(event) => atualizarFiltro("categoriaId", event.target.value)}
              className={selectClass}
            >
              <option value="todos">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </label>
          <label className={labelClass}>
            Tag
            <select
              value={filtros.tagId}
              onChange={(event) => atualizarFiltro("tagId", event.target.value)}
              className={selectClass}
            >
              <option value="todos">Todas</option>
              {tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.nome}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      {criando || artigoEmEdicao ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-950">
            {artigoEmEdicao ? "Editar artigo" : "Novo artigo"}
          </h2>
          <ArtigoForm
            artigo={artigoEmEdicao}
            categorias={categorias}
            statusOptions={statusOptions}
            tipoOptions={tipoOptions}
            organizacoes={organizacoes}
            onCancel={() => {
              setCriando(false);
              setArtigoEmEdicaoId(null);
            }}
          />
        </section>
      ) : null}

      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Categoria</th>
                <th className="px-4 py-3">Tags</th>
                <th className="px-4 py-3">Público</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Atualização</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {artigosPaginados.map((artigo) => {
                const categoria = artigo.categoria_id
                  ? categoriasPorId.get(artigo.categoria_id)
                  : null;

                return (
                  <tr key={artigo.id} className="align-top hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setArtigoSelecionadoId(artigo.id)}
                        className="text-left font-bold text-gray-950 hover:text-blue-700"
                      >
                        {artigo.titulo}
                      </button>
                      <div className="mt-1 text-xs text-gray-500">
                        {artigo.slug ?? "sem-slug"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {labelCatalogo(tipoOptions, artigo.tipo)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {categoria?.nome ?? "Sem categoria"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex max-w-56 flex-wrap gap-1">
                        {artigo.tags.length > 0 ? (
                          artigo.tags.map((tag) => (
                            <Chip key={tag.id} className="border-gray-200 bg-gray-50 text-gray-700">
                              {tag.nome}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Sem tag</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Chip className={classeConfidencialidade(artigo.confidencialidade)}>
                          {labelDe(CONFIDENCIALIDADES, artigo.confidencialidade)}
                        </Chip>
                        <span className="text-xs font-semibold text-gray-500">
                          {labelDe(PUBLICOS, artigo.publico_alvo)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Chip className={classeStatus(statusPorCodigo.get(artigo.status))}>
                        {labelCatalogo(statusOptions, artigo.status)}
                      </Chip>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {formatarData(artigo.atualizado_em)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setArtigoSelecionadoId(artigo.id)}
                          className="text-left text-xs font-bold text-blue-700 hover:text-blue-900"
                        >
                          Ver
                        </button>
                        {podeEditar ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCriando(false);
                              setArtigoEmEdicaoId(artigo.id);
                            }}
                            className="text-left text-xs font-bold text-gray-700 hover:text-gray-950"
                          >
                            Editar
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {artigosFiltrados.length === 0 ? (
          <p className="border-t border-gray-100 p-4 text-sm font-medium text-gray-600">
            Nenhum artigo encontrado para os filtros aplicados.
          </p>
        ) : null}

        <CatalogoPaginacao
          primeiroItemVisivel={artigosFiltrados.length === 0 ? 0 : primeiroIndice + 1}
          ultimoItemVisivel={Math.min(primeiroIndice + itensPorPagina, artigosFiltrados.length)}
          totalItens={artigosFiltrados.length}
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

      {artigoSelecionado ? (
        <section className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap gap-2">
                <Chip className={classeStatus(statusPorCodigo.get(artigoSelecionado.status))}>
                  {labelCatalogo(statusOptions, artigoSelecionado.status)}
                </Chip>
                <Chip className={classeConfidencialidade(artigoSelecionado.confidencialidade)}>
                  {labelDe(CONFIDENCIALIDADES, artigoSelecionado.confidencialidade)}
                </Chip>
              </div>
              <h2 className="mt-3 text-xl font-bold text-gray-950">
                {artigoSelecionado.titulo}
              </h2>
              <p className="mt-2 max-w-4xl text-sm text-gray-600">
                {artigoSelecionado.resumo ?? "Artigo sem resumo cadastrado."}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                navigator.clipboard?.writeText(
                  `${window.location.origin}/ferramentas/base-conhecimento#${artigoSelecionado.slug ?? artigoSelecionado.id}`
                )
              }
              className="min-h-10 rounded-md border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Copiar link
            </button>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_320px]">
            <div className="rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-950">Conteúdo</h3>
              {artigoSelecionado.conteudo ? (
                <div
                  className="mt-3 max-w-none text-sm leading-6 text-gray-700 [&_a]:font-bold [&_a]:text-blue-700 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-bold [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-bold [&_img]:mt-3 [&_img]:max-w-full [&_img]:rounded-md [&_li]:ml-5 [&_ol]:list-decimal [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: artigoSelecionado.conteudo }}
                />
              ) : (
                <p className="mt-3 whitespace-pre-line text-sm leading-6 text-gray-700">
                  Conteúdo principal ainda não cadastrado. Consulte os anexos ou a URL complementar quando disponível.
                </p>
              )}
              {artigoSelecionado.url ? (
                <a
                  href={artigoSelecionado.url}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex text-sm font-bold text-blue-700 hover:text-blue-900"
                >
                  Abrir URL complementar
                </a>
              ) : null}
            </div>

            <aside className="space-y-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-950">Governança</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div>
                    <dt className="font-semibold text-gray-500">Publicado em</dt>
                    <dd className="text-gray-900">
                      {formatarData(artigoSelecionado.publicado_em)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-500">Revisado em</dt>
                    <dd className="text-gray-900">
                      {formatarData(artigoSelecionado.revisado_em)}
                    </dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-gray-500">Próxima revisão</dt>
                    <dd className="text-gray-900">
                      {formatarData(artigoSelecionado.proxima_revisao_em)}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-950">Anexos</h3>
                <div className="mt-3 space-y-2">
                  {artigoSelecionado.anexos.length > 0 ? (
                    artigoSelecionado.anexos.map((anexo) => (
                      <Link
                        key={anexo.id}
                        href={`/ferramentas/base-conhecimento/anexos/${anexo.id}`}
                        className="block rounded-md border border-gray-200 p-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        {anexo.nome_arquivo}
                        <span className="mt-1 block text-xs font-medium text-gray-500">
                          {formatarTamanho(anexo.tamanho_bytes)}
                        </span>
                      </Link>
                    ))
                  ) : (
                    <p className="text-sm text-gray-600">Nenhum anexo cadastrado.</p>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </section>
      ) : null}
    </div>
  );
}
