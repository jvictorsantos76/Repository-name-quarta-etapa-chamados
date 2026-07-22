import Link from "next/link";
import {
  createSupabasePublicServerClient,
  getSupabasePasswordSetupToken,
} from "@/lib/supabase/server";
import { AlterarSenhaForm } from "./AlterarSenhaForm";

async function temTokenDeAlteracaoValido() {
  const passwordSetupToken = await getSupabasePasswordSetupToken();

  if (!passwordSetupToken) {
    return false;
  }

  const supabase = createSupabasePublicServerClient();
  const { data, error } = await supabase.auth.getUser(passwordSetupToken);

  return !error && Boolean(data.user);
}

export default async function AlterarSenhaPage() {
  const tokenDeAlteracaoValido = await temTokenDeAlteracaoValido();

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

        {!tokenDeAlteracaoValido ? (
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
