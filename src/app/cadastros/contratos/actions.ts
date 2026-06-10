"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { isStatusContrato } from "../parceiros/types";

function normalizarTexto(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

function textoOuNull(valor: FormDataEntryValue | null) {
  return normalizarTexto(valor) || null;
}

function dataOuNull(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor);
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null;
}

async function requireGestorContratos() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    redirect("/");
  }

  return perfil;
}

export async function salvarContratoGerencia(formData: FormData) {
  const perfil = await requireGestorContratos();
  const id = normalizarTexto(formData.get("id"));
  const parceiroId = normalizarTexto(formData.get("parceiro_id"));
  const contrato = normalizarTexto(formData.get("contrato"));
  const status = normalizarTexto(formData.get("status"));

  if (!parceiroId || !contrato || !isStatusContrato(status)) {
    redirect("/cadastros/contratos?erro=contrato");
  }

  const supabase = createSupabaseAdminClient();
  const payload = {
    parceiro_id: parceiroId,
    contrato,
    vigencia_inicio: dataOuNull(formData.get("vigencia_inicio")),
    vigencia_fim: dataOuNull(formData.get("vigencia_fim")),
    sla: textoOuNull(formData.get("sla")),
    status,
    observacoes: textoOuNull(formData.get("observacoes")),
    atualizado_por: perfil.id,
  };

  const resposta = id
    ? await supabase.from("parceiros_contratos").update(payload).eq("id", id)
    : await supabase.from("parceiros_contratos").insert({
        ...payload,
        criado_por: perfil.id,
      });

  if (resposta.error) {
    redirect("/cadastros/contratos?erro=salvar");
  }

  revalidatePath("/cadastros/contratos");
  revalidatePath(`/cadastros/parceiros/${parceiroId}`);
  redirect(`/cadastros/contratos?salvo=1&parceiro=${parceiroId}`);
}
