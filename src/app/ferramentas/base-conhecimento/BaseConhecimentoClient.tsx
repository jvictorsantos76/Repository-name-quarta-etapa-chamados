"use client";

import Link from "next/link";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CatalogoPaginacao,
  OPCOES_CATALOGOS_ITENS_POR_PAGINA,
} from "@/app/configurar/CatalogoConfiguracaoClient";
import {
  salvarArtigoBaseConhecimento,
} from "./actions";

const ESTADO_INICIAL_ARTIGO = {
  status: "idle" as const,
  message: "",
};

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

export type BaseConhecimentoUsuario = {
  id: string;
  nome_completo: string;
  email: string | null;
  papel: string;
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
  usuario_ids: string[];
};

type Props = {
  artigos: BaseConhecimentoArtigo[];
  categorias: BaseConhecimentoCategoria[];
  tags: BaseConhecimentoTag[];
  statusOptions: BaseConhecimentoStatus[];
  tipoOptions: BaseConhecimentoTipo[];
  organizacoes: BaseConhecimentoOrganizacao[];
  usuarios: BaseConhecimentoUsuario[];
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
      <span>
        {label}
        {required ? <span className="ml-1 text-red-600" title="Campo obrigatório">*</span> : null}
      </span>
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
      <span>
        {label}
        {required ? <span className="ml-1 text-red-600" title="Campo obrigatório">*</span> : null}
      </span>
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

function SelecaoMultiplaPesquisa({
  label,
  name,
  opcoes,
  idsIniciais,
}: {
  label: string;
  name: string;
  opcoes: Array<{ id: string; nome: string; descricao?: string | null }>;
  idsIniciais: string[];
}) {
  const [busca, setBusca] = useState("");
  const [idsSelecionados, setIdsSelecionados] = useState(idsIniciais);
  const opcoesFiltradas = useMemo(() => {
    const termo = textoFiltro(busca);
    return opcoes.filter((opcao) =>
      !termo || `${opcao.nome} ${opcao.descricao ?? ""}`.toLowerCase().includes(termo)
    );
  }, [busca, opcoes]);
  const selecionados = opcoes.filter((opcao) => idsSelecionados.includes(opcao.id));

  function alternar(id: string) {
    setIdsSelecionados((atuais) =>
      atuais.includes(id) ? atuais.filter((item) => item !== id) : [...atuais, id]
    );
  }

  return (
    <fieldset className={labelClass}>
      <legend>{label}</legend>
      {idsSelecionados.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
      <div className="mt-1 rounded-md border border-gray-200 bg-white p-3">
        <input
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Localizar para selecionar"
          className="min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-950 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        />
        {selecionados.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {selecionados.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => alternar(opcao.id)}
                className="inline-flex min-h-7 items-center rounded-full border border-blue-100 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700"
                title={`Remover ${opcao.nome}`}
              >
                {opcao.nome}
              </button>
            ))}
          </div>
        ) : null}
        <div className="mt-2 max-h-44 overflow-y-auto rounded-md border border-gray-100">
          {opcoesFiltradas.map((opcao) => {
            const selecionada = idsSelecionados.includes(opcao.id);
            return (
              <label key={opcao.id} className="flex cursor-pointer items-start gap-2 border-b border-gray-100 px-3 py-2 last:border-0 hover:bg-gray-50">
                <input type="checkbox" checked={selecionada} onChange={() => alternar(opcao.id)} className="mt-0.5 h-4 w-4" />
                <span className="text-sm font-semibold normal-case text-gray-800">
                  {opcao.nome}
                  {opcao.descricao ? <span className="ml-1 font-medium text-gray-500">{opcao.descricao}</span> : null}
                </span>
              </label>
            );
          })}
          {opcoesFiltradas.length === 0 ? (
            <p className="px-3 py-3 text-sm font-medium normal-case text-gray-500">Nenhum resultado localizado.</p>
          ) : null}
        </div>
      </div>
    </fieldset>
  );
}

