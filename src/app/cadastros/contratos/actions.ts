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

function numeroOuNull(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor).replace(/\./g, "").replace(",", ".");
  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : null;
}

function inteiroOuNull(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor);
  const numero = Number.parseInt(texto, 10);

  return Number.isFinite(numero) ? numero : null;
}

function parseDateUtc(valor: string | null) {
  if (!valor) {
    return null;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);

  if (!ano || !mes || !dia) {
    return null;
  }

  return new Date(Date.UTC(ano, mes - 1, dia));
}

function calcularParcelasPrevistas(
  inicioContrato: string | null,
  terminoContrato: string | null,
  periodicidade: string | null
) {
  if (periodicidade === "unico") {
    return 1;
  }

  const inicio = parseDateUtc(inicioContrato);
  const termino = parseDateUtc(terminoContrato);

  if (!inicio || !termino || termino < inicio) {
    return 1;
  }

  const meses =
    (termino.getUTCFullYear() - inicio.getUTCFullYear()) * 12 +
    (termino.getUTCMonth() - inicio.getUTCMonth()) +
    (termino.getUTCDate() > inicio.getUTCDate() ? 1 : 0);
  const intervaloMeses =
    periodicidade === "bimestral"
      ? 2
      : periodicidade === "trimestral"
        ? 3
        : periodicidade === "semestral"
          ? 6
          : periodicidade === "anual"
            ? 12
            : 1;

  return Math.max(1, Math.ceil(Math.max(1, meses) / intervaloMeses));
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
  const cobrarOutroContato = formData.get("cobrar_outro_contato") === "on";
  const cobrancaParceiroId = normalizarTexto(formData.get("cobranca_parceiro_id"));
  const valor = numeroOuNull(formData.get("valor"));
  const vigenciaInicio = dataOuNull(formData.get("vigencia_inicio"));
  const vigenciaFim = dataOuNull(formData.get("vigencia_fim"));
  const periodicidade = textoOuNull(formData.get("periodicidade"));
  const valorTotalInformado = numeroOuNull(formData.get("valor_total_previsto"));
  const valorTotalCalculado =
    valor === null
      ? null
      : valor *
        calcularParcelasPrevistas(vigenciaInicio, vigenciaFim, periodicidade);

  if (
    !parceiroId ||
    !contrato ||
    !isStatusContrato(status) ||
    (cobrarOutroContato && !cobrancaParceiroId)
  ) {
    redirect("/cadastros/contratos?erro=contrato");
  }

  const supabase = createSupabaseAdminClient();
  const payload = {
    parceiro_id: parceiroId,
    contrato,
    descricao_contrato: textoOuNull(formData.get("descricao_contrato")),
    valor,
    vigencia_inicio: vigenciaInicio,
    vigencia_fim: vigenciaFim,
    data_base: dataOuNull(formData.get("data_base")),
    vencimento: textoOuNull(formData.get("vencimento")),
    dia_vencimento: inteiroOuNull(formData.get("dia_vencimento")),
    periodicidade,
    valor_total_previsto: valorTotalInformado ?? valorTotalCalculado,
    gerar_nota_fiscal: normalizarTexto(formData.get("gerar_nota_fiscal")) === "sim",
    data_contrato: dataOuNull(formData.get("data_contrato")),
    impressao_periodo_cobranca: textoOuNull(formData.get("impressao_periodo_cobranca")),
    cobrar_outro_contato: cobrarOutroContato,
    cobranca_parceiro_id: cobrarOutroContato ? cobrancaParceiroId : null,
    renovacao_automatica: formData.get("renovacao_automatica") === "on",
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
