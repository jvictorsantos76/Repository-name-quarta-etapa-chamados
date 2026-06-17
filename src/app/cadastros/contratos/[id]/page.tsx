import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CONTRATOS_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  ContratoForm,
  type ContratoListItem,
  type ContratoParceiroOpcao,
  type ContratoSlaOpcao,
} from "../ContratosClient";
import type { StatusContrato } from "../../parceiros/types";

type PageProps = {
  params: Promise<{ id: string }>;
};

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

export default async function EditarContratoPage({ params }: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const [contratoResposta, parceirosResposta, slasResposta] = await Promise.all([
    supabase
      .from("parceiros_contratos")
      .select("id, parceiro_id, contrato, descricao_contrato, valor, vigencia_inicio, vigencia_fim, data_base, vencimento, dia_vencimento, periodicidade, valor_total_previsto, gerar_nota_fiscal, data_contrato, impressao_periodo_cobranca, cobrar_outro_contato, cobranca_parceiro_id, renovacao_automatica, sla_id, sla, status, observacoes")
      .eq("id", id)
      .maybeSingle(),
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

  if (contratoResposta.error || !contratoResposta.data) {
    notFound();
  }

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
  const contratoBase = contratoResposta.data as ContratoRow;
  const contrato: ContratoListItem = {
    ...contratoBase,
    parceiro_nome:
      parceirosPorId.get(contratoBase.parceiro_id) ?? "Cliente não encontrado",
    cobranca_parceiro_nome: contratoBase.cobranca_parceiro_id
      ? parceirosPorId.get(contratoBase.cobranca_parceiro_id) ??
        "Cliente de cobrança não encontrado"
      : null,
    sla_nome: contratoBase.sla_id ? slasPorId.get(contratoBase.sla_id) ?? null : null,
  };

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
        <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <nav
            aria-label="Navegação de cadastros"
            className="flex items-center gap-2 text-sm font-semibold text-gray-600"
          >
            <Link href="/cadastros/contratos" className="hover:text-gray-950">
              Gerência
            </Link>
            <span aria-hidden="true" className="text-gray-400">
              &gt;
            </span>
            <Link href="/cadastros/contratos" className="hover:text-gray-950">
              Contratos
            </Link>
            <span aria-hidden="true" className="text-gray-400">
              &gt;
            </span>
            <span className="text-gray-950">Editar</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
              Editar contrato
            </h1>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {CONTRATOS_PAGE_VERSION}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Atualize os dados comerciais e fiscais do contrato selecionado.
          </p>
        </div>

        <ContratoForm contrato={contrato} parceiros={parceiros} slas={slas} />
      </section>
    </main>
  );
}
