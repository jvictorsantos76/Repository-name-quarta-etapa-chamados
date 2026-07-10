"use server";

import { revalidatePath } from "next/cache";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

const BUCKET_ANEXOS = "base-conhecimento-anexos";
const TIPOS_VALIDOS = new Set([
  "procedimento",
  "faq",
  "erro_conhecido",
  "workaround",
  "manual_tecnico",
  "checklist",
  "orientacao_cliente",
  "padrao_interno",
  "solucao_recorrente",
]);
const CONFIDENCIALIDADES_VALIDAS = new Set([
  "publica",
  "cliente_especifico",
  "tecnico",
  "interno_restrito",
  "confidencial",
]);
const PUBLICOS_VALIDOS = new Set(["cliente", "tecnico", "interno", "gestao"]);

function normalizarTexto(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

function normalizarConteudo(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function gerarSlug(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function validarUrlOpcional(url: string) {
  if (!url) {
    return true;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizarOpcao(
  valor: string,
  opcoes: Set<string>,
  fallback: string
) {
  return opcoes.has(valor) ? valor : fallback;
}

function sanitizeHtmlBasico(valor: string) {
  return valor
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|form|input|button)[^>]*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/\s+(href|src)\s*=\s*(['"])\s*javascript:[\s\S]*?\2/gi, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, nomeTag: string, atributos: string) => {
      const permitidas = new Set([
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "h2",
        "h3",
        "ul",
        "ol",
        "li",
        "blockquote",
        "code",
        "pre",
        "a",
        "img",
      ]);
      const nome = nomeTag.toLowerCase();

      if (!permitidas.has(nome)) {
        return "";
      }

      if (tag.startsWith("</")) {
        return `</${nome}>`;
      }

      if (nome === "a") {
        const href = atributos.match(/\s+href\s*=\s*("[^"]*"|'[^']*')/i)?.[1] ?? '""';
        return `<a href=${href} target="_blank" rel="noreferrer">`;
      }

      if (nome === "img") {
        const src = atributos.match(/\s+src\s*=\s*("[^"]*"|'[^']*')/i)?.[1] ?? '""';
        const alt = atributos.match(/\s+alt\s*=\s*("[^"]*"|'[^']*')/i)?.[1] ?? '""';
        return `<img src=${src} alt=${alt}>`;
      }

      return `<${nome}>`;
    })
    .trim();
}

function valoresFormLista(formData: FormData, nome: string) {
  return formData
    .getAll(nome)
    .map((valor) => String(valor).trim())
    .filter(Boolean);
}

function getArquivo(formData: FormData) {
  const arquivo = formData.get("anexo");
  if (arquivo instanceof File && arquivo.size > 0) {
    return arquivo;
  }

  return null;
}

function normalizarNomeArquivo(nome: string) {
  const partes = nome.split(".");
  const extensao = partes.length > 1 ? `.${partes.pop()}` : "";
  const base = gerarSlug(partes.join(".") || nome) || "anexo";

  return `${base}${extensao.toLowerCase()}`;
}

function parseTags(valor: string) {
  const mapa = new Map<string, { nome: string; slug: string }>();

  valor
    .split(",")
    .map((tag) => normalizarTexto(tag))
    .filter(Boolean)
    .slice(0, 12)
    .forEach((nome) => {
      const slug = gerarSlug(nome);
      if (slug) {
        mapa.set(slug, { nome, slug });
      }
    });

  return Array.from(mapa.values());
}

function revalidarBaseConhecimento() {
  revalidatePath("/ferramentas/base-conhecimento");
  revalidatePath("/chamados/novo");
}

async function assertPodeGerenciarBase() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar artigos.");
  }

  return perfil;
}

export async function salvarArtigoBaseConhecimento(formData: FormData) {
  const perfil = await assertPodeGerenciarBase();
  const id = normalizarTexto(formData.get("id"));
  const titulo = normalizarTexto(formData.get("titulo"));
  const slugManual = normalizarTexto(formData.get("slug"));
  const slug = gerarSlug(slugManual || titulo);
  const resumo = normalizarTexto(formData.get("resumo"));
  const conteudo = sanitizeHtmlBasico(normalizarConteudo(formData.get("conteudo")));
  const url = normalizarTexto(formData.get("url"));
  const ordem = Number(normalizarTexto(formData.get("ordem")) || "0");
  const categoriaId = normalizarTexto(formData.get("categoria_id")) || null;
  const tipoInformado = normalizarOpcao(
    normalizarTexto(formData.get("tipo")),
    TIPOS_VALIDOS,
    normalizarTexto(formData.get("tipo"))
  );
  const statusInformado = normalizarTexto(formData.get("status"));
  const confidencialidade = normalizarOpcao(
    normalizarTexto(formData.get("confidencialidade")),
    CONFIDENCIALIDADES_VALIDAS,
    "tecnico"
  );
  const publicoAlvo = normalizarOpcao(
    normalizarTexto(formData.get("publico_alvo")),
    PUBLICOS_VALIDOS,
    "tecnico"
  );
  const proximaRevisao = normalizarTexto(formData.get("proxima_revisao_em")) || null;
  const tags = parseTags(normalizarTexto(formData.get("tags")));
  const arquivo = getArquivo(formData);
  const organizacaoIds = valoresFormLista(formData, "organizacao_ids");

  if (!titulo || !slug || !validarUrlOpcional(url)) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const [{ data: statusCatalogo }, { data: tipoCatalogo }] = await Promise.all([
    supabase
      .from("base_conhecimento_status")
      .select("codigo, publica_artigo, arquiva_artigo")
      .eq("codigo", statusInformado)
      .eq("ativo", true)
      .maybeSingle(),
    supabase
      .from("base_conhecimento_tipos")
      .select("codigo")
      .eq("codigo", tipoInformado)
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  if (!statusCatalogo || !tipoCatalogo) {
    return;
  }

  const status = statusCatalogo.codigo as string;
  const tipo = tipoCatalogo.codigo as string;
  const publicado = Boolean(statusCatalogo.publica_artigo);
  const arquivado = Boolean(statusCatalogo.arquiva_artigo);

  if (
    publicado &&
    (!resumo || !categoriaId || tags.length === 0 || (!conteudo && !url && !arquivo))
  ) {
    return;
  }

  if (confidencialidade === "cliente_especifico" && organizacaoIds.length === 0) {
    return;
  }

  const payload = {
    titulo,
    slug,
    tipo,
    status,
    confidencialidade,
    publico_alvo: publicoAlvo,
    categoria_id: categoriaId,
    resumo: resumo || null,
    conteudo: conteudo || null,
    url: url || null,
    ordem: Number.isFinite(ordem) ? ordem : 0,
    ativo: !arquivado,
    atualizado_por: perfil.id,
    proxima_revisao_em: proximaRevisao,
    publicado_em: publicado ? new Date().toISOString() : null,
    publicado_por: publicado ? perfil.id : null,
    revisado_em: publicado ? new Date().toISOString() : null,
    revisado_por: publicado ? perfil.id : null,
  };

  const resposta = id
    ? await supabase
        .from("bases_conhecimento")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("bases_conhecimento")
        .insert({ ...payload, criado_por: perfil.id })
        .select("id")
        .single();

  if (resposta.error || !resposta.data) {
    throw new Error("Não foi possível salvar o artigo da Base de Conhecimento.");
  }

  const artigoId = resposta.data.id as string;

  await sincronizarTagsArtigo(artigoId, tags, perfil.id);
  await sincronizarOrganizacoesArtigo(
    artigoId,
    confidencialidade === "cliente_especifico" ? organizacaoIds : [],
    perfil.id
  );

  if (arquivo) {
    await salvarAnexoArtigo(artigoId, arquivo, perfil.id);
  }

  revalidarBaseConhecimento();
}

async function sincronizarOrganizacoesArtigo(
  artigoId: string,
  organizacaoIds: string[],
  usuarioId: string
) {
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("base_conhecimento_organizacoes")
    .update({ ativo: false })
    .eq("artigo_id", artigoId);

  if (organizacaoIds.length === 0) {
    return;
  }

  const vinculos = Array.from(new Set(organizacaoIds)).map((organizacaoId) => ({
    artigo_id: artigoId,
    organizacao_id: organizacaoId,
    ativo: true,
    criado_por: usuarioId,
  }));

  const { error } = await supabase
    .from("base_conhecimento_organizacoes")
    .upsert(vinculos, { onConflict: "artigo_id,organizacao_id" });

  if (error) {
    throw new Error("Não foi possível vincular organizações ao artigo.");
  }
}

async function sincronizarTagsArtigo(
  artigoId: string,
  tags: Array<{ nome: string; slug: string }>,
  usuarioId: string
) {
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("base_conhecimento_artigo_tags")
    .update({ ativo: false })
    .eq("artigo_id", artigoId);

  if (tags.length === 0) {
    return;
  }

  const { data: tagsPersistidas, error: erroTags } = await supabase
    .from("base_conhecimento_tags")
    .upsert(
      tags.map((tag) => ({
        nome: tag.nome,
        slug: tag.slug,
        tipo: "processo",
        ativo: true,
        criado_por: usuarioId,
        atualizado_por: usuarioId,
      })),
      { onConflict: "slug" }
    )
    .select("id, slug");

  if (erroTags || !tagsPersistidas) {
    throw new Error("Não foi possível salvar as tags do artigo.");
  }

  const vinculos = tagsPersistidas.map((tag) => ({
    artigo_id: artigoId,
    tag_id: tag.id,
    ativo: true,
    criado_por: usuarioId,
  }));

  const { error: erroVinculos } = await supabase
    .from("base_conhecimento_artigo_tags")
    .upsert(vinculos, { onConflict: "artigo_id,tag_id" });

  if (erroVinculos) {
    throw new Error("Não foi possível vincular as tags ao artigo.");
  }
}

async function salvarAnexoArtigo(artigoId: string, arquivo: File, usuarioId: string) {
  const supabase = await createSupabaseServerClient();
  const nomeArquivo = normalizarNomeArquivo(arquivo.name);
  const caminhoStorage = `artigos/${artigoId}/${Date.now()}-${nomeArquivo}`;

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .upload(caminhoStorage, arquivo, {
      cacheControl: "3600",
      upsert: false,
      contentType: arquivo.type || "application/octet-stream",
    });

  if (erroUpload) {
    throw new Error("Não foi possível enviar o anexo do artigo.");
  }

  const { error: erroRegistro } = await supabase
    .from("base_conhecimento_anexos")
    .insert({
      artigo_id: artigoId,
      nome_arquivo: arquivo.name,
      caminho_storage: caminhoStorage,
      tipo_mime: arquivo.type || null,
      tamanho_bytes: arquivo.size,
      criado_por: usuarioId,
    });

  if (erroRegistro) {
    throw new Error("Anexo enviado, mas não foi possível registrar o vínculo no artigo.");
  }
}
