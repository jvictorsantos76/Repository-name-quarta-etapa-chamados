"use server";

import { revalidatePath } from "next/cache";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import type { HorarioAtendimentoSerializado } from "@/lib/agenda-semanal";

const SLAS_PATH = "/configurar/slas";
const CALENDARIOS_PATH = "/configurar/slas/calendarios";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type ActionResult =
  | {
      ok: true;
      message: string;
    }
  | {
      ok: false;
      error: string;
    };

export type CalendarioSlaInput = {
  id?: string;
  nome: string;
  codigo: string;
  descricao: string;
  fuso_horario: string;
  regime_24x7: boolean;
  atendimento_feriados: boolean;
  ativo: boolean;
  horarios: HorarioAtendimentoSerializado[];
};

export type SlaMetaInput = {
  meta_codigo: string;
  prioridade: "baixa" | "media" | "alta" | "critica";
  prazo_minutos: number;
  ativa: boolean;
  permitir_pausa: boolean;
  usar_janela_cliente: boolean;
};

export type SlaInput = {
  id?: string;
  nome: string;
  codigo: string;
  descricao: string;
  tipo: "padrao" | "contratual" | "especial";
  calendario_sla_id: string;
  ativo: boolean;
  observacoes_internas: string;
  metas: SlaMetaInput[];
};

async function requireGestorSla() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar SLAs.");
  }

  return perfil;
}

function normalizarTexto(valor: string) {
  return valor.trim().replace(/\s+/g, " ");
}

function normalizarCodigo(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function uuidValido(valor: string | undefined) {
  return Boolean(valor && UUID_REGEX.test(valor));
}

function validarHorarios(horarios: HorarioAtendimentoSerializado[]) {
  const dias = new Set<number>();

  for (const horario of horarios) {
    if (
      !Number.isInteger(horario.dia_semana) ||
      horario.dia_semana < 0 ||
      horario.dia_semana > 6
    ) {
      return "Informe dias válidos no calendário.";
    }

    if (!horario.fechado && (!horario.abre_as || !horario.fecha_as)) {
      return "Informe abertura e fechamento para todos os dias abertos.";
    }

    dias.add(horario.dia_semana);
  }

  return dias.size === 7 ? "" : "Informe a agenda de todos os dias da semana.";
}

function mensagemErroUnico(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "Já existe um registro com esse código.";
  }

  if (error.code === "42501") {
    return "Sem permissão para salvar este cadastro.";
  }

  return "Não foi possível salvar o cadastro.";
}

async function codigoSlaDisponivel(codigo: string, idAtual?: string) {
  const supabase = createSupabaseAdminClient();
  const base = normalizarCodigo(codigo) || "sla";
  let tentativa = base;
  let indice = 2;

  while (true) {
    const query = supabase.from("slas").select("id").eq("codigo", tentativa).limit(1);
    const { data, error } = idAtual ? await query.neq("id", idAtual) : await query;

    if (error) {
      throw new Error("Não foi possível validar o código do SLA.");
    }

    if (!data || data.length === 0) {
      return tentativa;
    }

    tentativa = `${base}_${indice}`;
    indice += 1;
  }
}

async function codigoCalendarioDisponivel(codigo: string, idAtual?: string) {
  const supabase = createSupabaseAdminClient();
  const base = normalizarCodigo(codigo) || "calendario_sla";
  let tentativa = base;
  let indice = 2;

  while (true) {
    const query = supabase
      .from("calendarios_sla")
      .select("id")
      .eq("codigo", tentativa)
      .limit(1);
    const { data, error } = idAtual ? await query.neq("id", idAtual) : await query;

    if (error) {
      throw new Error("Não foi possível validar o código do calendário.");
    }

    if (!data || data.length === 0) {
      return tentativa;
    }

    tentativa = `${base}_${indice}`;
    indice += 1;
  }
}

