import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { ORGANIZACOES_PAGE_VERSION } from "@/config/version";
import { OrganizacoesTable } from "./OrganizacoesTable";
import type { Organizacao } from "./types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

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

export default async function OrganizacoesPage({ searchParams }: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("organizacoes")
    .select(
      "id, nome, codigo_interno, tipo_organizacao, possui_filiais, ativo, observacoes, logo_url, cor_identificacao, sistema_externo_padrao, id_externo, criado_em, atualizado_em, criado_por, atualizado_por"
    )
    .order("nome");
  const organizacoes =
    error && isSchemaCacheError(error.message)
      ? []
      : ((data as Organizacao[] | null) ?? []);
  const erro = await getSearchParam(searchParams, "erro");
  const salvo = await getSearchParam(searchParams, "salvo");

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
              <span>Cadastros</span>
              <span aria-hidden="true" className="text-gray-400">
                &gt;
              </span>
              <span className="text-gray-950">Organizações</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Organizações
              </h1>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {ORGANIZACOES_PAGE_VERSION}
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Cadastre agrupadores operacionais para clientes, redes, parceiros e estruturas internas.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-fit rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
              Total: {organizacoes.length}
            </span>
            <Link
              href="/cadastros/organizacoes/nova"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Nova organização
            </Link>
          </div>
        </div>

        {error && !isSchemaCacheError(error.message) ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            Não foi possível carregar as organizações.
          </div>
        ) : null}

        {erro ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {erro}
          </div>
        ) : null}

        {salvo ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            Organização salva com sucesso.
          </div>
        ) : null}

        <OrganizacoesTable organizacoes={organizacoes} />
      </section>
    </main>
  );
}
