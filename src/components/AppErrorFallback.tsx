"use client";

import Link from "next/link";

type AppErrorFallbackProps = {
  reset?: () => void;
};

export function AppErrorFallback({ reset }: AppErrorFallbackProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-6 text-white">
      <section className="w-full max-w-lg rounded-xl border border-white/10 bg-white p-6 text-gray-950 shadow-2xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Portal de Atendimento Quarta Etapa
        </p>
        <h1 className="mt-3 text-2xl font-bold">Ops, a tela saiu do trilho.</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          Não conseguimos carregar esta página agora. Se você acabou de encerrar
          a sessão, volte ao login e acesse novamente.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {reset ? (
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-lg bg-gray-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Tentar novamente
            </button>
          ) : null}
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Voltar ao login
          </Link>
          <Link
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Ir para chamados
          </Link>
        </div>
      </section>
    </main>
  );
}
