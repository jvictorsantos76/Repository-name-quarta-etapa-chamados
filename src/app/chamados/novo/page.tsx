import Link from "next/link";
import { requirePerfilAutenticado } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { NovoChamadoForm } from "./NovoChamadoForm";

export default async function NovoChamado() {
  const perfilAtual = await requirePerfilAutenticado();

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-4 md:px-8 md:pt-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <nav
              aria-label="Navegação de chamados"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600"
            >
              <Link href="/" className="hover:text-gray-950">
                Chamados
              </Link>
              <span aria-hidden="true" className="text-gray-400">
                &gt;
              </span>
              <span className="text-gray-950">Novo chamado</span>
            </nav>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Abrir novo chamado técnico
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Registre os dados iniciais para triagem e acompanhamento do
              atendimento.
            </p>
          </div>
        </div>

        <NovoChamadoForm perfilAtual={perfilAtual} />
      </section>
    </main>
  );
}
