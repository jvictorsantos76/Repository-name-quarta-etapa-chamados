import Link from "next/link";

export default function PoliticaPrivacidadePage() {
  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <article className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <Link href="/login" className="text-sm font-semibold text-blue-600">
          Voltar ao login
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
          LGPD
        </p>
        <h1 className="mt-2 text-2xl font-bold">Política de Privacidade</h1>

        <div className="mt-6 space-y-4 text-sm leading-6 text-gray-700">
          <p>
            A Quarta Etapa trata dados pessoais para identificar usuários,
            controlar acesso e viabilizar a abertura, acompanhamento e gestão
            de chamados técnicos.
          </p>
          <p>
            Podemos coletar nome completo, e-mail, telefone, empresa, CNPJ,
            unidade, cargo, registros de acesso e informações necessárias para
            atendimento técnico.
          </p>
          <p>
            Os dados são usados para autenticação, gestão operacional,
            comunicação sobre chamados, registro de evidências e segurança do
            ambiente.
          </p>
          <p>
            O acesso ao sistema é restrito a usuários autorizados. Cada usuário
            é responsável por manter suas credenciais protegidas e por registrar
            informações verdadeiras.
          </p>
          <p>
            Solicitações sobre privacidade, correção ou remoção de dados podem
            ser encaminhadas ao contato operacional da Quarta Etapa.
          </p>
        </div>
      </article>
    </main>
  );
}
