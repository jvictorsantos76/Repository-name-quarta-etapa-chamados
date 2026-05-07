import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ContaAcoesRapidas } from "@/components/ContaAcoesRapidas";
import { CONTA_PERMISSOES_PAGE_VERSION } from "@/config/version";
import {
  getPermissoesPorPapel,
  LABEL_PAPEL_USUARIO,
} from "@/lib/auth/permissions";
import { requirePerfilAutenticado } from "@/lib/supabase/server";

export default async function ContaPermissoesPage() {
  const perfilAtual = await requirePerfilAutenticado();
  const permissoes = getPermissoesPorPapel(perfilAtual.papel);

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-4 md:px-8 md:pt-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <nav
              aria-label="Navegação da conta"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600"
            >
              <Link href="/conta" className="hover:text-gray-950">
                Conta
              </Link>
              <span aria-hidden="true" className="text-gray-400">
                &gt;
              </span>
              <span className="text-gray-950">Permissões</span>
            </nav>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Permissões
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Consulta informativa das ações disponíveis para o seu nível
              operacional. Alterações de acesso continuam restritas à
              administração.
            </p>
          </div>
          <span className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
            Tela v{CONTA_PERMISSOES_PAGE_VERSION.replace(/^v/, "")}
          </span>
        </div>

        <section className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
            Nível operacional atual
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-950">
            {LABEL_PAPEL_USUARIO[perfilAtual.papel]}
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">
            Este nível vem de public.perfis e é validado pelas regras de negócio
            e pelas políticas RLS do Supabase.
          </p>
        </section>

        <div className="grid gap-4">
          {permissoes.map((grupo) => (
            <section
              key={grupo.id}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-950">
                    {grupo.tela}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-gray-600">
                    {grupo.descricao}
                  </p>
                </div>
                <span className="w-fit rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Permitido
                </span>
              </div>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {grupo.acoes.map((acao) => (
                  <li
                    key={acao.id}
                    className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800"
                  >
                    {acao.label}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <ContaAcoesRapidas variant="footer" />
      </section>
    </main>
  );
}
