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
  ParceiroOrganizacaoResumo,
  ParceiroSlaOpcao,
  OrganizacaoParceiroOpcao,
  ParceiroCalendarioAtendimentoOpcao,
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

type ParceiroOrganizacaoRow = {
  id: string;
  tipo_parceiro: ParceiroOrganizacaoResumo["tipo_parceiro"];
  razao_social: string;
  nome_fantasia: string;
  codigo_interno: string | null;
  situacao: ParceiroOrganizacaoResumo["situacao"];
  ativo: boolean;
  observacoes_operacionais: string | null;
  organizacao_id: string | null;
};

type SlaRow = {
  id: string;
  nome: string;
  codigo: string;
  ativo: boolean;
};

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") ||
      message?.includes("Could not find the table") ||
      message?.includes("Could not find") ||
      message?.includes("column")
  );
}

function selecionarParceiroDetalhe(incluirCalendarioAtendimento = true) {
  return [
    "id",
    "tipo_parceiro",
    "razao_social",
    "nome_fantasia",
    "codigo_interno",
    "cnpj_cpf",
    "inscricao_estadual",
    "inscricao_municipal",
    "crt",
    "situacao",
    "cliente_desde",
    "segmento",
    "cnae",
    "suframa",
    "website",
    "ativo",
    "cliente_legado_id",
    "organizacao_id",
    "sla_padrao_id",
    incluirCalendarioAtendimento ? "calendario_atendimento_id" : null,
    "latitude",
    "longitude",
    "origem_geolocalizacao",
    "link_maps",
    "localizacao_referencia",
    "observacoes_acesso",
    "ponto_referencia",
    "restricoes_entrada",
    "estacionamento",
    "estacionamento_privativo",
    "estacionamento_terceiros",
    "estacionamento_terceiros_nome",
    "estacionamento_terceiros_endereco",
    "estacionamento_terceiros_valores",
    "portaria_recepcao",
    "doca_carga_descarga",
    "documento_necessario_entrada",
    "responsavel_local",
    "telefone_responsavel_local",
    "responsavel_local_nome",
    "responsavel_local_contato_id",
    "responsavel_local_telefone",
    "responsavel_local_whatsapp",
    "necessita_autorizacao_previa",
    "possui_portaria_recepcao",
    "possui_doca_carga_descarga",
    "identificacao_doca",
    "documentos_entrada",
    "horario_funcionamento",
    "horario_atendimento_tecnico",
    "horario_coleta_entrega",
    "atendimento_sabado",
    "atendimento_domingo",
    "atendimento_feriado",
    "necessita_agendamento",
    "prazo_minimo_agendamento",
    "observacoes_operacionais",
    "criado_em",
    "atualizado_em",
    "criado_por",
    "atualizado_por",
  ]
    .filter(Boolean)
    .join(", ");
}

function textoResumo(valor: string | null | undefined) {
  const texto = String(valor ?? "").trim().replace(/\s+/g, " ");
  return texto || null;
}

function montarEnderecoResumo(endereco: ParceiroEndereco | null) {
  if (!endereco) {
    return null;
  }

  const logradouro = [endereco.endereco, endereco.numero].filter(Boolean).join(", ");
  const localidade = [endereco.bairro, endereco.cidade, endereco.estado]
    .filter(Boolean)
    .join(" - ");
  const partes = [logradouro, localidade || endereco.pais].filter(Boolean);
  return textoResumo(partes.join(" | "));
}

