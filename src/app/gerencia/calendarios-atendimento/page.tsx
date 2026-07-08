import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CALENDARIOS_ATENDIMENTO_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  CalendariosAtendimentoClient,
  type CalendarioAtendimentoHorarioItem,
  type CalendarioAtendimentoListItem,
} from "./CalendariosAtendimentoClient";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type CalendarioRow = Omit<
  CalendarioAtendimentoListItem,
  "vinculos" | "horarios"
>;

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find the table")
  );
}

async function getSearchParam(
  searchParams: PageProps["searchParams"],
  key: string
) {
  const params = searchParams ? await searchParams : {};
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

const SCHEMA_PENDENTE_MENSAGEM =
  "A migration de calendários de atendimento ainda não foi aplicada no banco conectado ao localhost.";

export default async function CalendariosAtendimentoPage({
  searchParams,
}: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [calendariosResposta, horariosResposta, parceirosResposta] =
    await Promise.all([
      supabase
        .from("calendarios_atendimento")
        .select(
          "id, nome, codigo, descricao, tipo, fuso_horario, atendimento_feriados, necessita_agendamento, ativo, padrao_global, atualizado_em"
        )
        .order("nome"),
      supabase
        .from("calendarios_atendimento_horarios")
        .select(
          "calendario_atendimento_id, dia_semana, fechado, abre_as, fecha_as, ordem"
        )
        .order("dia_semana")
        .order("ordem"),
      supabase.from("parceiros").select("id, calendario_atendimento_id"),
    ]);
  const errosConsulta = [
    calendariosResposta.error,
    horariosResposta.error,
    parceirosResposta.error,
  ];
  const erroSchema = errosConsulta.find((item) =>
    item ? isSchemaCacheError(item.message) : false
  );
  const erro =
    errosConsulta.find((item) => item && !isSchemaCacheError(item.message)) ?? null;
  const horariosPorCalendario = new Map<string, CalendarioAtendimentoHorarioItem[]>();

  for (const horario of
    (horariosResposta.data as
      | (CalendarioAtendimentoHorarioItem & {
          calendario_atendimento_id: string;
        })[]
      | null) ?? []) {
    const atuais = horariosPorCalendario.get(horario.calendario_atendimento_id) ?? [];
    atuais.push({
      dia_semana: horario.dia_semana,
      fechado: horario.fechado,
      abre_as: horario.abre_as,
      fecha_as: horario.fecha_as,
      ordem: horario.ordem,
    });
    horariosPorCalendario.set(horario.calendario_atendimento_id, atuais);
  }

  const vinculosPorCalendario = new Map<string, number>();

  for (const parceiro of
    (parceirosResposta.data as
      | { calendario_atendimento_id: string | null }[]
      | null) ?? []) {
    if (!parceiro.calendario_atendimento_id) {
      continue;
    }

    vinculosPorCalendario.set(
      parceiro.calendario_atendimento_id,
      (vinculosPorCalendario.get(parceiro.calendario_atendimento_id) ?? 0) + 1
    );
  }

  const calendarios: CalendarioAtendimentoListItem[] =
    ((calendariosResposta.data as CalendarioRow[] | null) ?? []).map((item) => ({
      ...item,
      vinculos: vinculosPorCalendario.get(item.id) ?? 0,
      horarios: horariosPorCalendario.get(item.id) ?? [],
    }));
  const editarId = await getSearchParam(searchParams, "editar");

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <CalendariosAtendimentoClient
        calendarios={calendarios}
        pageVersion={CALENDARIOS_ATENDIMENTO_PAGE_VERSION}
        editarIdInicial={editarId ?? ""}
        erroCarregamento={
          erroSchema
            ? SCHEMA_PENDENTE_MENSAGEM
            : erro
              ? "Não foi possível carregar calendários de atendimento."
              : null
        }
      />
    </main>
  );
}
