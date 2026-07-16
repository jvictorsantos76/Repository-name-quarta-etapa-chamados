"use server";

import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

const BUCKET_ANEXOS = "base-conhecimento-anexos";
const TAMANHO_MAXIMO_ANEXO = 20 * 1024 * 1024;
const EXTENSOES_ANEXO_PERMITIDAS = new Set([
  "pdf",
  "doc",
  "docx",
  "jpg",
  "jpeg",
  "png",
  "txt",
  "csv",
  "xlsx",
]);
const CONFIDENCIALIDADES_VALIDAS = new Set([
  "publica",
  "cliente_especifico",
  "tecnico",
  "interno_restrito",
  "confidencial",
]);
const PUBLICOS_VALIDOS = new Set(["cliente", "tecnico", "interno", "gestao"]);

export type ArtigoActionState = {
  status: "idle" | "success" | "error";
  message: string;
  artigoId?: string;
};

function erro(message: string): ArtigoActionState {
  return { status: "error", message };
}

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
  if (!url) return true;

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizarEstilo(valor: string) {
  const propriedadesPermitidas = new Set([
    "text-align",
    "color",
    "background-color",
    "font-weight",
    "font-style",
    "text-decoration",
  ]);

  return valor
    .split(";")
    .map((declaracao) => declaracao.trim())
    .filter(Boolean)
    .map((declaracao) => {
      const [propriedade, ...partesValor] = declaracao.split(":");
      const chave = propriedade?.trim().toLowerCase();
      const conteudo = partesValor.join(":").trim();
      if (!chave || !conteudo || !propriedadesPermitidas.has(chave)) return "";

      const valorSeguro =
        (chave === "color" || chave === "background-color")
          ? /^#[0-9a-f]{3,8}$/i.test(conteudo)
          : /^(left|center|right|justify|normal|bold|italic|underline|line-through)$/i.test(
                conteudo
              );

      return valorSeguro ? `${chave}: ${conteudo}` : "";
    })
    .filter(Boolean)
    .join("; ");
}

