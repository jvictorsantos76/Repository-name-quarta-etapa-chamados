import Link from "next/link";
import { APP_UPDATED_AT, APP_VERSION } from "@/config/version";

const versoes = [
  {
    versao: APP_VERSION,
    data: "04/05/2026",
    alteracoes: [
      "Administração de usuários passa a gerar link manual de acesso quando o envio automático de convite pelo Supabase falhar por limite ou configuração de e-mail.",
      "Solicitações aprovadas registram o link manual de acesso apenas para admin/gestor, mantendo o vínculo com Auth, public.perfis e data de provisionamento.",
    ],
    correcoes: [
      "Aprovação de novos usuários deixa de ficar bloqueada quando o provedor de e-mail padrão do Supabase retorna email rate limit exceeded ou Error sending invite email.",
      "Provisionamento administrativo passa a ter permissão service_role para criar public.perfis e vincular aceites legais, além de registrar link manual mesmo quando o envio automático informa sucesso.",
    ],
  },
  {
    versao: "v0.7.1",
    data: "03/05/2026",
    alteracoes: [
      "Revisão do fluxo Supabase Auth separando solicitação pública, aprovação administrativa, convite por e-mail, callback de sessão e autorização por public.perfis.",
      "Tela de Login v0.2.0 passa a oferecer Magic Link/OTP para e-mails já autorizados, sem auto-criação de usuário.",
      "Callback /auth/confirm passa a validar token_hash, code, tipo de OTP, sessão e perfil ativo antes de liberar acesso.",
      "Recuperação de senha passa a direcionar para alteração autenticada em /auth/alterar-senha.",
      "Administração de usuários passa a permitir reprovisionar solicitações aprovadas sem auth_user_id, perfil_id ou provisionado_em.",
      "Changelog registra a necessidade operacional de configurar SMTP próprio, Redirect URLs e templates Supabase Auth fora do repositório.",
    ],
    correcoes: [
      "Solicitação aprovada sem provisionamento volta a ter ação de retry em vez de ficar bloqueada na interface administrativa.",
    ],
  },
  {
    versao: "v0.7.0",
    data: "01/05/2026",
    alteracoes: [
      "Aprovação de solicitações passa a enviar convite Supabase Auth e criar perfil operacional ativo com papel operador.",
      "Solicitações de acesso passam a registrar vínculo com usuário Auth, perfil, data de provisionamento e erro de provisionamento quando ocorrer.",
      "Cadastro passa a informar que usuários aprovados recebem convite por e-mail para definir acesso.",
      "Termos de Uso e Política de Privacidade foram ampliados com referências objetivas a LGPD/GDPR, direitos dos titulares, bases legais e contato.",
    ],
    correcoes: [],
  },
  {
    versao: "v0.6.1",
    data: "28/04/2026",
    alteracoes: [
      "Tela de Login v0.1.0 com logo ampliado, caminhos separados para usuários cadastrados e novos usuários.",
      "Inclusão de contatos de desenvolvimento/suporte técnico e administrativo no painel institucional do login.",
      "Referência curta a LGPD/GDPR na autenticação, com manutenção dos links para Política de Privacidade e Termos de Uso.",
      "Badge global passa a exibir a versão específica da tela de login no mesmo local do versionamento geral, sem sobrepor o conteúdo no mobile.",
    ],
    correcoes: [],
  },
  {
    versao: "v0.6.0",
    data: "27/04/2026",
    alteracoes: [
      "Tela de login redesenhada para o Portal de Atendimento Quarta Etapa.",
      "Preparação para login com Google via Supabase OAuth.",
      "Cadastro público controlado com solicitação pendente de aprovação.",
      "Páginas iniciais de Política de Privacidade, Termos de Uso e aguardando aprovação.",
      "Área administrativa inicial para listar e atualizar solicitações de acesso.",
    ],
    correcoes: [
      "Usuário autenticado sem perfil operacional ativo passa a ser direcionado para aguardando aprovação.",
    ],
  },
  {
    versao: "v0.5.0",
    data: "27/04/2026",
    alteracoes: [
      "Login com Supabase Auth por e-mail e senha.",
      "Sessão autenticada usada para carregar o perfil ativo em public.perfis.",
      "Abertura, histórico, registro técnico e evidências passam a usar o usuário logado.",
      "RLS operacional reforçada para usuários authenticated sem service_role no client.",
    ],
    correcoes: [
      "Remoção de IDs fixos de operador, técnico e usuário de histórico nas ações do chamado.",
    ],
  },
  {
    versao: "v0.4.0",
    data: "27/04/2026",
    alteracoes: [
      "Status de chamados padronizados para o fluxo operacional completo.",
      "Abertura de chamados com categoria, ativo, complemento, marca e modelo.",
      "Detalhe do chamado passa a permitir alteração de status com histórico.",
      "Evidências reforçadas com upload por chamado e exibição de tipo, legenda e link.",
    ],
    correcoes: [
      "Listagem de chamados ajustada para exibir todos os status atuais e novos campos.",
    ],
  },
  {
    versao: "v0.3.0",
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