export async function salvarCalendarioSla(
  input: CalendarioSlaInput
): Promise<ActionResult> {
  const perfil = await requireGestorSla();
  const nome = normalizarTexto(input.nome);
  const codigo = await codigoCalendarioDisponivel(input.codigo || nome, input.id);
  const fusoHorario = normalizarTexto(input.fuso_horario) || "America/Fortaleza";
  const erroHorarios = input.regime_24x7 ? "" : validarHorarios(input.horarios);

  if (!nome) {
    return { ok: false, error: "Informe o nome do calendário." };
  }

  if (erroHorarios) {
    return { ok: false, error: erroHorarios };
  }

  const supabase = createSupabaseAdminClient();
  const payload = {
    nome,
    codigo,
    descricao: normalizarTexto(input.descricao) || null,
    fuso_horario: fusoHorario,
    regime_24x7: input.regime_24x7,
    atendimento_feriados: input.atendimento_feriados,
    ativo: input.ativo,
    atualizado_por: perfil.id,
  };
  const resposta = input.id
    ? await supabase.from("calendarios_sla").update(payload).eq("id", input.id)
    : await supabase.from("calendarios_sla").insert({
        ...payload,
        criado_por: perfil.id,
      });

  if (resposta.error) {
    return { ok: false, error: mensagemErroUnico(resposta.error) };
  }

  const calendarioId = input.id
    ? input.id
    : (
        await supabase
          .from("calendarios_sla")
          .select("id")
          .eq("codigo", codigo)
          .maybeSingle()
      ).data?.id;

  if (!calendarioId) {
    return { ok: false, error: "Calendário salvo, mas não foi possível localizar o registro." };
  }

  await supabase
    .from("calendarios_sla_horarios")
    .delete()
    .eq("calendario_sla_id", calendarioId);

  if (!input.regime_24x7) {
    const { error: horariosError } = await supabase
      .from("calendarios_sla_horarios")
      .insert(
        input.horarios.map((horario) => ({
          calendario_sla_id: calendarioId,
          dia_semana: horario.dia_semana,
          fechado: horario.fechado,
          abre_as: horario.abre_as,
          fecha_as: horario.fecha_as,
          ordem: horario.ordem,
          criado_por: perfil.id,
          atualizado_por: perfil.id,
        }))
      );

    if (horariosError) {
      return { ok: false, error: "Calendário salvo, mas os horários não foram gravados." };
    }
  }

  revalidatePath(CALENDARIOS_PATH);
  revalidatePath(SLAS_PATH);

  return { ok: true, message: "Calendário de SLA salvo." };
}

export async function salvarSla(input: SlaInput): Promise<ActionResult> {
  const perfil = await requireGestorSla();
  const nome = normalizarTexto(input.nome);
  const codigo = await codigoSlaDisponivel(input.codigo || nome, input.id);

  if (!nome) {
    return { ok: false, error: "Informe o nome do SLA." };
  }

  if (!uuidValido(input.calendario_sla_id)) {
    return { ok: false, error: "Selecione um calendário de SLA válido." };
  }

  if (input.metas.length === 0) {
    return { ok: false, error: "Informe ao menos uma meta do SLA." };
  }

  const metaInvalida = input.metas.find((meta) => !Number.isFinite(meta.prazo_minutos) || meta.prazo_minutos <= 0);

  if (metaInvalida) {
    return { ok: false, error: "Todas as metas devem ter prazo maior que zero." };
  }

  const supabase = createSupabaseAdminClient();
  const versaoAtual = input.id
    ? (
        await supabase
          .from("slas")
          .select("versao_atual")
          .eq("id", input.id)
          .maybeSingle()
      ).data?.versao_atual ?? 1
    : 0;
  const proximaVersao = input.id ? versaoAtual + 1 : 1;
  const payload = {
    nome,
    codigo,
    descricao: normalizarTexto(input.descricao) || null,
    tipo: input.tipo,
    calendario_sla_id: input.calendario_sla_id,
    ativo: input.ativo,
    observacoes_internas: normalizarTexto(input.observacoes_internas) || null,
    versao_atual: proximaVersao,
    atualizado_por: perfil.id,
  };
  const resposta = input.id
    ? await supabase.from("slas").update(payload).eq("id", input.id)
    : await supabase.from("slas").insert({
        ...payload,
        criado_por: perfil.id,
      });

  if (resposta.error) {
    return { ok: false, error: mensagemErroUnico(resposta.error) };
  }

  const slaId = input.id
    ? input.id
    : (await supabase.from("slas").select("id").eq("codigo", codigo).maybeSingle()).data?.id;

  if (!slaId) {
    return { ok: false, error: "SLA salvo, mas não foi possível localizar o registro." };
  }

  await supabase.from("sla_metas").delete().eq("sla_id", slaId);
  const { error: metasError } = await supabase.from("sla_metas").insert(
    input.metas.map((meta) => ({
      sla_id: slaId,
      meta_codigo: meta.meta_codigo,
      prioridade: meta.prioridade,
      prazo_minutos: Math.trunc(meta.prazo_minutos),
      ativa: meta.ativa,
      considerar_calendario: true,
      permitir_pausa: meta.permitir_pausa,
      usar_janela_cliente: meta.usar_janela_cliente,
      politica_fora_janela: meta.usar_janela_cliente
        ? "sugerir_proxima_janela"
        : "continuar_contagem",
      permitir_pausa_agendamento: meta.usar_janela_cliente && meta.permitir_pausa,
      exigir_justificativa_pausa: true,
      criado_por: perfil.id,
      atualizado_por: perfil.id,
    }))
  );

  if (metasError) {
    return { ok: false, error: "SLA salvo, mas as metas não foram gravadas." };
  }

  const snapshot = {
    ...payload,
    id: slaId,
    metas: input.metas,
  };
  const { error: versaoError } = await supabase.from("sla_versoes").insert({
    sla_id: slaId,
    numero_versao: proximaVersao,
    motivo: input.id ? "Atualização cadastral do SLA." : "Criação do SLA.",
    snapshot,
    criado_por: perfil.id,
  });

  if (versaoError) {
    return { ok: false, error: "SLA salvo, mas a versão histórica não foi registrada." };
  }

  revalidatePath(SLAS_PATH);
  revalidatePath(CALENDARIOS_PATH);
  revalidatePath("/cadastros/contratos");
  revalidatePath("/cadastros/parceiros");

  return { ok: true, message: `SLA salvo na versão ${proximaVersao}.` };
}

