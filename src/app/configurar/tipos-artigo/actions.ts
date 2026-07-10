"use server";

import { revalidatePath } from "next/cache";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

function normalizarTexto(valor: FormDataEntryValue | string | null | undefined) {
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

async function requireGestorCatalogo() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar tipos de artigo.");
  }

  return perfil;
}

async function gerarCodigoUnico(nome: string, idAtual: string) {
  const supabase = createSupabaseAdminClient();
  const base = normalizarCodigo(nome) || "tipo_artigo";
  let tentativa = base;
  let indice = 2;

  while (true) {
    const query = supabase
      .from("base_conhecimento_tipos")
      .select("id")
      .eq("codigo", tentativa)
      .limit(1);
    const { data, error } = idAtual ? await query.neq("id", idAtual) : await query;

    if (error) {
      throw new Error("Não foi possível validar o código do tipo de artigo.");
    }

    if (!data || data.length === 0) {
      return tentativa;
    }

    tentativa = `${base}_${indice}`;
    indice += 1;
  }
}

async function obterCodigoTipoExistente(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("base_conhecimento_tipos")
    .select("codigo")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error("Não foi possível localizar o tipo de artigo.");
  }

  return (data?.codigo as string | undefined) ?? null;
}

function revalidarTiposArtigo() {
  revalidatePath("/configurar/tipos-artigo");
  revalidatePath("/ferramentas/base-conhecimento");
  revalidatePath("/chamados/novo");
}

export async function salvarTipoArtigo(formData: FormData) {
  const perfil = await requireGestorCatalogo();
  const id = normalizarTexto(formData.get("id"));
  const nome = normalizarTexto(formData.get("nome"));
  const descricao = normalizarTexto(formData.get("descricao")) || null;
  const ordem = Number(normalizarTexto(formData.get("ordem")) || "0");
  const ativo = formData.get("ativo") === "on";
  const ehPadrao = formData.get("eh_padrao") === "on";

  if (!nome) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const codigo = id ? await obterCodigoTipoExistente(id) : await gerarCodigoUnico(nome, id);

  if (!codigo) {
    throw new Error("Tipo de artigo não encontrado para atualização.");
  }

  if (ehPadrao) {
    await supabase
      .from("base_conhecimento_tipos")
      .update({ eh_padrao: false, atualizado_por: perfil.id })
      .neq("id", id || "00000000-0000-0000-0000-000000000000");
  }

  const payload = {
    codigo,
    nome,
    descricao,
    ordem: Number.isFinite(ordem) ? Math.max(0, Math.trunc(ordem)) : 0,
    ativo,
    eh_padrao: ehPadrao,
    atualizado_por: perfil.id,
  };

  const { error } = id
    ? await supabase.from("base_conhecimento_tipos").update(payload).eq("id", id)
    : await supabase
        .from("base_conhecimento_tipos")
        .insert({ ...payload, criado_por: perfil.id });

  if (error) {
    throw new Error("Não foi possível salvar o tipo de artigo.");
  }

  revalidarTiposArtigo();
}
