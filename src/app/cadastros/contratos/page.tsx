import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CONTRATOS_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  ContratosClient,
  type ContratoListItem,
  type ContratoParceiroOpcao,
  type ContratoSlaOpcao,
} from "./ContratosClient";
import type { StatusContrato } from "../parceiros/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function getSearchParam(
  searchParams: PageProps["searchParams"],
  key: string
) {
  const params = searchParams ? await searchParams : {};
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

type ContratoRow = {
  id: string;
  parceiro_id: string;
  contrato: string;
  descricao_contrato: string | null;
  valor: number | null;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  data_base: string | null;
  vencimento: string | null;
  dia_vencimento: number | null;
  periodicidade: string | null;
  valor_total_previsto: number | null;
  gerar_nota_fiscal: boolean;
  data_contrato: string | null;
  impressao_periodo_cobranca: string | null;
  cobrar_outro_contato: boolean;
  cobranca_parceiro_id: string | null;
  renovacao_automatica: boolean;
  sla_id: string | null;
  sla: string | null;
  status: StatusContrato;
  observacoes: string | null;
};

type ParceiroRow = {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  codigo_interno: string | null;
  ativo: boolean;
};

type SlaRow = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
};

export default async function ContratosPage({ searchParams }: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [contratosResposta, parceirosResposta, slasResposta] = await Promise.all([
    supabase
      .from("parceiros_contratos")
      .select("id, parceiro_id, contrato, descricao_contrato, valor, vigencia_inicio, vigencia_fim, data_base, vencimento, dia_vencimento, periodicidade, valor_total_previsto, gerar_nota_fiscal, data_contrato, impressao_periodo_cobranca, cobrar_outro_contato, cobranca_parceiro_id, renovacao_automatica, sla_id, sla, status, observacoes")
      .order("atualizado_em", { ascending: false }),
    supabase
      .from("parceiros")
      .select("id, razao_social, nome_fantasia, codigo_interno, ativo")
      .order("nome_fantasia"),
    supabase
      .from("slas")
      .select("id, nome, codigo, ativo")
      .eq("ativo", true)
      .order("nome"),
  ]);

  const parceirosBase = (parceirosResposta.data as ParceiroRow[] | null) ?? [];
  const parceirosPorId = new Map(
    parceirosBase.map((parceiro) => [
      parceiro.id,
      parceiro.nome_fantasia || parceiro.razao_social,
    ])
  );
  const parceiros: ContratoParceiroOpcao[] = parceirosBase.map((parceiro) => ({
    id: parceiro.id,
    nome: parceiro.nome_fantasia || parceiro.razao_social,
    codigo_interno: parceiro.codigo_interno,
    ativo: parceiro.ativo,
  }));
  const slas: ContratoSlaOpcao[] =
    ((slasResposta.data as SlaRow[] | null) ?? []).map((sla) => ({
      id: sla.id,
      nome: sla.nome,
      codigo: sla.codigo,
      ativo: sla.ativo,
    }));
  const slasPorId = new Map(slas.map((sla) => [sla.id, sla.nome]));
  const contratos: ContratoListItem[] =
    ((contratosResposta.data as ContratoRow[] | null) ?? []).map((contrato) => ({
      ...contrato,
      parceiro_nome: parceirosPorId.get(contrato.parceiro_id) ?? "Cliente não encontrado",
      cobranca_parceiro_nome: contrato.cobranca_parceiro_id
        ? parceirosPorId.get(contrato.cobranca_parceiro_id) ?? "Cliente de cobrança não encontrado"
        : null,
      sla_nome: contrato.sla_id ? slasPorId.get(contrato.sla_id) ?? null : null,
    }));
  const erro = await getSearchParam(searchParams, "erro");
  const salvo = await getSearchParam(searchParams, "salvo");
  const parceiroInicial = await getSearchParam(searchParams, "parceiro");

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <ContratosClient
        contratos={contratos}
        parceiros={parceiros}
        slas={slas}
        parceiroInicial={parceiroInicial}
        pageVersion={CONTRATOS_PAGE_VERSION}
        erro={erro}
        salvo={salvo}
      />
    </main>
  );
}
