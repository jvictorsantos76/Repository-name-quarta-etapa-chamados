"use server";

import { revalidatePath } from "next/cache";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

const STATUS_ARTIGOS_PATH = "/configurar/status-artigos";
const BASE_CONHECIMENTO_PATH = "/ferramentas/base-conhecimento";

export type StatusArtigoInput = {
  id?: string;
  nome: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
  ativo?: boolean;
  eh_padrao?: boolean;
  publica_artigo?: boolean;
  arquiva_artigo?: boolean;
};

export type StatusArtigoActionResult =
  | { ok: true; codigo: string; message?: string }
  | { ok: false; error: string };

async function requireGestorCatalogo() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar status de artigo.");
  }

  return perfil;
}

function normalizarTexto(valor: string | undefined) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

function normalizarCodigo(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function normalizarCorHex(valor: string | undefined) {
  const cor = String(valor ?? "").trim().toLowerCase();

  if (!cor) {
    return "#64748b";
  }

  return /^#[0-9a-f]{6}$/i.test(cor) ? cor : "#64748b";
}

async function gerarCodigoUnico(codigoBase: string, idAtual?: string) {
  const supabase = createSupabaseAdminClient();
  const base = normalizarCodigo(codigoBase) || "status";
  let tentativa = base;
  let indice = 2;

  while (true) {
    const query = supabase
      .from("base_conhecimento_status")
      .select("id")
      .eq("codigo", tentativa)
      .limit(1);
    const { data, error } = idAtual ? await query.neq("id", idAtual) : await query;

    if (error) {
      throw new Error("Não foi possível validar o código do status.");
    }

    if (!data || data.length === 0) {
      return tentativa;
    }

    tentativa = `${base}_${indice}`;
    indice += 1;
  }
}

async function obterCodigoStatusExistente(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("base_conhecimento_status")
    .select("codigo")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível localizar o status de artigo.");
  }

  return (data?.codigo as string | undefined) ?? null;
}

function revalidarStatusArtigos() {
  revalidatePath(STATUS_ARTIGOS_PATH);
  revalidatePath(BASE_CONHECIMENTO_PATH);
  revalidatePath("/chamados/novo");
}

function mensagemErro(error: { code?: string }) {
  if (error.code === "23505") {
    return "Já existe um status com esse nome ou regra única.";
  }

  if (error.code === "42501") {
    return "Sem permissão para salvar este status.";
  }

  return "Não foi possível salvar o status de artigo.";
}

export async function salvarStatusArtigo(
  input: StatusArtigoInput
): Promise<StatusArtigoActionResult> {
  const perfil = await requireGestorCatalogo();
  const nome = normalizarTexto(input.nome);

  if (!nome) {
    return { ok: false, error: "Informe o nome do status." };
  }

  const supabase = createSupabaseAdminClient();
  const codigo = input.id
    ? await obterCodigoStatusExistente(input.id)
    : await gerarCodigoUnico(nome);

  if (!codigo) {
    return { ok: false, error: "Status de artigo não encontrado para atualização." };
  }

  const payload = {
    codigo,
    nome,
    descricao: normalizarTexto(input.descricao) || null,
    cor: normalizarCorHex(input.cor),
    ordem: Number.isFinite(input.ordem)
      ? Math.max(0, Math.trunc(input.ordem ?? 0))
      : 0,
    ativo: Boolean(input.ativo),
    eh_padrao: Boolean(input.eh_padrao),
    publica_artigo: Boolean(input.publica_artigo),
    arquiva_artigo: Boolean(input.arquiva_artigo),
    atualizado_por: perfil.id,
  };

  if (payload.eh_padrao) {
    const limpar = supabase
      .from("base_conhecimento_status")
      .update({ eh_padrao: false, atualizado_por: perfil.id });
    const { error } = input.id ? await limpar.neq("id", input.id) : await limpar;
    if (error) return { ok: false, error: mensagemErro(error) };
  }

  if (payload.publica_artigo) {
    const limpar = supabase
      .from("base_conhecimento_status")
      .update({ publica_artigo: false, atualizado_por: perfil.id });
    const { error } = input.id ? await limpar.neq("id", input.id) : await limpar;
    if (error) return { ok: false, error: mensagemErro(error) };
  }

  if (payload.arquiva_artigo) {
    const limpar = supabase
      .from("base_conhecimento_status")
      .update({ arquiva_artigo: false, atualizado_por: perfil.id });
    const { error } = input.id ? await limpar.neq("id", input.id) : await limpar;
    if (error) return { ok: false, error: mensagemErro(error) };
  }

  const query = input.id
    ? supabase.from("base_conhecimento_status").update(payload).eq("id", input.id)
    : supabase
        .from("base_conhecimento_status")
        .insert({ ...payload, criado_por: perfil.id });
  const { error } = await query;

  if (error) {
    return { ok: false, error: mensagemErro(error) };
  }

  revalidarStatusArtigos();

  return {
    ok: true,
    codigo,
    message: "Status de artigo salvo automaticamente.",
  };
}

export async function alterarStatusArtigoAtivo(id: string, ativo: boolean) {
  await requireGestorCatalogo();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("base_conhecimento_status")
    .update({ ativo })
    .eq("id", id);

  if (error) {
    return { ok: false, error: mensagemErro(error) };
  }

  revalidarStatusArtigos();
  return { ok: true };
}
