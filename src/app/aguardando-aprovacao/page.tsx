import Link from "next/link";

export default function AguardandoAprovacaoPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-gray-900">
      <section className="w-full max-w-xl rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Aguardando aprovação
        </p>
        <h1 className="mt-2 text-2xl font-bold">Acesso ainda não autorizado</h1>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          Seu cadastro foi recebido ou seu usuário ainda não possui autorização
          operacional. A liberação de acesso depende de validação da Quarta
          Etapa ou do responsável autorizado da sua empresa.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800"
        >
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
