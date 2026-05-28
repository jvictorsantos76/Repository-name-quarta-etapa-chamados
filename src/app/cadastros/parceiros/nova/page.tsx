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
import type { OrganizacaoParceiroOpcao } from "../types";

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
  const { data: organizacoesData } = await supabase
    .from("organizacoes")
    .select("id, nome, codigo_interno, ativo")
    .eq("ativo", true)
    .order("nome");
  const organizacoes =
    (organizacoesData as OrganizacaoParceiroOpcao[] | null) ?? [];

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

        <ParceiroForm organizacoes={organizacoes} erro={erro} sucesso={sucesso} />
      </section>
    </main>
  );
}
