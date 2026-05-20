import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { ORGANIZACOES_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import { requirePerfilAutenticado } from "@/lib/supabase/server";
import { OrganizacaoForm } from "../OrganizacaoForm";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function getErro(searchParams: PageProps["searchParams"]) {
  const params = searchParams ? await searchParams : {};
  const value = params.erro;

  return Array.isArray(value) ? value[0] : value;
}

export default async function NovaOrganizacaoPage({ searchParams }: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const erro = await getErro(searchParams);

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
        <div className="mb-4 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
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
            <span className="text-gray-950">Nova</span>
          </nav>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
              Nova organização
            </h1>
            <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              {ORGANIZACOES_PAGE_VERSION}
            </span>
          </div>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Cadastre o agrupador administrativo; o vínculo com clientes fica disponível após salvar.
          </p>
        </div>

        <OrganizacaoForm erro={erro} />
      </section>
    </main>
  );
}
