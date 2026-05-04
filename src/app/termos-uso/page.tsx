import Link from "next/link";

export default function TermosUsoPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <article className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <Link href="/login" className="text-sm font-semibold text-blue-600">
          Voltar ao login
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Uso do sistema
        </p>
        <h1 className="mt-2 text-2xl font-bold">Termos de Uso</h1>
        <p className="mt-2 text-sm text-gray-500">
          Portal de Atendimento Quarta Etapa
        </p>

        <div className="mt-6 space-y-6 text-sm leading-6 text-gray-700">
          <section>
            <h2 className="text-base font-semibold text-gray-900">
              1. Finalidade do portal
            </h2>
            <p className="mt-2">
              O Portal de Atendimento Quarta Etapa é destinado à solicitação,
              abertura, acompanhamento e gestão de chamados técnicos por
              usuários autorizados e empresas atendidas.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              2. Cadastro e acesso
            </h2>
            <p className="mt-2">
              O cadastro público cria uma solicitação de acesso e não libera uso
              imediato. A aprovação depende de validação pela Quarta Etapa ou por
              responsável autorizado. Após a aprovação, o usuário poderá receber
              convite por e-mail para definir suas credenciais.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              3. Responsabilidades do usuário
            </h2>
            <p className="mt-2">
              O usuário deve informar dados corretos, preservar suas credenciais,
              manter sigilo de informações recebidas no portal e registrar apenas
              informações relacionadas às demandas técnicas da empresa atendida.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              4. Uso adequado de informações
            </h2>
            <p className="mt-2">
              Evidências, anexos e descrições enviados ao sistema devem respeitar
              a finalidade de atendimento. O usuário não deve inserir dados
              pessoais, sensíveis, confidenciais ou de terceiros quando esses
              dados não forem necessários para o chamado.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              5. Segurança e suspensão
            </h2>
            <p className="mt-2">
              O acesso pode ser suspenso quando houver uso indevido,
              compartilhamento de credenciais, tentativa de acesso não
              autorizado, solicitação do responsável operacional ou necessidade
              de preservar a segurança do ambiente.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              6. Privacidade e legislação aplicável
            </h2>
            <p className="mt-2">
              O tratamento de dados pessoais no portal deve observar a LGPD e,
              quando aplicável, o GDPR. As informações sobre finalidades, bases
              legais, direitos dos titulares e contato estão descritas na Política
              de Privacidade.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900">
              7. Contato
            </h2>
            <p className="mt-2">
              Dúvidas, solicitações sobre acesso ou pedidos relacionados a
              privacidade podem ser encaminhados para contato@quartaetpa.com.br.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
