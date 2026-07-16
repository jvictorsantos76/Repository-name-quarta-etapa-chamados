import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CALENDARIOS_SLA_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  CalendariosSlaClient,
  type CalendarioSlaHorarioItem,
  type CalendarioSlaListItem,
} from "./CalendariosSlaClient";

type CalendarioRow = Omit<CalendarioSlaListItem, "referencias" | "horarios">;

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find the table")
  );
}

const SCHEMA_PENDENTE_MENSAGEM =
  "A migration de SLAs e horários de funcionamento ainda não foi aplicada no banco conectado ao localhost.";

export default async function CalendariosSlaPage() {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [calendariosResposta, horariosResposta, slasResposta] = await Promise.all([
    supabase
      .from("calendarios_sla")
      .select("id, nome, codigo, descricao, fuso_horario, regime_24x7, atendimento_feriados, ativo, atualizado_em")
      .order("nome"),
    supabase
      .from("calendarios_sla_horarios")
      .select("calendario_sla_id, dia_semana, fechado, abre_as, fecha_as, ordem")
      .order("dia_semana")
      .order("ordem"),
    supabase.from("slas").select("id, calendario_sla_id"),
  ]);
  const errosConsulta = [
    calendariosResposta.error,
    horariosResposta.error,
    slasResposta.error,
  ];
  const erroSchema = errosConsulta.find((item) => item && isSchemaCacheError(item.message));
  const erro =
    errosConsulta.find((item) => item && !isSchemaCacheError(item.message)) ?? null;
  const horariosPorCalendario = new Map<string, CalendarioSlaHorarioItem[]>();

  for (const horario of
    (horariosResposta.data as
      | (CalendarioSlaHorarioItem & { calendario_sla_id: string })[]
      | null) ?? []) {
    const atuais = horariosPorCalendario.get(horario.calendario_sla_id) ?? [];
    atuais.push({
      dia_semana: horario.dia_semana,
      fechado: horario.fechado,
      abre_as: horario.abre_as,
      fecha_as: horario.fecha_as,
      ordem: horario.ordem,
    });
    horariosPorCalendario.set(horario.calendario_sla_id, atuais);
  }

  const referenciasPorCalendario = new Map<string, number>();

  for (const sla of
    (slasResposta.data as { calendario_sla_id: string | null }[] | null) ?? []) {
    if (!sla.calendario_sla_id) {
      continue;
    }

    referenciasPorCalendario.set(
      sla.calendario_sla_id,
      (referenciasPorCalendario.get(sla.calendario_sla_id) ?? 0) + 1
    );
  }

  const calendarios: CalendarioSlaListItem[] =
    ((calendariosResposta.data as CalendarioRow[] | null) ?? []).map((item) => ({
      ...item,
      referencias: referenciasPorCalendario.get(item.id) ?? 0,
      horarios: horariosPorCalendario.get(item.id) ?? [],
    }));

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <CalendariosSlaClient
        calendarios={calendarios}
        pageVersion={CALENDARIOS_SLA_PAGE_VERSION}
        erroCarregamento={
          erroSchema
            ? SCHEMA_PENDENTE_MENSAGEM
            : erro
              ? "Não foi possível carregar horários de funcionamento."
              : null
        }
      />
    </main>
  );
}
