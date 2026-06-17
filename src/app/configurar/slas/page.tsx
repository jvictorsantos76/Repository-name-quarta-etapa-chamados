import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { SLAS_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  SlaClient,
  type CalendarioSlaOpcao,
  type SlaListItem,
  type SlaMetaItem,
} from "./SlaClient";

type SlaRow = Omit<SlaListItem, "calendario_nome" | "metas" | "vinculos" | "versoes">;

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find the table")
  );
}

export default async function SlasPage() {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [
    slasResposta,
    calendariosResposta,
    metasResposta,
    versoesResposta,
    contratosResposta,
    parceirosResposta,
  ] = await Promise.all([
    supabase
      .from("slas")
      .select("id, nome, codigo, descricao, tipo, calendario_sla_id, ativo, observacoes_internas, versao_atual, atualizado_em")
      .order("nome"),
    supabase
      .from("calendarios_sla")
      .select("id, nome, codigo, ativo")
      .order("nome"),
    supabase
      .from("sla_metas")
      .select("id, sla_id, meta_codigo, prioridade, prazo_minutos, ativa, permitir_pausa, usar_janela_cliente")
      .order("prioridade")
      .order("meta_codigo"),
    supabase.from("sla_versoes").select("id, sla_id"),
    supabase.from("parceiros_contratos").select("id, sla_id"),
    supabase.from("parceiros").select("id, sla_padrao_id"),
  ]);
  const erro =
    [
      slasResposta.error,
      calendariosResposta.error,
      metasResposta.error,
      versoesResposta.error,
      contratosResposta.error,
      parceirosResposta.error,
    ].find((item) => item && !isSchemaCacheError(item.message)) ?? null;
  const calendarios = ((calendariosResposta.data as CalendarioSlaOpcao[] | null) ?? []);
  const calendariosPorId = new Map(calendarios.map((item) => [item.id, item]));
  const metasPorSla = new Map<string, SlaMetaItem[]>();

  for (const meta of
    (metasResposta.data as (SlaMetaItem & { sla_id: string })[] | null) ?? []) {
    const atuais = metasPorSla.get(meta.sla_id) ?? [];
    atuais.push({
      id: meta.id,
      meta_codigo: meta.meta_codigo,
      prioridade: meta.prioridade,
      prazo_minutos: meta.prazo_minutos,
      ativa: meta.ativa,
      permitir_pausa: meta.permitir_pausa,
      usar_janela_cliente: meta.usar_janela_cliente,
    });
    metasPorSla.set(meta.sla_id, atuais);
  }

  const versoesPorSla = new Map<string, number>();

  for (const versao of (versoesResposta.data as { sla_id: string }[] | null) ?? []) {
    versoesPorSla.set(versao.sla_id, (versoesPorSla.get(versao.sla_id) ?? 0) + 1);
  }

  const vinculosPorSla = new Map<string, number>();

  for (const contrato of
    (contratosResposta.data as { sla_id: string | null }[] | null) ?? []) {
    if (contrato.sla_id) {
      vinculosPorSla.set(contrato.sla_id, (vinculosPorSla.get(contrato.sla_id) ?? 0) + 1);
    }
  }

  for (const parceiro of
    (parceirosResposta.data as { sla_padrao_id: string | null }[] | null) ?? []) {
    if (parceiro.sla_padrao_id) {
      vinculosPorSla.set(
        parceiro.sla_padrao_id,
        (vinculosPorSla.get(parceiro.sla_padrao_id) ?? 0) + 1
      );
    }
  }

  const slas: SlaListItem[] = ((slasResposta.data as SlaRow[] | null) ?? []).map(
    (sla) => ({
      ...sla,
      tipo: sla.tipo,
      calendario_nome:
        calendariosPorId.get(sla.calendario_sla_id)?.nome ?? "Calendário não encontrado",
      metas: metasPorSla.get(sla.id) ?? [],
      vinculos: vinculosPorSla.get(sla.id) ?? 0,
      versoes: versoesPorSla.get(sla.id) ?? 0,
    })
  );

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <SlaClient
        slas={slas}
        calendarios={calendarios}
        pageVersion={SLAS_PAGE_VERSION}
        erroCarregamento={erro ? "Não foi possível carregar SLAs." : null}
      />
    </main>
  );
}
