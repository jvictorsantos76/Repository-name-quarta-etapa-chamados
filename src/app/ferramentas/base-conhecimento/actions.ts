"use server";

import { revalidatePath } from "next/cache";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

function normalizarTexto(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
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

export async function salvarArtigoBaseConhecimento(formData: FormData) {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar artigos.");
  }

  const id = normalizarTexto(formData.get("id"));
  const titulo = normalizarTexto(formData.get("titulo"));
  const resumo = normalizarTexto(formData.get("resumo")) || null;
  const conteudo = String(formData.get("conteudo") ?? "").trim() || null;
  const url = normalizarTexto(formData.get("url")) || null;
  const ordem = Number(normalizarTexto(formData.get("ordem")) || "0");
  const ativo = formData.get("ativo") === "on";

  if (!titulo || !validarUrlOpcional(url ?? "")) {
    return;
  }

  const payload = {
    titulo,
    resumo,
    conteudo,
    url,
    ordem: Number.isFinite(ordem) ? ordem : 0,
    ativo,
    atualizado_por: perfil.id,
  };
  const supabase = await createSupabaseServerClient();

  if (id) {
    await supabase.from("bases_conhecimento").update(payload).eq("id", id);
  } else {
    await supabase.from("bases_conhecimento").insert({
      ...payload,
      criado_por: perfil.id,
    });
  }

  revalidatePath("/ferramentas/base-conhecimento");
  revalidatePath("/chamados/novo");
}
