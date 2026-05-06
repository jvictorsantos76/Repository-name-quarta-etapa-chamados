"use server";

import { revalidatePath } from "next/cache";
import { podeAdministrarUsuarios } from "@/lib/auth/permissions";
import type { CorPreferida, FonteEscala, TemaPreferido } from "@/lib/auth/types";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

export type PerfilActionState = {
  status: "idle" | "success" | "validation_error" | "permission_error" | "error";
  message: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const TEMAS_VALIDOS = new Set<TemaPreferido>(["system", "light", "dark"]);
const CORES_VALIDAS = new Set<CorPreferida>([
  "quarta-etapa",
  "verde",
  "roxo",
  "laranja",
  "neutro",
]);
const FONTES_VALIDAS = new Set<FonteEscala>([
  "padrao",
  "grande",
  "extra_grande",
]);

function normalizarTexto(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim();
}

function validarUrlAvatar(avatarUrl: string) {
  if (!avatarUrl) {
    return true;
  }

  try {
    const url = new URL(avatarUrl);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export async function atualizarPerfilUsuario(
  _prevState: PerfilActionState,
  formData: FormData
): Promise<PerfilActionState> {
  const perfilAtual = await requirePerfilAutenticado();
  const perfilIdSolicitado = normalizarTexto(formData.get("perfil_id"));
  const perfilIdAlvo = perfilIdSolicitado || perfilAtual.id;

  if (!UUID_REGEX.test(perfilIdAlvo)) {
    return {
      status: "validation_error",
      message: "Perfil informado inválido. Recarregue a página e tente novamente.",
    };
  }

  const editandoOutroPerfil = perfilIdAlvo !== perfilAtual.id;

  if (editandoOutroPerfil && !podeAdministrarUsuarios(perfilAtual.papel)) {
    return {
      status: "permission_error",
      message: "Você não tem permissão para alterar o perfil de outro usuário.",
    };
  }

  const telefone = normalizarTexto(formData.get("telefone"));
  const avatarUrl = normalizarTexto(formData.get("avatar_url"));
  const biografia = normalizarTexto(formData.get("biografia"));

  if (telefone.length > 30) {
    return {
      status: "validation_error",
      message: "Telefone deve ter no máximo 30 caracteres.",
    };
  }

  if (avatarUrl.length > 2048 || !validarUrlAvatar(avatarUrl)) {
    return {
      status: "validation_error",
      message: "Informe uma URL de foto válida começando com http:// ou https://.",
    };
  }

  if (biografia.length > 500) {
    return {
      status: "validation_error",
      message: "Biografia deve ter no máximo 500 caracteres.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("perfis")
    .update({
      telefone: telefone || null,
      avatar_url: avatarUrl || null,
      biografia: biografia || null,
    })
    .eq("id", perfilIdAlvo)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Falha ao atualizar perfil.", {
      code: error.code,
      message: error.message,
      perfilAtualId: perfilAtual.id,
      perfilIdAlvo,
      editandoOutroPerfil,
    });

    const mensagem =
      error.code === "42501"
        ? "Permissão negada pelo banco de dados para atualizar este perfil."
        : "Não foi possível salvar o perfil. Tente novamente.";

    return {
      status: error.code === "42501" ? "permission_error" : "error",
      message: mensagem,
    };
  }

  if (!data) {
    console.error("Perfil não atualizado por RLS ou linha não encontrada.", {
      perfilAtualId: perfilAtual.id,
      perfilIdAlvo,
      editandoOutroPerfil,
    });

    return {
      status: "permission_error",
      message:
        "Não foi possível salvar este perfil. Faça login novamente ou verifique se seu usuário está ativo.",
    };
  }

  revalidatePath("/perfil");

  return {
    status: "success",
    message: "Perfil salvo com sucesso.",
  };
}

export async function atualizarFotoPerfil(
  avatarUrl: string
): Promise<PerfilActionState> {
  const perfilAtual = await requirePerfilAutenticado();
  const avatarUrlNormalizada = avatarUrl.trim();

  if (avatarUrlNormalizada.length > 2048 || !validarUrlAvatar(avatarUrlNormalizada)) {
    return {
      status: "validation_error",
      message: "A foto enviada gerou uma URL inválida. Tente enviar novamente.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("perfis")
    .update({ avatar_url: avatarUrlNormalizada })
    .eq("id", perfilAtual.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Falha ao atualizar foto do perfil.", {
      code: error.code,
      message: error.message,
      perfilAtualId: perfilAtual.id,
    });

    return {
      status: error.code === "42501" ? "permission_error" : "error",
      message:
        error.code === "42501"
          ? "Permissão negada pelo banco de dados para salvar a foto."
          : "Não foi possível salvar a foto do perfil. Tente novamente.",
    };
  }

  if (!data) {
    console.error("Foto do perfil não atualizada por RLS ou linha não encontrada.", {
      perfilAtualId: perfilAtual.id,
    });

    return {
      status: "permission_error",
      message:
        "Não foi possível salvar a foto. Faça login novamente ou verifique se seu usuário está ativo.",
    };
  }

  revalidatePath("/perfil");
  revalidatePath("/");

  return {
    status: "success",
    message: "Foto salva com sucesso.",
  };
}

export async function atualizarPreferenciasPerfil(preferencias: {
  tema_preferido: TemaPreferido;
  cor_preferida: CorPreferida;
  fonte_escala: FonteEscala;
}): Promise<PerfilActionState> {
  const perfilAtual = await requirePerfilAutenticado();

  if (
    !TEMAS_VALIDOS.has(preferencias.tema_preferido) ||
    !CORES_VALIDAS.has(preferencias.cor_preferida) ||
    !FONTES_VALIDAS.has(preferencias.fonte_escala)
  ) {
    return {
      status: "validation_error",
      message:
        "Preferência visual inválida. Recarregue a página e tente novamente.",
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("perfis")
    .update({
      tema_preferido: preferencias.tema_preferido,
      cor_preferida: preferencias.cor_preferida,
      fonte_escala: preferencias.fonte_escala,
    })
    .eq("id", perfilAtual.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Falha ao atualizar preferências do perfil.", {
      code: error.code,
      message: error.message,
      perfilAtualId: perfilAtual.id,
    });

    return {
      status: error.code === "42501" ? "permission_error" : "error",
      message:
        error.code === "42501"
          ? "Permissão negada pelo banco de dados para salvar as preferências."
          : "Não foi possível salvar as preferências. Tente novamente.",
    };
  }

  if (!data) {
    return {
      status: "permission_error",
      message:
        "Não foi possível salvar as preferências. Faça login novamente ou verifique se seu usuário está ativo.",
    };
  }

  revalidatePath("/perfil");

  return {
    status: "success",
    message: "Preferências salvas com sucesso.",
  };
}
