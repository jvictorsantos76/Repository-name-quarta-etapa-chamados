import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PARCEIROS_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { ParceiroForm } from "../ParceiroForm";
import type {
  OrganizacaoParceiroOpcao,
  ParceiroCalendarioAtendimentoOpcao,
} from "../types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function getErro(searchParams: PageProps["searchParams"]) {
  const params = searchParams ? await searchParams : {};
  const value = params.erro;

  return Array.isArray(value) ? value[0] : value;
}

async function getSalvo(searchParams: PageProps["searchParams"]) {
  const params = searchParams ? await searchParams : {};
  const value = params.salvo;

  return Array.isArray(value) ? value[0] : value;
}

export default async function NovoParceiroPage({ searchParams }: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const erro = await getErro(searchParams);
  const salvo = await getSalvo(searchParams);
  const sucesso =
    salvo === "novo_cliente"
      ? "Cadastro anterior salvo. Preencha os dados do novo cliente."
      : null;
  const supabase = createSupabaseAdminClient();
  const [
    organizacoesResposta,
    calendariosAtendimentoResposta,
    calendariosAtendimentoHorariosResposta,
  ] = await Promise.all([
    supabase
      .from("organizacoes")
      .select("id, nome, codigo_interno, ativo")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("calendarios_atendimento")
      .select("id, nome, codigo, tipo, fuso_horario, atendimento_feriados, necessita_agendamento, ativo, padrao_global")
      .eq("ativo", true)
      .order("padrao_global", { ascending: false })
      .order("nome"),
    supabase
      .from("calendarios_atendimento_horarios")
      .select("calendario_atendimento_id, dia_semana, fechado, abre_as, fecha_as, ordem")
      .order("dia_semana")
      .order("ordem"),
  ]);
  const organizacoes =
    (organizacoesResposta.data as OrganizacaoParceiroOpcao[] | null) ?? [];
  const horariosPorCalendario = new Map<
    string,
    ParceiroCalendarioAtendimentoOpcao["horarios"]
  >();

  for (const horario of
    (calendariosAtendimentoHorariosResposta.data as
      | (ParceiroCalendarioAtendimentoOpcao["horarios"][number] & {
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

  const calendariosAtendimento: ParceiroCalendarioAtendimentoOpcao[] =
    ((calendariosAtendimentoResposta.data as
      | Omit<ParceiroCalendarioAtendimentoOpcao, "horarios">[]
      | null) ?? []).map((calendario) => ({
      ...calendario,
      horarios: horariosPorCalendario.get(calendario.id) ?? [],
    }));

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
        <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <nav
            aria-label="Navegação de cadastros"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600"
          >
            <Link href="/cadastros/parceiros" className="hover:text-gray-950">
              Cadastros
            </Link>
            <span aria-hidden="true" className="text-gray-400">
              &gt;
            </span>
            <Link href="/cadastros/parceiros" className="hover:text-gray-950">
              Clientes / Parceiros
            </Link>
            <span aria-hidden="true" className="text-gray-400">
              &gt;
            </span>
            <span className="text-gray-950">Novo</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
              Novo parceiro
            </h1>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {PARCEIROS_PAGE_VERSION}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Cadastre a entidade comercial ou operacional sem alterar o agrupamento interno de organizações.
          </p>
        </div>

        <ParceiroForm
          organizacoes={organizacoes}
          calendariosAtendimento={calendariosAtendimento}
          erro={erro}
          sucesso={sucesso}
        />
      </section>
    </main>
  );
}
