"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { isTipoOrganizacao } from "./types";

const LISTAGEM_ORGANIZACOES_PATH = "/cadastros/organizacoes";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizarTexto(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

function normalizarTextoLivre(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim() || null;
}

function redirectComErro(path: string, erro: string) {
  redirect(`${path}?erro=${encodeURIComponent(erro)}`);
}

function normalizarIds(values: FormDataEntryValue[]) {
  return Array.from(
    new Set(values.map((value) => String(value)).filter((value) => UUID_REGEX.test(value)))
  );
}

async function requireGestorOrganizacoes() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar organizações.");
  }

  return perfil;
}

function montarPayload(formData: FormData) {
  const nome = normalizarTexto(formData.get("nome"));
  const tipoOrganizacao = normalizarTexto(formData.get("tipo_organizacao"));

  if (!nome) {
    return { ok: false as const, error: "Informe o nome da organização." };
  }

  if (!isTipoOrganizacao(tipoOrganizacao)) {
    return { ok: false as const, error: "Informe um tipo de organização válido." };
  }

  return {
    ok: true as const,
    payload: {
      nome,
      codigo_interno: normalizarTexto(formData.get("codigo_interno")) || null,
      tipo_organizacao: tipoOrganizacao,
      possui_filiais: formData.get("possui_filiais") === "on",
      ativo: formData.get("ativo") === "on",
      observacoes: normalizarTextoLivre(formData.get("observacoes")),
      logo_url: normalizarTextoLivre(formData.get("logo_url")),
      cor_identificacao: normalizarTexto(formData.get("cor_identificacao")) || null,
      sistema_externo_padrao:
        normalizarTexto(formData.get("sistema_externo_padrao")) || null,
      id_externo: normalizarTexto(formData.get("id_externo")) || null,
    },
  };
}

export async function salvarOrganizacao(formData: FormData) {
  const perfil = await requireGestorOrganizacoes();
  const id = normalizarTexto(formData.get("id"));
  const origem = id
    ? `${LISTAGEM_ORGANIZACOES_PATH}/${id}`
    : `${LISTAGEM_ORGANIZACOES_PATH}/nova`;
  const resultado = montarPayload(formData);

  if (!resultado.ok) {
    redirectComErro(origem, resultado.error);
  }

  const supabase = createSupabaseAdminClient();
  const payload = {
    ...resultado.payload,
    atualizado_por: perfil.id,
  };
  const clientesSelecionados = normalizarIds(formData.getAll("clientes_vinculados"));

  const response = id
    ? await supabase.from("organizacoes").update(payload).eq("id", id)
    : await supabase.from("organizacoes").insert({
        ...payload,
        criado_por: perfil.id,
      });

  if (response.error) {
    const mensagem =
      response.error.code === "23505"
        ? "Já existe uma organização com esse código interno."
        : "Não foi possível salvar a organização.";

    redirectComErro(origem, mensagem);
  }

  if (id) {
    if (clientesSelecionados.length > 0) {
      const vinculoResposta = await supabase
        .from("clientes")
        .update({ organizacao_id: id })
        .in("id", clientesSelecionados);

      if (vinculoResposta.error) {
        redirectComErro(origem, "Não foi possível vincular os clientes à organização.");
      }

      const desvinculoResposta = await supabase
        .from("clientes")
        .update({ organizacao_id: null })
        .eq("organizacao_id", id)
        .not("id", "in", `(${clientesSelecionados.join(",")})`);

      if (desvinculoResposta.error) {
        redirectComErro(origem, "Não foi possível atualizar os clientes desvinculados.");
      }
    } else {
      const desvinculoResposta = await supabase
        .from("clientes")
        .update({ organizacao_id: null })
        .eq("organizacao_id", id);

      if (desvinculoResposta.error) {
        redirectComErro(origem, "Não foi possível desvincular os clientes da organização.");
      }
    }
  }

  revalidatePath(LISTAGEM_ORGANIZACOES_PATH);
  revalidatePath("/chamados/novo");
  revalidatePath("/");

  if (id) {
    revalidatePath(`${LISTAGEM_ORGANIZACOES_PATH}/${id}`);
  }

  redirect(`${LISTAGEM_ORGANIZACOES_PATH}?salvo=1`);
}

export async function alterarStatusOrganizacao(id: string, ativo: boolean) {
  const perfil = await requireGestorOrganizacoes();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("organizacoes")
    .update({
      ativo,
      atualizado_por: perfil.id,
    })
    .eq("id", id);

  if (error) {
    redirectComErro(
      LISTAGEM_ORGANIZACOES_PATH,
      "Não foi possível alterar o status da organização."
    );
  }

  revalidatePath(LISTAGEM_ORGANIZACOES_PATH);
  revalidatePath(`${LISTAGEM_ORGANIZACOES_PATH}/${id}`);
}