export async function alterarStatusSla(id: string, ativo: boolean): Promise<ActionResult> {
  const perfil = await requireGestorSla();

  if (!uuidValido(id)) {
    return { ok: false, error: "SLA inválido." };
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("slas")
    .update({ ativo, atualizado_por: perfil.id })
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível alterar o status do SLA." };
  }

  revalidatePath(SLAS_PATH);
  revalidatePath("/cadastros/contratos");
  revalidatePath("/cadastros/parceiros");

  return { ok: true, message: ativo ? "SLA ativado." : "SLA inativado." };
}

export async function duplicarSla(id: string): Promise<ActionResult> {
  const perfil = await requireGestorSla();

  if (!uuidValido(id)) {
    return { ok: false, error: "SLA inválido." };
  }

  const supabase = createSupabaseAdminClient();
  const [{ data: sla }, { data: metas }] = await Promise.all([
    supabase.from("slas").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("sla_metas")
      .select(
        "meta_codigo, prioridade, prazo_minutos, ativa, considerar_calendario, permitir_pausa, usar_janela_cliente, politica_fora_janela, permitir_pausa_agendamento, exigir_justificativa_pausa"
      )
      .eq("sla_id", id),
  ]);

  if (!sla) {
    return { ok: false, error: "SLA original não encontrado." };
  }

  const codigo = await codigoSlaDisponivel(`${sla.codigo}_copia`);
  const { data: novoSla, error } = await supabase
    .from("slas")
    .insert({
      nome: `${sla.nome} - Cópia`,
      codigo,
      descricao: sla.descricao,
      tipo: sla.tipo,
      calendario_sla_id: sla.calendario_sla_id,
      ativo: false,
      observacoes_internas: sla.observacoes_internas,
      versao_atual: 1,
      criado_por: perfil.id,
      atualizado_por: perfil.id,
    })
    .select("id")
    .single();

  if (error || !novoSla) {
    return { ok: false, error: "Não foi possível duplicar o SLA." };
  }

  const metasBase = (metas ?? []) as Array<{
    meta_codigo: string;
    prioridade: string;
    prazo_minutos: number;
    ativa: boolean;
    considerar_calendario: boolean;
    permitir_pausa: boolean;
    usar_janela_cliente: boolean;
    politica_fora_janela: string;
    permitir_pausa_agendamento: boolean;
    exigir_justificativa_pausa: boolean;
  }>;

  if (metasBase.length > 0) {
    await supabase.from("sla_metas").insert(
      metasBase.map((meta) => ({
        ...meta,
        sla_id: novoSla.id,
        criado_por: perfil.id,
        atualizado_por: perfil.id,
      }))
    );
  }

  await supabase.from("sla_versoes").insert({
    sla_id: novoSla.id,
    numero_versao: 1,
    motivo: "Duplicação de SLA existente.",
    snapshot: { origem_sla_id: id, metas: metasBase },
    criado_por: perfil.id,
  });

  revalidatePath(SLAS_PATH);

  return { ok: true, message: "SLA duplicado como inativo." };
}
