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
import { OrganizacaoForm } from "../OrganizacaoForm";
import type { ClienteOrganizacao, Organizacao } from "../types";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function getErro(searchParams: PageProps["searchParams"]) {
  const params = searchParams ? await searchParams : {};
  const value = params.erro;

  return Array.isArray(value) ? value[0] : value;
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

        <OrganizacaoForm organizacao={organizacao} clientes={clientes} erro={erro} />
      </section>
    </main>
  );
}
