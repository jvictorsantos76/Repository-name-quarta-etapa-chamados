import Link from "next/link";
import { APP_UPDATED_AT, APP_VERSION } from "@/config/version";

const versoes = [
  {
    versao: APP_VERSION,
    data: "27/04/2026",
    alteracoes: [
      "Inclusão do papel analista no fluxo de perfis e permissões.",
      "Migrations para atualizar o ENUM papel_usuario e semear Jardel/Fabiana.",
      "Permissões de chamados alinhadas para admin, gestor, analista, técnico e operador.",
      "Formulário de chamados passa a usar perfis cadastrados no Supabase como fonte de usuários.",
    ],
    correcoes: [
      "Remoção da equivalência indevida entre admin e analista no formulário.",
    ],
  },
  {
    versao: "v0.2.0",
    data: "27/04/2026",
    alteracoes: [
      "Abertura de chamados com campos ITIL enxutos.",
      "Prioridade calculada automaticamente por impacto e urgência.",
      "Simulação inicial de papéis: cliente, analista e técnico.",
      "Upload múltiplo de evidências com remoção individual e drag and drop.",
      "Cores operacionais para status e prioridade.",
      "Botão mobile fixo para abrir novo chamado.",
      "Versionamento visível em todas as telas.",
    ],
    correcoes: [
      "Correção da ausência do botão Novo chamado no mobile.",
      "Organização das evidências por chamado no Storage.",
    ],
  },
  {
    versao: "v0.1.0",
    data: "25/04/2026",
    alteracoes: [
      "Listagem inicial de chamados integrada ao Supabase.",
      "Página de detalhe do chamado.",
      "Primeiro formulário de abertura de chamados.",
    ],
    correcoes: [],
  },
];

export default function ChangelogPage() {
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
            Atualizações
          </p>
          <h1 className="mt-2 text-2xl font-bold">Changelog</h1>
          <p className="mt-2 text-sm text-gray-600">
            Versão atual: {APP_VERSION} publicada em {APP_UPDATED_AT}.
          </p>

          <div className="mt-6 space-y-6">
            {versoes.map((item) => (
              <article key={item.versao} className="rounded-lg border p-5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-bold">{item.versao}</h2>
                  <p className="text-sm text-gray-500">{item.data}</p>
                </div>

                <h3 className="mt-4 text-sm font-semibold">Alterações</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                  {item.alteracoes.map((alteracao) => (
                    <li key={alteracao}>{alteracao}</li>
                  ))}
                </ul>

                {item.correcoes.length > 0 && (
                  <>
                    <h3 className="mt-4 text-sm font-semibold">Correções</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                      {item.correcoes.map((correcao) => (
                        <li key={correcao}>{correcao}</li>
                      ))}
                    </ul>
                  </>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
