import Link from "next/link";
import { NovoChamadoForm } from "./NovoChamadoForm";

export default function NovoChamado() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <section className="mx-auto max-w-4xl">
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

          <NovoChamadoForm />
        </div>
      </section>
    </main>
  );
}
