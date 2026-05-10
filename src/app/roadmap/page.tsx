import { AppHeader } from "@/components/AppHeader";
import { ROADMAP_MONTHS } from "@/config/navigation";
import { requirePerfilAutenticado } from "@/lib/supabase/server";

export default async function RoadmapPage() {
  const perfilAtual = await requirePerfilAutenticado();

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-4 md:px-8 md:pt-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Roadmap Quarta Etapa
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-950">
            Recurso em breve.
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Esta visão organiza a evolução prevista do sistema em ciclos mensais,
            mantendo a navegação visível sem direcionar o usuário para páginas
            inexistentes.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {ROADMAP_MONTHS.map((descricao, index) => (
            <article
              key={descricao}
              className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-blue-600">
                Mês {index + 1}
              </p>
              <h2 className="mt-2 text-base font-bold text-gray-950">
                {descricao}
              </h2>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
