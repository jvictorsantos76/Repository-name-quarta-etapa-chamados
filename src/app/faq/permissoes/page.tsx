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
      "Administra usuários, aprova solicitações e acompanha a operação interna.",
  },
  {
    papel: "Gestor",
    descricao:
      "Faz gestão geral, acompanha chamados, clientes, lojas, usuários e relatórios, sem ser tratado como analista responsável por padrão.",
  },
  {
    papel: "Analista",
    descricao:
      "Pode abrir chamado, assumir responsabilidade e atribuir técnico enquanto o chamado não estiver finalizado.",
  },
  {
    papel: "Técnico",
    descricao:
      "Abre chamado para si mesmo, não atribui outro técnico e não exclui chamados.",
  },
  {
    papel: "Operador",
    descricao:
      "Papel legado mantido para compatibilidade; não deve ser usado em novos provisionamentos.",
  },
  {
    papel: "Cliente",
    descricao:
      "Abre e acompanha chamados próprios, sem acesso administrativo ou visão operacional ampla.",
  },
  {
    papel: "Solicitante",
    descricao:
      "Abre e acompanha chamados próprios, com acesso restrito ao seu atendimento.",
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
