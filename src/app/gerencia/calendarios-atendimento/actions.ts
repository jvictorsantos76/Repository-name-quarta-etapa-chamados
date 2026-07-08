"use server";

import { revalidatePath } from "next/cache";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import type { HorarioAtendimentoSerializado } from "@/lib/agenda-semanal";

const CALENDARIOS_ATENDIMENTO_PATH = "/gerencia/calendarios-atendimento";
const PARCEIROS_PATH = "/cadastros/parceiros";
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

export type CalendarioAtendimentoInput = {
  id?: string;
  nome: string;
  codigo: string;
  descricao: string;
  tipo: "padrao" | "especifico" | "excecao";
  fuso_horario: string;
  atendimento_feriados: boolean;
  necessita_agendamento: boolean;
  ativo: boolean;
  padrao_global: boolean;
  horarios: HorarioAtendimentoSerializado[];
};

async function requireGestorCalendariosAtendimento() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar calendários de atendimento.");
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

function horarioMinutos(valor: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(valor);

  if (!match) {
    return null;
  }

  const horas = Number(match[1]);
  const minutos = Number(match[2]);

  if (horas > 23 || minutos > 59) {
    return null;
  }

  return horas * 60 + minutos;
}

function validarHorarios(horarios: HorarioAtendimentoSerializado[]) {
  const porDia = new Map<number, HorarioAtendimentoSerializado[]>();

  for (const horario of horarios) {
    if (
      !Number.isInteger(horario.dia_semana) ||
      horario.dia_semana < 0 ||
      horario.dia_semana > 6
    ) {
      return "Informe dias válidos no calendário.";
    }

    if (horario.fechado) {
      if (horario.abre_as || horario.fecha_as) {
        return "Dia fechado não pode ter intervalo de atendimento.";
      }
    } else {
      if (!horario.abre_as || !horario.fecha_as) {
        return "Informe abertura e fechamento para todos os dias abertos.";
      }

      const inicio = horarioMinutos(horario.abre_as);
      const fim = horarioMinutos(horario.fecha_as);

      if (inicio === null || fim === null) {
        return "Informe horários válidos no formato HH:MM.";
      }

      if (fim <= inicio) {
        return "O horário de fechamento deve ser maior que o de abertura.";
      }
    }

    const dia = porDia.get(horario.dia_semana) ?? [];
    dia.push(horario);
    porDia.set(horario.dia_semana, dia);
  }

  if (porDia.size !== 7) {
    return "Informe a agenda de todos os dias da semana.";
  }

  for (const [diaSemana, intervalos] of porDia) {
    if (intervalos.some((intervalo) => intervalo.fechado) && intervalos.length > 1) {
      return "Dia fechado não pode ter intervalos de atendimento.";
    }

    if (intervalos[0]?.fechado) {
      continue;
    }

    const ordenados = [...intervalos].sort((a, b) => {
      const inicioA = horarioMinutos(a.abre_as ?? "") ?? 0;
      const inicioB = horarioMinutos(b.abre_as ?? "") ?? 0;
      return inicioA - inicioB;
    });

    if (ordenados.length === 0) {
      return `Informe ao menos um intervalo para o dia ${diaSemana}.`;
    }

    for (let index = 0; index < ordenados.length; index += 1) {
      const atual = ordenados[index];
      const anterior = ordenados[index - 1];

      if (
        anterior &&
        (horarioMinutos(atual.abre_as ?? "") ?? 0) <
          (horarioMinutos(anterior.fecha_as ?? "") ?? 0)
      ) {
        return "Não é permitido sobrepor intervalos no mesmo dia.";
      }
    }
  }

  return "";
}

function mensagemErroUnico(error: { code?: string; message?: string }) {
  if (error.code === "23505") {
    return "Já existe um calendário com esse código ou padrão global ativo.";
  }

  if (error.code === "42501") {
    return "Sem permissão para salvar este cadastro.";
  }

  if (
    error.code === "PGRST205" ||
    error.message?.includes("schema cache") ||
    error.message?.includes("Could not find the table")
  ) {
    return "A migration de calendários de atendimento ainda não foi aplicada no banco conectado ao localhost.";
  }

  return "Não foi possível salvar o calendário de atendimento.";
}

