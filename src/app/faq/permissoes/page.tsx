import Link from "next/link";

const permissoes = [
  {
    papel: "Super-Admin",
    descricao:
      "Tem acesso administrativo máximo e deve ser reservado para manutenção da plataforma e gestão de usuários.",
  },
  {
    papel: "Admin",
    descricao:
      "Administra usuários, aprova solicitações, mantém catálogos de chamados e acompanha a operação interna.",
  },
  {
    papel: "Comercial",
    descricao:
      "Pode abrir e preencher chamados, sem acesso aos catálogos administrativos ou à Base de Conhecimento nesta fase.",
  },
  {
    papel: "Analista",
    descricao:
      "Pode abrir chamado, assumir responsabilidade, atribuir técnico, manter catálogos e administrar artigos da Base de Conhecimento.",
  },
  {
    papel: "Técnico-Quarta",
    descricao:
      "Pode abrir e preencher chamados, consultar artigos ativos e relacionar artigos ao atendimento.",
  },
  {
    papel: "Técnico-Terceirizado",
    descricao:
      "Pode abrir e preencher chamados, consultar artigos ativos e relacionar artigos ao atendimento, sem administrar catálogos.",
  },
  {
    papel: "Cliente",
    descricao:
      "Abre e acompanha chamados somente da loja vinculada ao próprio perfil, sem acesso administrativo.",
  },
  {
    papel: "Parceiro",
    descricao:
      "Abre e acompanha chamados somente da loja vinculada ao próprio perfil, sem acesso à Base de Conhecimento interna nesta fase.",
  },
];

export default function PermissoesFaqPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <section className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Link href="/chamados/novo" className="text-sm font-semibold text-blue-600">
            Voltar para novo chamado
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            FAQ
          </p>
          <h1 className="mt-2 text-2xl font-bold">Permissões de usuários</h1>
          <p className="mt-3 text-sm text-gray-600">
            As permissões são aplicadas com base no papel cadastrado em
            public.perfis para o usuário autenticado no Supabase Auth.
          </p>

          <div className="mt-6 space-y-4">
            {permissoes.map((item) => (
              <article key={item.papel} className="rounded-lg border p-4">
                <h2 className="font-bold">{item.papel}</h2>
                <p className="mt-2 text-sm text-gray-600">{item.descricao}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
