"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSupabaseBrowserClient,
  syncSupabaseSessionCookies,
} from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        syncSupabaseSessionCookies(data.session);
        router.replace("/");
        return;
      }

      setCarregando(false);
    }

    verificarSessao();
  }, [router, supabase]);

  async function entrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setEntrando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error || !data.session) {
      setErro(error?.message ?? "Não foi possível entrar.");
      setEntrando(false);
      return;
    }

    syncSupabaseSessionCookies(data.session);
    router.replace("/");
    router.refresh();
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-gray-900">
        <p className="text-sm text-gray-600">Verificando sessão...</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-gray-900">
      <section className="w-full max-w-md rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Quarta Etapa
        </p>
        <h1 className="mt-2 text-2xl font-bold">Entrar no sistema</h1>
        <p className="mt-2 text-sm text-gray-600">
          Use o e-mail e senha cadastrados no Supabase Auth.
        </p>

        <form onSubmit={entrar} className="mt-6 space-y-4">
          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {erro}
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={entrando}
            className="w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {entrando ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
