import Link from "next/link";

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <article className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <Link href="/login" className="text-sm font-semibold text-blue-600">
          Voltar ao login
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
          LGPD/GDPR
        </p>
        <h1 className="mt-2 text-2xl font-bold">Política de Privacidade</h1>
        <p className="mt-2 text-sm text-gray-500">
          Portal de Atendimento Quarta Etapa
        </p>

        <div className="mt-6 space-y-6 text-sm leading-6 text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900">
              1. Controlador e contato
            </h2>
            <p className="mt-2">
              A Quarta Etapa atua como controladora dos dados pessoais tratados
              no portal para fins de acesso, atendimento técnico e gestão dos
              chamados. Solicitações de titulares podem ser encaminhadas para
              contato@quartaetpa.com.br.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              2. Dados coletados
            </h2>
            <p className="mt-2">
              Podemos tratar nome completo, e-mail, telefone, empresa, CNPJ,
              unidade, cargo, motivo da solicitação, registros de acesso,
              histórico de chamados, mensagens, evidências, anexos e informações
              técnicas necessárias ao atendimento.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              3. Finalidades e bases legais
            </h2>
            <p className="mt-2">
              Os dados são usados para autenticação, controle de acesso,
              validação de usuários, comunicação sobre chamados, execução de
              serviços contratados, segurança do ambiente, auditoria e
              cumprimento de obrigações legais. As bases podem incluir execução
              de contrato, procedimentos preliminares, legítimo interesse,
              cumprimento de obrigação legal e consentimento quando aplicável.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              4. Compartilhamento e operadores
            </h2>
            <p className="mt-2">
              Os dados podem ser tratados por fornecedores necessários à
              operação do portal, como provedores de autenticação, banco de
              dados, hospedagem, e-mail e armazenamento. Esses operadores devem
              tratar os dados conforme instruções e medidas de segurança
              compatíveis com a LGPD e, quando aplicável, com o GDPR.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              5. Retenção e segurança
            </h2>
            <p className="mt-2">
              Os dados são mantidos pelo tempo necessário para cumprir as
              finalidades do portal, preservar histórico operacional, atender
              obrigações legais e proteger direitos. Medidas técnicas e
              administrativas são aplicadas para restringir acesso a usuários
              autorizados.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              6. Direitos dos titulares
            </h2>
            <p className="mt-2">
              O titular pode solicitar confirmação de tratamento, acesso,
              correção, anonimização, bloqueio, eliminação, portabilidade,
              informação sobre compartilhamento, revisão de decisões quando
              aplicável e oposição ao tratamento nas hipóteses previstas em lei.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              7. Transferência internacional
            </h2>
            <p className="mt-2">
              Quando fornecedores ou infraestrutura estiverem localizados fora
              do Brasil ou da União Europeia, a transferência deverá observar
              salvaguardas adequadas, finalidade legítima e medidas de proteção
              compatíveis com a legislação aplicável.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
