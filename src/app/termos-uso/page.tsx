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

        <div className="mt-6 space-y-4 text-sm leading-6 text-gray-700">
          <p>
            O Portal de Atendimento Quarta Etapa é destinado à abertura,
            acompanhamento e gestão de chamados técnicos por usuários
            autorizados.
          </p>
          <p>
            O usuário deve informar dados corretos, preservar suas credenciais e
            registrar apenas informações relacionadas às demandas técnicas da
            empresa atendida.
          </p>
          <p>
            O acesso pode ser suspenso quando houver uso indevido, tentativa de
            acesso não autorizado ou solicitação do responsável operacional.
          </p>
          <p>
            Evidências, anexos e descrições enviados ao sistema devem respeitar
            a finalidade de atendimento e não devem conter dados desnecessários.
          </p>
          <p>
            Dúvidas ou solicitações sobre acesso devem ser direcionadas ao
            contato operacional da Quarta Etapa.
          </p>
        </div>
      </article>
    </main>
  );
}
