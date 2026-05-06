"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { podeAdministrarUsuarios } from "@/lib/auth/permissions";
import {
  clearSupabaseSessionCookies,
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

export type PerfilActionState = {
  status: "idle" | "success" | "validation_error" | "permission_error" | "error";
  message: string;
};

export type LogoutActionState = {
  status: "idle" | "error";
  message: string;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

  const supabase = await createSupabaseServerClient();
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
    return {
      status: "permission_error",
      message:
        "O perfil não foi atualizado. Verifique se você tem permissão para este usuário.",
    };
  }

  revalidatePath("/perfil");

  return {
    status: "success",
    message: "Perfil salvo com sucesso.",
  };
}

export async function encerrarSessaoUsuario(): Promise<LogoutActionState> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  await clearSupabaseSessionCookies();

  redirect("/login");
}
