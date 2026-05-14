"use server";

import { revalidatePath } from "next/cache";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

export type CatalogoChamadoKind = "status" | "tipo" | "origem" | "grupo";

const catalogos = {
  status: {
    tabela: "chamado_status",
    path: "/configurar/status-chamados",
  },
  tipo: {
    tabela: "chamado_tipos",
    path: "/configurar/tipos-chamado",
  },
  origem: {
    tabela: "chamado_origens",
    path: "/configurar/origens-chamado",
  },
  grupo: {
    tabela: "grupos_atendimento",
    path: "/configurar/grupos-atendimento",
  },
} as const;

function normalizarTexto(valor: FormDataEntryValue | null) {
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

function getCatalogoKind(formData: FormData): CatalogoChamadoKind | null {
  const kind = String(formData.get("kind") ?? "");

  return kind === "status" ||
    kind === "tipo" ||
    kind === "origem" ||
    kind === "grupo"
    ? kind
    : null;
}

async function requireGestorCatalogo() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar catálogos.");
  }

  return perfil;
}

export async function salvarCatalogoChamado(formData: FormData) {
  const perfil = await requireGestorCatalogo();
  const kind = getCatalogoKind(formData);

  if (!kind) {
    return;
  }

  const config = catalogos[kind];
  const id = normalizarTexto(formData.get("id"));
  const nome = normalizarTexto(formData.get("nome"));
  const descricao = normalizarTexto(formData.get("descricao")) || null;
  const ordem = Number(normalizarTexto(formData.get("ordem")) || "0");
  const ativo = formData.get("ativo") === "on";
  const supabase = await createSupabaseServerClient();

  if (!nome) {
    return;
  }

  const payloadBase = {
    nome,
    descricao,
    ordem: Number.isFinite(ordem) ? ordem : 0,
    ativo,
    atualizado_por: perfil.id,
  };

  if (kind === "status") {
    const codigoInformado = normalizarTexto(formData.get("codigo"));
    const codigo = normalizarCodigo(codigoInformado || nome);
    const payload = {
      ...payloadBase,
      codigo,
      cor: normalizarTexto(formData.get("cor")) || null,
      eh_padrao: formData.get("eh_padrao") === "on",
    };

    if (id) {
      await supabase.from(config.tabela).update(payload).eq("id", id);
    } else {
      await supabase.from(config.tabela).insert({
        ...payload,
        criado_por: perfil.id,
      });
    }
  } else if (id) {
    await supabase.from(config.tabela).update(payloadBase).eq("id", id);
  } else {
    await supabase.from(config.tabela).insert({
      ...payloadBase,
      criado_por: perfil.id,
    });
  }

  revalidatePath(config.path);
  revalidatePath("/chamados/novo");
}