function sanitizeHtmlBasico(valor: string) {
  const tagsPermitidas = new Set([
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "h2",
    "h3",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "hr",
    "a",
    "img",
    "span",
  ]);

  return valor
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<\s*(script|style|iframe|object|embed|form|input|button)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, "")
    .replace(/<\s*\/?\s*(script|style|iframe|object|embed|form|input|button)[^>]*>/gi, "")
    .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
    .replace(/<\/?([a-z0-9]+)([^>]*)>/gi, (tag, nomeTag: string, atributos: string) => {
      const nome = nomeTag.toLowerCase();
      if (!tagsPermitidas.has(nome)) return "";
      if (tag.startsWith("</")) return `</${nome}>`;

      const atributo = (nomeAtributo: string) =>
        atributos.match(new RegExp(`\\s+${nomeAtributo}\\s*=\\s*("[^"]*"|'[^']*')`, "i"))?.[1] ?? '""';

      if (nome === "a") {
        const href = atributo("href");
        return /^['"]\s*javascript:/i.test(href)
          ? "<a>"
          : `<a href=${href} target="_blank" rel="noreferrer">`;
      }

      if (nome === "img") {
        const src = atributo("src");
        const alt = atributo("alt");
        return /^['"]\s*javascript:/i.test(src) ? "" : `<img src=${src} alt=${alt}>`;
      }

      const estiloBruto = atributo("style").replace(/^['"]|['"]$/g, "");
      const estilo = normalizarEstilo(estiloBruto);
      return estilo ? `<${nome} style="${estilo}">` : `<${nome}>`;
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
  return arquivo instanceof File && arquivo.size > 0 ? arquivo : null;
}

function normalizarNomeArquivo(nome: string) {
  const partes = nome.split(".");
  const extensao = partes.length > 1 ? `.${partes.pop()}` : "";
  const base = gerarSlug(partes.join(".") || nome) || "anexo";
  return `${base}${extensao.toLowerCase()}`;
}

function validarArquivo(arquivo: File | null) {
  if (!arquivo) return null;
  const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "";
  if (!EXTENSOES_ANEXO_PERMITIDAS.has(extensao)) {
    return "Formato de anexo não permitido.";
  }
  if (arquivo.size > TAMANHO_MAXIMO_ANEXO) {
    return "O anexo excede o limite de 20 MB.";
  }
  return null;
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
      if (slug) mapa.set(slug, { nome, slug });
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

function erroTabelaAusente(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") ||
      message?.includes("Could not find") ||
      message?.includes("does not exist") ||
      message?.includes("relation")
  );
}

async function relacionamentoUsuariosDisponivel() {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("base_conhecimento_usuarios")
    .select("artigo_id")
    .limit(1);

  if (!error) return true;
  if (erroTabelaAusente(error.message)) return false;
  throw new Error("Não foi possível validar os usuários autorizados do artigo.");
}

export async function salvarArtigoBaseConhecimento(
  _estadoAnterior: ArtigoActionState,
  formData: FormData
): Promise<ArtigoActionState> {
  try {
    const perfil = await assertPodeGerenciarBase();
    const id = normalizarTexto(formData.get("id"));
    const titulo = normalizarTexto(formData.get("titulo"));
    const slug = gerarSlug(normalizarTexto(formData.get("slug")) || titulo);
    const resumo = normalizarTexto(formData.get("resumo"));
    const conteudo = sanitizeHtmlBasico(normalizarConteudo(formData.get("conteudo")));
    const url = normalizarTexto(formData.get("url"));
    const ordem = Number(normalizarTexto(formData.get("ordem")) || "0");
    const categoriaId = normalizarTexto(formData.get("categoria_id")) || null;
    const tipoInformado = normalizarTexto(formData.get("tipo"));
    const statusInformado = normalizarTexto(formData.get("status"));
    const confidencialidade = normalizarTexto(formData.get("confidencialidade"));
    const publicoAlvo = normalizarTexto(formData.get("publico_alvo"));
    const proximaRevisao = normalizarTexto(formData.get("proxima_revisao_em")) || null;
    const tags = parseTags(normalizarTexto(formData.get("tags")));
    const arquivo = getArquivo(formData);
    const organizacaoIds = valoresFormLista(formData, "organizacao_ids");
    const usuarioIds = valoresFormLista(formData, "usuario_ids");

    if (!titulo || !slug) return erro("Informe o título do artigo.");
    if (!CONFIDENCIALIDADES_VALIDAS.has(confidencialidade)) {
      return erro("Selecione a confidencialidade do artigo.");
    }
    if (!PUBLICOS_VALIDOS.has(publicoAlvo)) {
      return erro("Selecione o público do artigo.");
    }
    if (!categoriaId) return erro("Selecione uma categoria para o artigo.");
    if (!validarUrlOpcional(url)) return erro("Informe uma URL complementar válida.");
    if (proximaRevisao && !/^\d{4}-\d{2}-\d{2}$/.test(proximaRevisao)) {
      return erro("Informe a próxima revisão no formato AAAA-MM-DD.");
    }
    const erroArquivo = validarArquivo(arquivo);
    if (erroArquivo) return erro(erroArquivo);

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

    if (!statusCatalogo) return erro("Selecione um status de artigo ativo.");
    if (!tipoCatalogo) return erro("Selecione um tipo de artigo ativo.");
    if (confidencialidade === "cliente_especifico" && organizacaoIds.length === 0) {
      return erro("Selecione ao menos uma organização autorizada.");
    }
    const usuariosRelacionamentoDisponivel =
      confidencialidade === "tecnico"
        ? await relacionamentoUsuariosDisponivel()
        : false;
    if (
      confidencialidade === "tecnico" &&
      usuarioIds.length > 0 &&
      !usuariosRelacionamentoDisponivel
    ) {
      return erro(
        "A seleção de usuários técnicos exige uma migration pendente no banco remoto. Salve sem usuários autorizados ou aplique a migration antes de selecioná-los."
      );
    }
    const publicado = Boolean(statusCatalogo.publica_artigo);

    const agora = new Date().toISOString();
    const payload = {
      titulo,
      slug,
      tipo: tipoCatalogo.codigo as string,
      status: statusCatalogo.codigo as string,
      confidencialidade,
      publico_alvo: publicoAlvo,
      categoria_id: categoriaId,
      resumo: resumo || null,
      conteudo: conteudo || null,
      url: url || null,
      ordem: Number.isFinite(ordem) ? ordem : 0,
      ativo: !statusCatalogo.arquiva_artigo,
      atualizado_por: perfil.id,
      proxima_revisao_em: proximaRevisao,
      publicado_em: publicado ? agora : null,
      publicado_por: publicado ? perfil.id : null,
      revisado_em: publicado ? agora : null,
      revisado_por: publicado ? perfil.id : null,
    };
    const resposta = id
      ? await supabase.from("bases_conhecimento").update(payload).eq("id", id).select("id").single()
      : await supabase.from("bases_conhecimento").insert({ ...payload, criado_por: perfil.id }).select("id").single();

    if (resposta.error || !resposta.data) {
      return erro("Não foi possível salvar o artigo. Revise os dados e tente novamente.");
    }

    const artigoId = resposta.data.id as string;
    if (arquivo) {
      const { data: arquivoComMesmoNome } = await supabase
        .from("base_conhecimento_anexos")
        .select("id")
        .eq("artigo_id", artigoId)
        .eq("nome_arquivo", arquivo.name)
        .eq("ativo", true)
        .maybeSingle();
      if (arquivoComMesmoNome) {
        return erro("Já existe um anexo ativo com este nome no artigo.");
      }
    }

    const resultados = await Promise.all([
      sincronizarTagsArtigo(artigoId, tags, perfil.id),
      sincronizarOrganizacoesArtigo(artigoId, confidencialidade === "cliente_especifico" ? organizacaoIds : [], perfil.id),
      usuariosRelacionamentoDisponivel
        ? sincronizarUsuariosArtigo(artigoId, usuarioIds, perfil.id)
        : Promise.resolve(null),
    ]);
    const erroVinculo = resultados.find((resultado) => resultado);
    if (erroVinculo) return erro(erroVinculo);

    if (arquivo) {
      const erroAnexo = await salvarAnexoArtigo(artigoId, arquivo, perfil.id);
      if (erroAnexo) return erro(erroAnexo);
    }

    revalidarBaseConhecimento();
    return {
      status: "success",
      message: arquivo ? "Artigo salvo e anexo enviado com sucesso." : "Artigo salvo com sucesso.",
      artigoId,
    };
  } catch (cause) {
    unstable_rethrow(cause);
    return erro(cause instanceof Error ? cause.message : "Não foi possível salvar o artigo.");
  }
}

async function sincronizarOrganizacoesArtigo(artigoId: string, ids: string[], usuarioId: string) {
  const supabase = await createSupabaseServerClient();
  const { error: erroInativar } = await supabase.from("base_conhecimento_organizacoes").update({ ativo: false }).eq("artigo_id", artigoId);
  if (erroInativar) return "Não foi possível atualizar as organizações autorizadas.";
  if (!ids.length) return null;
  const { error } = await supabase.from("base_conhecimento_organizacoes").upsert(
    Array.from(new Set(ids)).map((organizacaoId) => ({ artigo_id: artigoId, organizacao_id: organizacaoId, ativo: true, criado_por: usuarioId })),
    { onConflict: "artigo_id,organizacao_id" }
  );
  return error ? "Não foi possível vincular organizações ao artigo." : null;
}

async function sincronizarUsuariosArtigo(artigoId: string, ids: string[], usuarioId: string) {
  const supabase = await createSupabaseServerClient();
  const { error: erroInativar } = await supabase.from("base_conhecimento_usuarios").update({ ativo: false }).eq("artigo_id", artigoId);
  if (erroInativar) return "Não foi possível atualizar os usuários autorizados.";
  if (!ids.length) return null;
  const { error } = await supabase.from("base_conhecimento_usuarios").upsert(
    Array.from(new Set(ids)).map((usuarioIdVinculado) => ({ artigo_id: artigoId, usuario_id: usuarioIdVinculado, ativo: true, criado_por: usuarioId })),
    { onConflict: "artigo_id,usuario_id" }
  );
  return error ? "Não foi possível vincular usuários ao artigo." : null;
}

async function sincronizarTagsArtigo(artigoId: string, tags: Array<{ nome: string; slug: string }>, usuarioId: string) {
  const supabase = await createSupabaseServerClient();
  const { error: erroInativar } = await supabase.from("base_conhecimento_artigo_tags").update({ ativo: false }).eq("artigo_id", artigoId);
  if (erroInativar) return "Não foi possível atualizar as tags do artigo.";
  if (!tags.length) return null;
  const { data: tagsPersistidas, error: erroTags } = await supabase
    .from("base_conhecimento_tags")
    .upsert(tags.map((tag) => ({ nome: tag.nome, slug: tag.slug, tipo: "processo", ativo: true, criado_por: usuarioId, atualizado_por: usuarioId })), { onConflict: "slug" })
    .select("id");
  if (erroTags || !tagsPersistidas) return "Não foi possível salvar as tags do artigo.";
  const { error: erroVinculos } = await supabase.from("base_conhecimento_artigo_tags").upsert(
    tagsPersistidas.map((tag) => ({ artigo_id: artigoId, tag_id: tag.id, ativo: true, criado_por: usuarioId })),
    { onConflict: "artigo_id,tag_id" }
  );
  return erroVinculos ? "Não foi possível vincular as tags ao artigo." : null;
}

async function salvarAnexoArtigo(artigoId: string, arquivo: File, usuarioId: string) {
  const supabase = await createSupabaseServerClient();
  const caminhoStorage = `artigos/${artigoId}/${Date.now()}-${normalizarNomeArquivo(arquivo.name)}`;
  const { error: erroUpload } = await supabase.storage.from(BUCKET_ANEXOS).upload(caminhoStorage, arquivo, {
    cacheControl: "3600",
    upsert: false,
    contentType: arquivo.type || "application/octet-stream",
  });
  if (erroUpload) return "Não foi possível enviar o anexo. Confirme o formato e tente novamente.";
  const { error: erroRegistro } = await supabase.from("base_conhecimento_anexos").insert({
    artigo_id: artigoId,
    nome_arquivo: arquivo.name,
    caminho_storage: caminhoStorage,
    tipo_mime: arquivo.type || null,
    tamanho_bytes: arquivo.size,
    criado_por: usuarioId,
  });
  return erroRegistro ? "Anexo enviado, mas não foi possível registrá-lo no artigo." : null;
}