function mensagemErroDesconhecido(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

async function codigoCalendarioDisponivel(codigo: string, idAtual?: string) {
  const supabase = createSupabaseAdminClient();
  const base = normalizarCodigo(codigo) || "calendario_atendimento";
  let tentativa = base;
  let indice = 2;

  while (true) {
    const query = supabase
      .from("calendarios_atendimento")
      .select("id")
      .eq("codigo", tentativa)
      .limit(1);
    const { data, error } = idAtual ? await query.neq("id", idAtual) : await query;

    if (error) {
      throw new Error(mensagemErroUnico(error));
    }

    if (!data || data.length === 0) {
      return tentativa;
    }

    tentativa = `${base}_${indice}`;
    indice += 1;
  }
}

export async function salvarCalendarioAtendimento(
  input: CalendarioAtendimentoInput
): Promise<ActionResult> {
  const perfil = await requireGestorCalendariosAtendimento();
  const nome = normalizarTexto(input.nome);
  const fusoHorario = normalizarTexto(input.fuso_horario) || "America/Fortaleza";
  const tipo = ["padrao", "especifico", "excecao"].includes(input.tipo)
    ? input.tipo
    : "padrao";

  if (!nome) {
    return { ok: false, error: "Informe o nome do calendário." };
  }

  if (input.id && !uuidValido(input.id)) {
    return { ok: false, error: "Calendário inválido." };
  }

  const erroHorarios = validarHorarios(input.horarios);

  if (erroHorarios) {
    return { ok: false, error: erroHorarios };
  }

  let codigo: string;

  try {
    codigo = await codigoCalendarioDisponivel(input.codigo || nome, input.id);
  } catch (error) {
    return {
      ok: false,
      error: mensagemErroDesconhecido(
        error,
        "Não foi possível validar o código do calendário."
      ),
    };
  }

  const supabase = createSupabaseAdminClient();

  if (input.padrao_global && input.ativo) {
    const limparPadrao = input.id
      ? await supabase
          .from("calendarios_atendimento")
          .update({ padrao_global: false, atualizado_por: perfil.id })
          .neq("id", input.id)
      : await supabase
          .from("calendarios_atendimento")
          .update({ padrao_global: false, atualizado_por: perfil.id })
          .eq("padrao_global", true);

    if (limparPadrao.error) {
      return { ok: false, error: "Não foi possível ajustar o padrão global atual." };
    }
  }

  const payload = {
    nome,
    codigo,
    descricao: normalizarTexto(input.descricao) || null,
    tipo,
    fuso_horario: fusoHorario,
    atendimento_feriados: input.atendimento_feriados,
    necessita_agendamento: input.necessita_agendamento,
    ativo: input.ativo,
    padrao_global: input.padrao_global,
    atualizado_por: perfil.id,
  };
  const resposta = input.id
    ? await supabase
        .from("calendarios_atendimento")
        .update(payload)
        .eq("id", input.id)
        .select("id")
        .single()
    : await supabase
        .from("calendarios_atendimento")
        .insert({
          ...payload,
          criado_por: perfil.id,
        })
        .select("id")
        .single();

  if (resposta.error || !resposta.data?.id) {
    return { ok: false, error: mensagemErroUnico(resposta.error ?? {}) };
  }

  const calendarioId = String(resposta.data.id);
  const exclusao = await supabase
    .from("calendarios_atendimento_horarios")
    .delete()
    .eq("calendario_atendimento_id", calendarioId);

  if (exclusao.error) {
    return {
      ok: false,
      error: "Calendário salvo, mas os horários anteriores não foram substituídos.",
    };
  }

  const { error: horariosError } = await supabase
    .from("calendarios_atendimento_horarios")
    .insert(
      input.horarios.map((horario) => ({
        calendario_atendimento_id: calendarioId,
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

  revalidatePath(CALENDARIOS_ATENDIMENTO_PATH);
  revalidatePath(PARCEIROS_PATH);
  revalidatePath(`${PARCEIROS_PATH}/nova`);

  return { ok: true, message: "Calendário de atendimento salvo." };
}

export async function alterarStatusCalendarioAtendimento(
  id: string,
  ativo: boolean
): Promise<ActionResult> {
  const perfil = await requireGestorCalendariosAtendimento();

  if (!uuidValido(id)) {
    return { ok: false, error: "Calendário inválido." };
  }

  const supabase = createSupabaseAdminClient();
  const payload = ativo
    ? { ativo, atualizado_por: perfil.id }
    : { ativo, padrao_global: false, atualizado_por: perfil.id };
  const { error } = await supabase
    .from("calendarios_atendimento")
    .update(payload)
    .eq("id", id);

  if (error) {
    return { ok: false, error: "Não foi possível alterar o status do calendário." };
  }

  revalidatePath(CALENDARIOS_ATENDIMENTO_PATH);
  revalidatePath(PARCEIROS_PATH);
  revalidatePath(`${PARCEIROS_PATH}/nova`);

  return { ok: true, message: ativo ? "Calendário ativado." : "Calendário inativado." };
}
