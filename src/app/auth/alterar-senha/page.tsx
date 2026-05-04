import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AlterarSenhaForm } from "./AlterarSenhaForm";

async function temSessaoValida() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  return !error && Boolean(data.user);
}

export default async function AlterarSenhaPage() {
  const sessaoValida = await temSessaoValida();

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <section className="mx-auto max-w-xl rounded-xl bg-white p-6 shadow">
        <Link href="/login" className="text-sm font-semibold text-blue-600">
          Voltar ao login
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Recuperação de acesso
        </p>
        <h1 className="mt-2 text-2xl font-bold">Alterar senha</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          Defina uma nova senha para sua conta autorizada.
        </p>

        {!sessaoValida ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Link expirado ou sessão não encontrada. Solicite novamente a
            recuperação de senha.
          </div>
        ) : (
          <AlterarSenhaForm />
        )}
      </section>
    </main>
  );
}
