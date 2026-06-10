import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ORGANIZACOES_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { alterarStatusOrganizacao } from "../actions";
import { OrganizacaoFiliaisSection } from "../OrganizacaoFiliaisSection";
import { OrganizacaoForm } from "../OrganizacaoForm";
import type {
  ParceiroContato,
  ParceiroEndereco,
  SituacaoParceiro,
  TipoParceiro,
} from "../../parceiros/types";
import type { ClienteOrganizacao, Organizacao, UnidadeOrganizacao } from "../types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function getErro(searchParams: PageProps["searchParams"]) {
  const params = searchParams ? await searchParams : {};
  const value = params.erro;

  return Array.isArray(value) ? value[0] : value;
}

type UnidadeOrganizacaoRow = {
  id: string;
  tipo_parceiro: TipoParceiro;
  razao_social: string;
  nome_fantasia: string;
  codigo_interno: string | null;
  situacao: SituacaoParceiro;
  ativo: boolean;
  observacoes_operacionais: string | null;
};

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

export default async function EditarOrganizacaoPage({
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
    { data, error },
    clientesResposta,
    parceirosResposta,
    lojasResposta,
    unidadesResposta,
  ] = await Promise.all([
    supabase
      .from("organizacoes")
      .select(
        "id, nome, codigo_interno, tipo_organizacao, possui_filiais, ativo, observacoes, logo_url, cor_identificacao, sistema_externo_padrao, id_externo, criado_em, atualizado_em, criado_por, atualizado_por"
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("clientes")
      .select("id, nome_fantasia, razao_social, ativo, organizacao_id")
      .order("nome_fantasia"),
    supabase
      .from("parceiros")
      .select("nome_fantasia, cliente_legado_id"),
    supabase
      .from("lojas")
      .select("id, cliente_id"),
    supabase
      .from("parceiros")
      .select(
        "id, tipo_parceiro, razao_social, nome_fantasia, codigo_interno, situacao, ativo, observacoes_operacionais"
      )
      .eq("organizacao_id", id),
  ]);

  if (error || !data) {
    notFound();
  }

  const organizacao = data as Organizacao;
  const parceirosPorCliente = new Map<string, string>();
  const lojasPorCliente = new Map<string, number>();

  if (!parceirosResposta.error) {
    for (const parceiro of
      (parceirosResposta.data as
        | { nome_fantasia: string; cliente_legado_id: string | null }[]
        | null) ?? []) {
      if (parceiro.cliente_legado_id) {
        parceirosPorCliente.set(
          parceiro.cliente_legado_id,
          parceiro.nome_fantasia
        );
      }
    }
  }

  if (!lojasResposta.error) {
    for (const loja of
      (lojasResposta.data as { id: string; cliente_id: string | null }[] | null) ??
      []) {
      if (loja.cliente_id) {
        lojasPorCliente.set(
          loja.cliente_id,
          (lojasPorCliente.get(loja.cliente_id) ?? 0) + 1
        );
      }
    }
  }

  const clientes = clientesResposta.error
    ? []
    : ((clientesResposta.data as ClienteOrganizacao[] | null) ?? []).map(
        (cliente) => ({
          ...cliente,
          lojas_count: lojasPorCliente.get(cliente.id) ?? 0,
          parceiro_mestre_nome: parceirosPorCliente.get(cliente.id) ?? null,
        })
      );
  const unidadesBase = unidadesResposta.error
    ? []
    : ((unidadesResposta.data as UnidadeOrganizacaoRow[] | null) ?? []).sort((a, b) => {
        if (a.ativo !== b.ativo) {
          return a.ativo ? -1 : 1;
        }

        const nomeA = a.nome_fantasia || a.razao_social;
        const nomeB = b.nome_fantasia || b.razao_social;
        return nomeA.localeCompare(nomeB, "pt-BR", { sensitivity: "base" });
      });
  const unidadeIds = unidadesBase.map((unidade) => unidade.id);
  const [enderecosUnidadesResposta, contatosUnidadesResposta] = await Promise.all([
    unidadeIds.length > 0
      ? supabase
          .from("parceiros_enderecos")
          .select("*")
          .in("parceiro_id", unidadeIds)
          .order("principal", { ascending: false })
          .order("atualizado_em", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    unidadeIds.length > 0
      ? supabase
          .from("parceiros_contatos")
          .select("*")
          .in("parceiro_id", unidadeIds)
          .order("principal", { ascending: false })
          .order("nome")
      : Promise.resolve({ data: [], error: null }),
  ]);
  const enderecoPorUnidadeId = new Map<string, ParceiroEndereco>();

  if (!enderecosUnidadesResposta.error) {
    for (const endereco of
      (enderecosUnidadesResposta.data as ParceiroEndereco[] | null) ?? []) {
      if (!enderecoPorUnidadeId.has(endereco.parceiro_id)) {
        enderecoPorUnidadeId.set(endereco.parceiro_id, endereco);
      }
    }
  }

  const contatoPorUnidadeId = new Map<string, ParceiroContato>();

  if (!contatosUnidadesResposta.error) {
    for (const contato of
      (contatosUnidadesResposta.data as ParceiroContato[] | null) ?? []) {
      if (!contatoPorUnidadeId.has(contato.parceiro_id)) {
        contatoPorUnidadeId.set(contato.parceiro_id, contato);
      }
    }
  }

  const unidades: UnidadeOrganizacao[] = unidadesBase.map((unidade) => ({
    id: unidade.id,
    nome_exibicao: unidade.nome_fantasia || unidade.razao_social,
    codigo_interno: unidade.codigo_interno,
    tipo: unidade.tipo_parceiro,
    situacao: unidade.situacao,
    ativo: unidade.ativo,
    endereco_resumido: montarEnderecoResumo(
      enderecoPorUnidadeId.get(unidade.id) ?? null
    ),
    contato_resumido: montarContatoResumo(contatoPorUnidadeId.get(unidade.id) ?? null),
    observacoes_resumidas: textoResumo(unidade.observacoes_operacionais),
  }));
  const erro = await getErro(searchParams);

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav
              aria-label="Navegação de cadastros"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600"
            >
              <Link href="/cadastros/organizacoes" className="hover:text-gray-950">
                Cadastros
              </Link>
              <span aria-hidden="true" className="text-gray-400">
                &gt;
              </span>
              <Link href="/cadastros/organizacoes" className="hover:text-gray-950">
                Organizações
              </Link>
              <span aria-hidden="true" className="text-gray-400">
                &gt;
              </span>
              <span className="text-gray-950">Editar</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="break-words text-xl font-bold text-gray-950 sm:text-2xl">
                {organizacao.nome}
              </h1>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {ORGANIZACOES_PAGE_VERSION}
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Visualize, edite, ative ou inative o cadastro agregador.
            </p>
          </div>
          <form action={alterarStatusOrganizacao.bind(null, organizacao.id, !organizacao.ativo)}>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              {organizacao.ativo ? "Inativar" : "Ativar"}
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <OrganizacaoForm organizacao={organizacao} clientes={clientes} erro={erro} />
          <OrganizacaoFiliaisSection unidades={unidades} />
        </div>
      </section>
    </main>
  );
}