function montarContatoResumo(contato: ParceiroContato | null) {
  if (!contato) {
    return null;
  }

  const telefone = contato.whatsapp ?? contato.celular ?? contato.telefone;
  const partes = [contato.nome, telefone, contato.email].filter(Boolean);
  return textoResumo(partes.join(" | "));
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
  let parceiroResposta = await supabase
    .from("parceiros")
    .select(selecionarParceiroDetalhe())
    .eq("id", id)
    .maybeSingle();

  if (parceiroResposta.error && isSchemaCacheError(parceiroResposta.error.message)) {
    parceiroResposta = await supabase
      .from("parceiros")
      .select(selecionarParceiroDetalhe(false))
      .eq("id", id)
      .maybeSingle();
  }

  const [
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
    slasResposta,
    calendariosAtendimentoResposta,
    calendariosAtendimentoHorariosResposta,
  ] = await Promise.all([
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
    supabase
      .from("slas")
      .select("id, nome, codigo, ativo")
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

  if (parceiroResposta.error || !parceiroResposta.data) {
    notFound();
  }

  const parceiroBase = parceiroResposta.data as unknown as Omit<
    ParceiroDetalhe,
    | "endereco_principal"
    | "contato_principal"
    | "filiais"
    | "contatos"
    | "financeiro"
    | "operacional"
    | "calendario_atendimento"
    | "horarios_atendimento"
    | "contratos"
    | "anexos"
    | "historico"
    | "cliente_legado_nome"
    | "organizacao_legada_nome"
    | "organizacao_nome"
    | "filiais_count"
    | "unidades_organizacao"
  >;
  const enderecos = (enderecosResposta.data as ParceiroEndereco[] | null) ?? [];
  const contatos = (contatosResposta.data as ParceiroContato[] | null) ?? [];
  let parceirosOrganizacao: ParceiroOrganizacaoRow[] = [];

  if (parceiroBase.organizacao_id) {
    const parceirosOrganizacaoResposta = await supabase
      .from("parceiros")
      .select(
        "id, tipo_parceiro, razao_social, nome_fantasia, codigo_interno, situacao, ativo, observacoes_operacionais, organizacao_id"
      )
      .eq("organizacao_id", parceiroBase.organizacao_id);

    parceirosOrganizacao = parceirosOrganizacaoResposta.error
      ? [
          {
            id: parceiroBase.id,
            tipo_parceiro: parceiroBase.tipo_parceiro,
            razao_social: parceiroBase.razao_social,
            nome_fantasia: parceiroBase.nome_fantasia,
            codigo_interno: parceiroBase.codigo_interno,
            situacao: parceiroBase.situacao,
            ativo: parceiroBase.ativo,
            observacoes_operacionais: parceiroBase.observacoes_operacionais ?? null,
            organizacao_id: parceiroBase.organizacao_id,
          },
        ]
      : ((parceirosOrganizacaoResposta.data as ParceiroOrganizacaoRow[] | null) ?? []);
  }

  parceirosOrganizacao.sort((a, b) => {
    if (a.id === id && b.id !== id) {
      return -1;
    }

    if (b.id === id && a.id !== id) {
      return 1;
    }

    if (a.ativo !== b.ativo) {
      return a.ativo ? -1 : 1;
    }

    const nomeA = a.nome_fantasia || a.razao_social;
    const nomeB = b.nome_fantasia || b.razao_social;
    return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base" });
  });

  const unidadesOrganizacaoIds = parceirosOrganizacao.map((parceiro) => parceiro.id);
  const [enderecosUnidadesResposta, contatosUnidadesResposta] = await Promise.all([
    unidadesOrganizacaoIds.length > 0
      ? supabase
          .from("parceiros_enderecos")
          .select("*")
          .in("parceiro_id", unidadesOrganizacaoIds)
          .order("principal", { ascending: false })
          .order("atualizado_em", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    unidadesOrganizacaoIds.length > 0
      ? supabase
          .from("parceiros_contatos")
          .select("*")
          .in("parceiro_id", unidadesOrganizacaoIds)
          .order("principal", { ascending: false })
          .order("nome")
      : Promise.resolve({ data: [], error: null }),
  ]);

  const enderecoPorParceiroId = new Map<string, ParceiroEndereco>();
  if (!enderecosUnidadesResposta.error) {
    for (const endereco of
      (enderecosUnidadesResposta.data as ParceiroEndereco[] | null) ?? []) {
      if (!enderecoPorParceiroId.has(endereco.parceiro_id)) {
        enderecoPorParceiroId.set(endereco.parceiro_id, endereco);
      }
    }
  }

  const contatoPorParceiroId = new Map<string, ParceiroContato>();
  if (!contatosUnidadesResposta.error) {
    for (const contato of
      (contatosUnidadesResposta.data as ParceiroContato[] | null) ?? []) {
      if (!contatoPorParceiroId.has(contato.parceiro_id)) {
        contatoPorParceiroId.set(contato.parceiro_id, contato);
      }
    }
  }

  const unidadesOrganizacao: ParceiroOrganizacaoResumo[] = parceirosOrganizacao.map(
    (unidade) => ({
      id: unidade.id,
      nome_exibicao: unidade.nome_fantasia || unidade.razao_social,
      codigo_interno: unidade.codigo_interno,
      tipo_parceiro: unidade.tipo_parceiro,
      situacao: unidade.situacao,
      ativo: unidade.ativo,
      endereco_resumido: montarEnderecoResumo(
        enderecoPorParceiroId.get(unidade.id) ?? null
      ),
      contato_resumido: montarContatoResumo(contatoPorParceiroId.get(unidade.id) ?? null),
      observacoes_resumidas: textoResumo(unidade.observacoes_operacionais),
      is_atual: unidade.id === id,
    })
  );

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
  const organizacoes =
    (organizacoesResposta.data as OrganizacaoParceiroOpcao[] | null) ?? [];
  const slas: ParceiroSlaOpcao[] =
    ((slasResposta.data as SlaRow[] | null) ?? []).map((sla) => ({
      id: sla.id,
      nome: sla.nome,
      codigo: sla.codigo,
      ativo: sla.ativo,
    }));
  const horariosPorCalendario = new Map<
    string,
    ParceiroCalendarioAtendimentoOpcao["horarios"]
  >();

  if (
    !calendariosAtendimentoHorariosResposta.error ||
    isSchemaCacheError(calendariosAtendimentoHorariosResposta.error?.message)
  ) {
    for (const horario of
      (calendariosAtendimentoHorariosResposta.data as
        | (ParceiroCalendarioAtendimentoOpcao["horarios"][number] & {
            calendario_atendimento_id: string;
          })[]
        | null) ??
      []) {
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
  }

  const calendariosAtendimento: ParceiroCalendarioAtendimentoOpcao[] =
    calendariosAtendimentoResposta.error &&
    !isSchemaCacheError(calendariosAtendimentoResposta.error.message)
      ? []
      : ((calendariosAtendimentoResposta.data as
          | Omit<ParceiroCalendarioAtendimentoOpcao, "horarios">[]
          | null) ?? []).map((calendario) => ({
          ...calendario,
          horarios: horariosPorCalendario.get(calendario.id) ?? [],
        }));
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
  const filialIds = filiais.map((filial) => filial.id);
  const [chamadosDiretosResposta, chamadosFiliaisResposta] = await Promise.all([
    supabase
      .from("chamados")
      .select("id", { count: "exact", head: true })
      .eq("parceiro_id", id),
    filialIds.length > 0
      ? supabase
          .from("chamados")
          .select("id", { count: "exact", head: true })
          .in("parceiro_filial_id", filialIds)
      : Promise.resolve({ count: 0, error: null }),
  ]);
  const chamadosRelacionadosCount =
    (chamadosDiretosResposta.error ? 0 : chamadosDiretosResposta.count ?? 0) +
    (chamadosFiliaisResposta.error ? 0 : chamadosFiliaisResposta.count ?? 0);
  const calendarioAtendimentoSelecionado =
    calendariosAtendimento.find(
      (calendario) => calendario.id === parceiroBase.calendario_atendimento_id
    ) ??
    calendariosAtendimento.find((calendario) => calendario.padrao_global) ??
    null;
  const parceiro = {
    ...parceiroBase,
    calendario_atendimento_id:
      parceiroBase.calendario_atendimento_id ??
      calendarioAtendimentoSelecionado?.id ??
      null,
    calendario_atendimento_nome: calendarioAtendimentoSelecionado?.nome ?? null,
    calendario_atendimento_codigo: calendarioAtendimentoSelecionado?.codigo ?? null,
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
    unidades_organizacao: unidadesOrganizacao,
    contatos,
    financeiro: (financeiroResposta.data as ParceiroFinanceiro | null) ?? null,
    operacional: (operacionalResposta.data as ParceiroOperacional | null) ?? null,
    calendario_atendimento: calendarioAtendimentoSelecionado,
    horarios_atendimento:
      (horariosAtendimentoResposta.data as ParceiroHorarioAtendimento[] | null) ?? [],
    contratos: (contratosResposta.data as ParceiroContrato[] | null) ?? [],
    anexos: (anexosResposta.data as ParceiroAnexo[] | null) ?? [],
    historico: (historicoResposta.data as ParceiroHistorico[] | null) ?? [],
  } satisfies ParceiroDetalhe;
  const erro = await getErro(searchParams);
  const salvo = await getSalvo(searchParams);
  const sucesso = salvo ? "As alterações foram gravadas e o cadastro já está atualizado." : null;
  const inativacaoBloqueada = parceiro.ativo && chamadosRelacionadosCount > 0;

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
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              form="parceiro-geral-form"
              name="acao_pos_salvar"
              value="novo_cliente"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Novo cliente
            </button>
            <form action={alterarStatusParceiro.bind(null, parceiro.id, !parceiro.ativo)}>
              <button
                type="submit"
                disabled={inativacaoBloqueada}
                title={
                  inativacaoBloqueada
                    ? "Cliente com chamados vinculados não pode ser inativado nesta etapa."
                    : undefined
                }
                className="inline-flex min-h-10 w-full items-center justify-center rounded-md border border-gray-400 bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-950 transition hover:bg-gray-300 disabled:cursor-not-allowed disabled:border-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
              >
                {parceiro.ativo ? "Inativar" : "Ativar"}
              </button>
            </form>
          </div>
        </div>

        {!parceiro.ativo ? (
          <div
            role="status"
            className="mb-4 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800"
          >
            Este cliente está inativo. Ele permanece visível para histórico e consulta,
            mas não deve ser usado para novas operações.
          </div>
        ) : null}

        {inativacaoBloqueada ? (
          <div
            role="status"
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900"
          >
            Inativação desabilitada: este cliente possui chamados vinculados. Essa
            regra poderá mudar em uma feature futura.
          </div>
        ) : null}

        <ParceiroForm
          parceiro={parceiro}
          organizacoes={organizacoes}
          slas={slas}
          calendariosAtendimento={calendariosAtendimento}
          erro={erro}
          sucesso={sucesso}
        />
      </section>
    </main>
  );
}
