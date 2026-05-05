import Link from "next/link";
import { requirePerfilAutenticado } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { NovoChamadoForm } from "./NovoChamadoForm";

export default async function NovoChamado() {
  const perfilAtual = await requirePerfilAutenticado();

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-4xl px-6 pb-8 md:px-8">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            Voltar para chamados
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Novo chamado
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Abrir novo chamado técnico
          </h1>

          <p className="mt-3 text-gray-600">
            Registre os dados iniciais para triagem e acompanhamento do
            atendimento.
          </p>

          <NovoChamadoForm perfilAtual={perfilAtual} />
        </div>
      </section>
    </main>
  );
}