function ConteudoTecnicoEditor({ defaultValue = "" }: { defaultValue?: string }) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [html, setHtml] = useState(defaultValue);
  const [modoFonte, setModoFonte] = useState(false);
  const htmlRef = useRef(html);

  useEffect(() => {
    htmlRef.current = html;
  }, [html]);

  useEffect(() => {
    if (!modoFonte && editorRef.current && editorRef.current.innerHTML !== htmlRef.current) {
      editorRef.current.innerHTML = htmlRef.current;
    }
  }, [modoFonte]);

  function sincronizar() {
    setHtml(editorRef.current?.innerHTML ?? "");
  }

  function executar(comando: string, valor?: string) {
    editorRef.current?.focus();
    document.execCommand(comando, false, valor);
    sincronizar();
  }

  function inserirLink() {
    const url = window.prompt("URL do link");
    if (url?.trim()) executar("createLink", url.trim());
  }

  function inserirImagem() {
    const url = window.prompt("URL da imagem");
    if (url?.trim()) executar("insertImage", url.trim());
  }

  const botoes = [
    ["bold", "B", "Negrito"],
    ["italic", "I", "Itálico"],
    ["underline", "U", "Sublinhado"],
    ["strikeThrough", "S", "Tachado"],
    ["insertUnorderedList", "Lista", "Lista com marcadores"],
    ["insertOrderedList", "1.", "Lista numerada"],
    ["formatBlock", "H2", "Título nível 2", "h2"],
    ["formatBlock", "H3", "Título nível 3", "h3"],
    ["formatBlock", "P", "Parágrafo", "p"],
    ["formatBlock", "Citação", "Citação", "blockquote"],
    ["formatBlock", "Código", "Bloco de código", "pre"],
    ["justifyLeft", "Esq.", "Alinhar à esquerda"],
    ["justifyCenter", "Centro", "Centralizar"],
    ["justifyRight", "Dir.", "Alinhar à direita"],
  ];

  return (
    <label className={labelClass}>
      Conteúdo técnico
      <input type="hidden" name="conteudo" value={html} />
      <div className="mt-1 overflow-hidden rounded-md border border-gray-200 bg-white">
        <div className="flex flex-wrap gap-1 border-b border-gray-100 bg-gray-50 p-2">
          {botoes.map(([comando, texto, titulo, valor]) => (
            <button key={`${comando}-${texto}`} type="button" onClick={() => executar(comando, valor)} title={titulo} className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100">
              {texto}
            </button>
          ))}
          <button type="button" onClick={inserirLink} className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100">Link</button>
          <button type="button" onClick={inserirImagem} className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100">Imagem</button>
          <button type="button" onClick={() => executar("undo")} title="Desfazer" className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100">Desfazer</button>
          <button type="button" onClick={() => executar("redo")} title="Refazer" className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100">Refazer</button>
          <button type="button" onClick={() => setModoFonte((atual) => !atual)} className="min-h-8 rounded-md border border-gray-200 bg-white px-2 text-xs font-bold text-gray-700 hover:bg-gray-100">
            {modoFonte ? "Visual" : "HTML"}
          </button>
        </div>
        {modoFonte ? (
          <textarea value={html} onChange={(event) => setHtml(event.target.value)} rows={14} className="w-full resize-y border-0 bg-gray-950 px-3 py-3 font-mono text-xs leading-5 text-gray-100 outline-none" aria-label="HTML e estilo controlados" />
        ) : (
          <div ref={editorRef} contentEditable dir="ltr" suppressContentEditableWarning onInput={sincronizar} dangerouslySetInnerHTML={{ __html: defaultValue }} className="min-h-56 w-full px-3 py-3 text-left text-sm leading-6 text-gray-800 outline-none prose-headings:font-bold" />
        )}
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
  usuarios,
  onCancel,
  onSuccess,
}: {
  artigo?: BaseConhecimentoArtigo;
  categorias: BaseConhecimentoCategoria[];
  statusOptions: BaseConhecimentoStatus[];
  tipoOptions: BaseConhecimentoTipo[];
  organizacoes: BaseConhecimentoOrganizacao[];
  usuarios: BaseConhecimentoUsuario[];
  onCancel: () => void;
  onSuccess: (artigoId: string, mensagem: string) => void;
}) {
  const [estado, acaoForm, pendente] = useActionState(
    salvarArtigoBaseConhecimento,
    ESTADO_INICIAL_ARTIGO
  );
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

  const [nomeArquivo, setNomeArquivo] = useState("");
  const sucessoNotificadoRef = useRef(false);

  useEffect(() => {
    if (estado.status === "success" && estado.artigoId && !sucessoNotificadoRef.current) {
      sucessoNotificadoRef.current = true;
      onSuccess(estado.artigoId, estado.message);
    }
  }, [estado, onSuccess]);

  return (
    <form
      action={acaoForm}
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
          required
        >
          {statusOptions.map((status) => (
            <option key={status.id} value={status.codigo}>
              {status.nome}
            </option>
          ))}
        </CampoSelecao>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <CampoSelecao name="tipo" label="Tipo" defaultValue={tipoPadrao} required>
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
          required
        >
          <option value="">Selecione</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </CampoSelecao>
        <label className={labelClass}>
          <span>Confidencialidade<span className="ml-1 text-red-600" title="Campo obrigatório">*</span></span>
          <select
            name="confidencialidade"
            value={confidencialidade}
            onChange={(event) => setConfidencialidade(event.target.value)}
            required
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
          required
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
        <>
          <SelecaoMultiplaPesquisa label="Organizações autorizadas" name="organizacao_ids" idsIniciais={artigo?.organizacao_ids ?? []} opcoes={organizacoes.map((organizacao) => ({ id: organizacao.id, nome: organizacao.nome, descricao: organizacao.tipo_organizacao }))} />
          {organizacoes.length === 0 ? (
            <p className="-mt-2 text-sm font-medium text-amber-800">
              Nenhuma organização ativa está disponível. <Link href="/cadastros/organizacoes/nova" className="font-semibold underline underline-offset-2">Cadastrar organização</Link>
            </p>
          ) : null}
        </>
      ) : null}

      {confidencialidade === "tecnico" ? (
        <SelecaoMultiplaPesquisa label="Usuários técnicos autorizados" name="usuario_ids" idsIniciais={artigo?.usuario_ids ?? []} opcoes={usuarios.map((usuario) => ({ id: usuario.id, nome: usuario.nome_completo, descricao: usuario.email ? `${usuario.papel} · ${usuario.email}` : usuario.papel }))} />
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
          onChange={(event) => setNomeArquivo(event.target.files?.[0]?.name ?? "")}
          className="mt-1 w-full rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-3 text-sm font-medium text-gray-700"
        />
        <span className="mt-1 block text-xs font-medium normal-case text-gray-500">
          {nomeArquivo ? `Selecionado: ${nomeArquivo}` : "PDF, documentos, imagens e planilhas de até 20 MB."}
        </span>
        {artigo?.anexos.length ? (
          <span className="mt-2 block text-xs font-semibold normal-case text-gray-700">
            Anexos atuais: {artigo.anexos.map((anexo) => anexo.nome_arquivo).join(", ")}
          </span>
        ) : null}
      </label>

      {estado.status !== "idle" ? (
        <p aria-live="polite" className={`rounded-md border px-3 py-2 text-sm font-semibold ${estado.status === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {estado.message}
        </p>
      ) : null}

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
          disabled={pendente}
          className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          {pendente ? "Salvando..." : artigo ? "Atualizar artigo" : "Salvar artigo"}
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
  usuarios,
  podeEditar,
  erroCarregamento,
}: Props) {
  const router = useRouter();
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [artigoSelecionadoId, setArtigoSelecionadoId] = useState(artigos[0]?.id ?? "");
  const [artigoEmEdicaoId, setArtigoEmEdicaoId] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

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
  const catalogosObrigatoriosIndisponiveis =
    statusOptions.length === 0 || tipoOptions.length === 0;

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

      {mensagem ? (
        <div aria-live="polite" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">
          {mensagem}
        </div>
      ) : null}

      {podeEditar && catalogosObrigatoriosIndisponiveis ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Cadastre ou ative ao menos um Status e um Tipo de artigo antes de criar um artigo.
          <div className="mt-2 flex flex-wrap gap-3 font-semibold">
            <Link href="/configurar/status-artigos" className="text-amber-900 underline underline-offset-2">
              Configurar status
            </Link>
            <Link href="/configurar/tipos-artigo" className="text-amber-900 underline underline-offset-2">
              Configurar tipos
            </Link>
          </div>
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
                disabled={catalogosObrigatoriosIndisponiveis}
                onClick={() => {
                  setCriando(true);
                  setArtigoEmEdicaoId(null);
                }}
                className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
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
            key={artigoEmEdicao?.id ?? "novo"}
            artigo={artigoEmEdicao}
            categorias={categorias}
            statusOptions={statusOptions}
            tipoOptions={tipoOptions}
            organizacoes={organizacoes}
            usuarios={usuarios}
            onCancel={() => {
              setCriando(false);
              setArtigoEmEdicaoId(null);
            }}
            onSuccess={(artigoId, mensagemSucesso) => {
              setMensagem(mensagemSucesso);
              setArtigoSelecionadoId(artigoId);
              setCriando(false);
              setArtigoEmEdicaoId(null);
              router.refresh();
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
