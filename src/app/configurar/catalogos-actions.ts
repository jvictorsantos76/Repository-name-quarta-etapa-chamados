"use server";

import { revalidatePath } from "next/cache";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
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

export type StatusChamadoInput = {
  id?: string;
  nome: string;
  descricao?: string;
  cor?: string;
  ordem?: number;
  ativo?: boolean;
  eh_padrao?: boolean;
};

export type StatusChamadoActionResult =
  | {
      ok: true;
      codigo: string;
      message?: string;
    }
  | {
      ok: false;
      error: string;
    };

export type ExcluirStatusChamadoActionResult =
  | {
      ok: true;
    }
  | {
      ok: false;
      error: string;
    };

async function requireGestorCatalogo() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar catálogos.");
  }

  return perfil;
}

function normalizarCorHex(valor: string) {
  const cor = valor.trim().toLowerCase();

  if (!cor) {
    return null;
  }

  return /^#[0-9a-f]{6}$/i.test(cor) ? cor : null;
}

async function gerarCodigoUnicoStatus(
  codigoBase: string,
  idAtual?: string
) {
  const supabase = createSupabaseAdminClient();
  const base = normalizarCodigo(codigoBase) || "status";
  let tentativa = base;
  let indice = 2;

  while (true) {
    const query = supabase
      .from("chamado_status")
      .select("id")
      .eq("codigo", tentativa)
      .limit(1);

    const { data, error } = idAtual
      ? await query.neq("id", idAtual)
      : await query;

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

async function contarReferenciasStatus(codigo: string) {
  const supabase = createSupabaseAdminClient();
  const [chamados, historico] = await Promise.all([
    supabase
      .from("chamados")
      .select("id", { head: true, count: "exact" })
      .eq("status", codigo),
    supabase
      .from("historico_status")
      .select("id", { head: true, count: "exact" })
      .or(`status_anterior.eq.${codigo},status_novo.eq.${codigo}`),
  ]);

  if (chamados.error || historico.error) {
    throw new Error("Não foi possível verificar o uso desse status.");
  }

  return (chamados.count ?? 0) + (historico.count ?? 0);
}

function revalidarCatalogoStatus() {
  revalidatePath("/configurar/status-chamados");
  revalidatePath("/chamados/novo");
}

export async function salvarStatusChamado(
  input: StatusChamadoInput
): Promise<StatusChamadoActionResult> {
  const perfil = await requireGestorCatalogo();
  const nome = input.nome.trim().replace(/\s+/g, " ");

  if (!nome) {
    return { ok: false, error: "Informe o nome do status." };
  }

  const codigo = await gerarCodigoUnicoStatus(nome, input.id);
  const supabase = await createSupabaseServerClient();
  const payload = {
    codigo,
    nome,
    descricao: input.descricao?.trim().replace(/\s+/g, " ") || null,
    cor: normalizarCorHex(input.cor ?? "") ?? "#2563eb",
    ordem: Number.isFinite(input.ordem) ? Math.max(0, Math.trunc(input.ordem ?? 0)) : 0,
    ativo: Boolean(input.ativo),
    eh_padrao: Boolean(input.eh_padrao),
    atualizado_por: perfil.id,
  };

  if (payload.eh_padrao) {
    const limparPadraoQuery = supabase
      .from("chamado_status")
      .update({ eh_padrao: false, atualizado_por: perfil.id });

    const { error: limparPadraoError } = input.id
      ? await limparPadraoQuery.neq("id", input.id)
      : await limparPadraoQuery;

    if (limparPadraoError) {
      return { ok: false, error: "Não foi possível aplicar o status padrão." };
    }
  }

  const query = input.id
    ? supabase.from("chamado_status").update(payload).eq("id", input.id)
    : supabase.from("chamado_status").insert({
        ...payload,
        criado_por: perfil.id,
      });

  const { error } = await query;

  if (error) {
    return { ok: false, error: "Não foi possível salvar o status." };
  }

  revalidarCatalogoStatus();

  return {
    ok: true,
    codigo,
    message:
      codigo !== normalizarCodigo(nome)
        ? `Código ajustado automaticamente para ${codigo}.`
        : "Status salvo automaticamente.",
  };
}

export async function excluirStatusChamado(
  id: string
): Promise<ExcluirStatusChamadoActionResult> {
  await requireGestorCatalogo();

  const supabaseAdmin = createSupabaseAdminClient();
  const { data: status, error: statusError } = await supabaseAdmin
    .from("chamado_status")
    .select("id, codigo, eh_padrao")
    .eq("id", id)
    .maybeSingle();

  if (statusError || !status) {
    return { ok: true };
  }

  if (status.eh_padrao) {
    return { ok: false, error: "O status padrão não pode ser excluído." };
  }

  const referencias = await contarReferenciasStatus(status.codigo);

  if (referencias > 0) {
    return {
      ok: false,
      error: "Esse status já está relacionado a chamados ou histórico e não pode ser excluído.",
    };
  }

  const { error } = await supabaseAdmin.from("chamado_status").delete().eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível excluir o status." };
  }

  revalidarCatalogoStatus();

  return { ok: true };
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

    if (payload.eh_padrao) {
      const limparPadraoQuery = supabase
        .from(config.tabela)
        .update({ eh_padrao: false, atualizado_por: perfil.id });

      if (id) {
        await limparPadraoQuery.neq("id", id);
      } else {
        await limparPadraoQuery;
      }
    }

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
