"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { APP_VERSION } from "@/config/version";
import {
  createSupabaseBrowserClient,
  syncSupabaseSessionCookies,
} from "@/lib/supabase/client";

const mensagemCredenciais =
  "E-mail ou senha inválidos. Confira seus dados e tente novamente.";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const redirecionarPorPerfil = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;

    if (!userId) {
      router.replace("/aguardando-aprovacao");
      router.refresh();
      return;
    }

    const { data, error } = await supabase
      .from("perfis")
      .select("id, ativo")
      .eq("id", userId)
      .eq("ativo", true)
      .maybeSingle();

    if (error || !data) {
      router.replace("/aguardando-aprovacao");
      router.refresh();
      return;
    }

    router.replace("/");
    router.refresh();
  }, [router, supabase]);

  useEffect(() => {
    async function verificarSessao() {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        syncSupabaseSessionCookies(data.session);
        await redirecionarPorPerfil();
        return;
      }

      setCarregando(false);
    }

    verificarSessao();
  }, [redirecionarPorPerfil, supabase]);

  async function entrar(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setAviso("");
    setEntrando(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error || !data.session) {
      setErro(mensagemCredenciais);
      setEntrando(false);
      return;
    }

    syncSupabaseSessionCookies(data.session);
    await redirecionarPorPerfil();
  }

  async function continuarComGoogle() {
    setErro("");
    setAviso("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    // O provider Google precisa estar habilitado no painel Supabase Auth e
    // configurado no Google Cloud com a callback URL informada pelo Supabase.
    if (error) {
      setErro("Não foi possível iniciar o login com Google.");
    }
  }

  async function recuperarSenha() {
    if (!email.trim()) {
      setErro("Informe seu e-mail para receber as instruções de recuperação.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      setErro("Não foi possível enviar a recuperação de senha.");
      return;
    }

    setErro("");
    setAviso("Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.");
  }

  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-gray-900">
        <p className="text-sm text-gray-600">Verificando sessão...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10">
        <div className="grid w-full overflow-hidden rounded-xl bg-white shadow md:grid-cols-[1fr_420px]">
          <div className="flex min-h-[520px] flex-col justify-between bg-gray-950 p-8 text-white">
            <div>
              <div className="flex h-14 w-48 items-center justify-center rounded-lg border border-white/20 bg-white p-2">
                <Image
                  src="/brand/quarta-etapa-logo.png"
                  alt="Quarta Etapa"
                  width={180}
                  height={40}
                  className="max-h-10 w-auto object-contain"
                />
              </div>

              <div className="mt-12 max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                  Portal corporativo
                </p>
                <h1 className="mt-3 text-3xl font-bold md:text-4xl">
                  Portal de Atendimento Quarta Etapa
                </h1>
                <p className="mt-4 text-base text-gray-300">
                  Abertura, acompanhamento e gestão de chamados técnicos.
                </p>
              </div>
            </div>

            <p className="mt-10 text-sm text-gray-400">
              Acesso restrito a usuários autorizados pela Quarta Etapa ou por
              responsável operacional cadastrado.
            </p>
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold">Entrar</h2>
            <p className="mt-2 text-sm text-gray-600">
              Use seu e-mail corporativo e senha para acessar o sistema.
            </p>

            <button
              type="button"
              onClick={continuarComGoogle}
              className="mt-6 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
            >
              Continuar com Google
            </button>

            <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              <span className="h-px flex-1 bg-gray-200" />
              ou
              <span className="h-px flex-1 bg-gray-200" />
            </div>

            <form onSubmit={entrar} className="space-y-4">
          {erro && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {erro}
            </div>
          )}
          {aviso && (
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
              {aviso}
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

            <div className="mt-5 flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
              <Link href="/cadastro" className="font-semibold text-blue-600">
                Solicitar acesso
              </Link>
              <button
                type="button"
                onClick={recuperarSenha}
                className="text-left font-semibold text-gray-600"
              >
                Esqueci minha senha
              </button>
            </div>

            <footer className="mt-8 border-t border-gray-200 pt-4 text-xs text-gray-500">
              <div className="flex flex-wrap gap-3">
                <Link href="/politica-privacidade" className="hover:text-blue-600">
                  Política de Privacidade
                </Link>
                <Link href="/termos-uso" className="hover:text-blue-600">
                  Termos de Uso
                </Link>
                <span>Versão {APP_VERSION}</span>
              </div>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
