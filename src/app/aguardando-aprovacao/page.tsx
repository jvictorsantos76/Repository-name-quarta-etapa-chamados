import Link from "next/link";
import { redirect } from "next/navigation";
import {
  resolverAcessoAutenticado,
} from "@/lib/supabase/server";
import { AguardandoAprovacaoClient } from "./AguardandoAprovacaoClient";

export default async function AguardandoAprovacaoPage() {
  const acesso = await resolverAcessoAutenticado();

  if (acesso.kind === "operational" || acesso.kind === "temporary") {
    redirect(acesso.redirectTo);
  }

  const titulo =
    acesso.kind === "awaiting_email"
      ? "Confirme seu e-mail"
      : acesso.kind === "blocked"
        ? "Acesso temporário indisponível"
        : "Acesso ainda não autorizado";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-gray-900">
      <section className="w-full max-w-xl rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Aguardando aprovação
        </p>
        <h1 className="mt-2 text-2xl font-bold">{titulo}</h1>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          {acesso.message}
        </p>
        <AguardandoAprovacaoClient />
        <Link
          href="/auth/logout"
          className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800"
        >
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
