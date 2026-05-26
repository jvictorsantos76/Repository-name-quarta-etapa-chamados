import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PARCEIROS_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { alterarStatusParceiro } from "../actions";
import { ParceiroForm } from "../ParceiroForm";
import type {
  ParceiroAnexo,
  ParceiroContato,
  ParceiroContrato,
  ParceiroDetalhe,
  ParceiroEndereco,
  ParceiroFilial,
  ParceiroFinanceiro,
  ParceiroHorarioAtendimento,
  ParceiroHistorico,
  ParceiroOperacional,
  OrganizacaoParceiroOpcao,
} from "../types";

type PageProps = {
  params: Promise<{ id: string }>;
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

export default async function EditarParceiroPage({
  params,
  searchParams,
}: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const { id } = await params;
  const supabase = createSupabaseAdminClient();
  const [
    parceiroResposta,
    enderecosResposta,
    contatosResposta,
    filiaisResposta,
    financeiroResposta,
    operacionalResposta,
    horariosAtendimentoResposta,
    contratosResposta,
    anexosResposta,
    historicoResposta,
    organizacoesResposta,
  ] = await Promise.all([
    supabase
      .from("parceiros")
      .select(
        "id, tipo_parceiro, razao_social, nome_fantasia, codigo_interno, cnpj_cpf, inscricao_estadual, inscricao_municipal, crt, situacao, cliente_desde, segmento, cnae, suframa, website, ativo, cliente_legado_id, organizacao_id, latitude, longitude, origem_geolocalizacao, link_maps, localizacao_referencia, observacoes_acesso, ponto_referencia, restricoes_entrada, estacionamento, estacionamento_privativo, estacionamento_terceiros, estacionamento_terceiros_nome, estacionamento_terceiros_endereco, estacionamento_terceiros_valores, portaria_recepcao, doca_carga_descarga, documento_necessario_entrada, responsavel_local, telefone_responsavel_local, responsavel_local_nome, responsavel_local_contato_id, responsavel_local_telefone, responsavel_local_whatsapp, necessita_autorizacao_previa, possui_portaria_recepcao, possui_doca_carga_descarga, identificacao_doca, documentos_entrada, horario_funcionamento, horario_atendimento_tecnico, horario_coleta_entrega, atendimento_sabado, atendimento_domingo, atendimento_feriado, necessita_agendamento, prazo_minimo_agendamento, observacoes_operacionais, criado_em, atualizado_em, criado_por, atualizado_por"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("parceiros_enderecos")
      .select("*")
      .eq("parceiro_id", id)
      .order("principal", { ascending: false })
      .order("atualizado_em", { ascending: false }),
    supabase
      .from("parceiros_contatos")
      .select("*")
      .eq("parceiro_id", id)
      .order("principal", { ascending: false })
      .order("nome"),
    supabase
      .from("parceiros_filiais")
      .select("*")
      .eq("parceiro_id", id)
      .order("nome_filial"),
    supabase
      .from("parceiros_financeiro")
      .select("*")
      .eq("parceiro_id", id)
      .maybeSingle(),
    supabase
      .from("parceiros_operacional")
      .select("*")
      .eq("parceiro_id", id)
      .maybeSingle(),
    supabase
      .from("parceiro_horarios_atendimento")
      .select("*")
      .eq("parceiro_id", id)
      .order("dia_semana")
      .order("ordem"),
    supabase
      .from("parceiros_contratos")
      .select("*")
      .eq("parceiro_id", id)
      .order("atualizado_em", { ascending: false }),
    supabase
      .from("parceiros_anexos")
      .select("*")
      .eq("parceiro_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("parceiros_historico")
      .select("*")
      .eq("parceiro_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("organizacoes")
      .select("id, nome, codigo_interno, ativo")
      .eq("ativo", true)
      .order("nome"),
  ]);

  if (parceiroResposta.error || !parceiroResposta.data) {
    notFound();
  }

  const parceiroBase = parceiroResposta.data as Omit<
    ParceiroDetalhe,
    | "endereco_principal"
    | "contato_principal"
    | "filiais"
    | "contatos"
    | "financeiro"
    | "operacional"
    | "horarios_atendimento"
    | "contratos"
    | "anexos"
    | "historico"
    | "cliente_legado_nome"
    | "organizacao_legada_nome"
    | "organizacao_nome"
    | "filiais_count"
  >;
  const lojaLegadoIds =
    (filiaisResposta.data as ParceiroFilial[] | null)
      ?.map((filial) => filial.loja_legado_id)
      .filter((lojaId): lojaId is string => Boolean(lojaId)) ?? [];
  const [clienteLegadoResposta, lojasLegadasResposta] = await Promise.all([
    parceiroBase.cliente_legado_id
      ? supabase
          .from("clientes")
          .select("nome_fantasia, organizacao:organizacoes!clientes_organizacao_id_fkey(nome)")
          .eq("id", parceiroBase.cliente_legado_id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    lojaLegadoIds.length > 0
      ? supabase
          .from("lojas")
          .select("id, nome_loja")
          .in("id", lojaLegadoIds)
      : Promise.resolve({ data: [], error: null }),
  ]);
  const enderecos = (enderecosResposta.data as ParceiroEndereco[] | null) ?? [];
  const contatos = (contatosResposta.data as ParceiroContato[] | null) ?? [];
  const organizacoes =
    (organizacoesResposta.data as OrganizacaoParceiroOpcao[] | null) ?? [];
  const organizacoesPorId = new Map(
    organizacoes.map((organizacao) => [organizacao.id, organizacao.nome])
  );
  const lojasLegadasPorId = new Map<string, string>();

  if (!lojasLegadasResposta.error) {
    for (const loja of
      (lojasLegadasResposta.data as { id: string; nome_loja: string }[] | null) ??
      []) {
      lojasLegadasPorId.set(loja.id, loja.nome_loja);
    }
  }

  const clienteLegado = clienteLegadoResposta.error
    ? null
    : (clienteLegadoResposta.data as
        | {
            nome_fantasia: string;
            organizacao: { nome: string } | null;
          }
        | null);
  const filiais = ((filiaisResposta.data as ParceiroFilial[] | null) ?? []).map(
    (filial) => ({
      ...filial,
      loja_legado_nome: filial.loja_legado_id
        ? lojasLegadasPorId.get(filial.loja_legado_id) ?? null
        : null,
    })
  );
  const parceiro = {
    ...parceiroBase,
    cliente_legado_nome: clienteLegado?.nome_fantasia ?? null,
    organizacao_legada_nome: clienteLegado?.organizacao?.nome ?? null,
    organizacao_nome: parceiroBase.organizacao_id
      ? organizacoesPorId.get(parceiroBase.organizacao_id) ??
        clienteLegado?.organizacao?.nome ??
        null
      : null,
    filiais_count: filiais.length,
    endereco_principal: enderecos[0] ?? null,
    contato_principal: contatos.find((contato) => contato.principal) ?? contatos[0] ?? null,
    filiais,
    contatos,
    financeiro: (financeiroResposta.data as ParceiroFinanceiro | null) ?? null,
    operacional: (operacionalResposta.data as ParceiroOperacional | null) ?? null,
    horarios_atendimento:
      (horariosAtendimentoResposta.data as ParceiroHorarioAtendimento[] | null) ?? [],
    contratos: (contratosResposta.data as ParceiroContrato[] | null) ?? [],
    anexos: (anexosResposta.data as ParceiroAnexo[] | null) ?? [],
    historico: (historicoResposta.data as ParceiroHistorico[] | null) ?? [],
  } satisfies ParceiroDetalhe;
  const erro = await getErro(searchParams);
  const salvo = await getSalvo(searchParams);
  const sucesso = salvo ? "As alterações foram gravadas e o cadastro já está atualizado." : null;

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
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
              <span className="text-gray-950">Editar</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold text-gray-950 sm:text-2xl">
                {parceiro.nome_fantasia}
              </h1>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {PARCEIROS_PAGE_VERSION}
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Cadastro mestre ERP operacional separado de organizações internas.
            </p>
          </div>
          <form action={alterarStatusParceiro.bind(null, parceiro.id, !parceiro.ativo)}>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              {parceiro.ativo ? "Inativar" : "Ativar"}
            </button>
          </form>
        </div>

        <ParceiroForm
          parceiro={parceiro}
          organizacoes={organizacoes}
          erro={erro}
          sucesso={sucesso}
        />
      </section>
    </main>
  );
}
