"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LOGIN_PAGE_VERSION } from "@/config/version";
import {
  createSupabaseBrowserClient,
  syncSupabaseSessionCookies,
} from "@/lib/supabase/client";

const mensagemCredenciais =
  "E-mail ou senha inválidos. Confira seus dados e tente novamente.";

const TEMPO_VERIFICACAO_SESSAO_MS = 8000;

const contatos = [
  {
    titulo: "Quarta Etapa",
    linhas: ["R. 1034, 76", "(85) 3235-0449"],
  },
  {
    titulo: "Desenvolvimento/Suporte técnico",
    linhas: ["João Victo", "suporte@quartaetapa.com.br"],
    email: "suporte@quartaetapa.com.br",
  },
  {
    titulo: "Administrativo",
    linhas: ["Fabiana Carvalho", "fabiana.carvalho@quartaetapa.com.br"],
    email: "fabiana.carvalho@quartaetapa.com.br",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
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
      const session = await Promise.race([
        supabase.auth.getSession().then(({ data }) => data.session),
        new Promise<null>((resolve) =>
          setTimeout(resolve, TEMPO_VERIFICACAO_SESSAO_MS, null)
        ),
      ]);

      if (session) {
        syncSupabaseSessionCookies(session);
        await redirecionarPorPerfil();
      }
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
        redirectTo: `${window.location.origin}/auth/callback`,
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
    setAviso(
      "Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação."
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <section className="mx-auto flex min-h-screen max-w-6xl items-center px-4 py-8 sm:px-6 md:py-10">
        <div className="grid w-full overflow-hidden rounded-xl bg-white shadow md:grid-cols-[minmax(0,1fr)_430px]">
          <div className="flex min-h-[560px] flex-col justify-between bg-gray-950 p-6 text-white sm:p-8 md:p-10">
            <div>
              <div className="flex h-24 w-full max-w-[360px] items-center justify-center rounded-lg border border-white/20 bg-white px-5 py-4 shadow-sm">
                <Image
                  src="/brand/quarta-etapa-logo.png"
                  alt="Quarta Etapa"
                  width={300}
                  height={120}
                  priority
                  className="h-auto max-h-20 w-full object-contain"
                />
              </div>

              <div className="mt-10 max-w-xl">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                  Portal corporativo
                </p>
                <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                  Portal de Atendimento Quarta Etapa
                </h1>
                <p className="mt-4 text-base leading-7 text-gray-300">
                  Abertura, acompanhamento e gestão de chamados técnicos.
                </p>
              </div>

              <div className="mt-8 border-t border-white/10 pt-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">
                  Contatos
                </p>
                <div className="mt-4 grid gap-4 text-sm text-gray-300 sm:grid-cols-2">
                  {contatos.map((contato) => (
                    <div key={contato.titulo} className="border-l border-blue-300/50 pl-4">
                      <p className="font-semibold text-white">{contato.titulo}</p>
                      <div className="mt-2 space-y-1">
                        {contato.linhas.map((linha) =>
                          contato.email === linha ? (
                            <a
                              key={linha}
                              href={`mailto:${linha}`}
                              className="block break-words text-blue-200 hover:text-blue-100"
                            >
                              {linha}
                            </a>
                          ) : (
                            <p key={linha}>{linha}</p>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10 space-y-3 text-sm leading-6 text-gray-400">
              <p>
                Acesso restrito a usuários autorizados pela Quarta Etapa ou por
                responsável operacional cadastrado.
              </p>
              <p>
                Os dados informados são tratados para autenticação, controle de
                acesso e gestão de chamados, em conformidade com LGPD/GDPR.
              </p>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Já tenho acesso
              </p>
              <h2 className="mt-2 text-2xl font-bold">Entrar</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Use sua conta autorizada para acessar chamados, histórico e
                registros técnicos.
              </p>
            </div>

            <button
              type="button"
              onClick={continuarComGoogle}
              className="mt-6 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm hover:bg-gray-50"
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
                  className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                  className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  autoComplete="current-password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={entrando}
                className="min-h-11 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {entrando ? "Entrando..." : "Entrar"}
              </button>
            </form>

            <div className="mt-5 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={recuperarSenha}
                className="min-h-11 text-left font-semibold text-gray-600 hover:text-gray-900"
              >
                Esqueci minha senha
              </button>
            </div>

            <div className="mt-8 border-t border-gray-200 pt-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Novo usuário
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Solicite acesso para que a equipe responsável valide seu cadastro
                antes da liberação operacional.
              </p>
              <Link
                href="/cadastro"
                className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Solicitar acesso
              </Link>
            </div>

            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 text-gray-600">
              <p>
                LGPD/GDPR: usamos os dados informados para autenticação, controle
                de acesso e gestão de chamados. Consulte os documentos legais
                abaixo para detalhes.
              </p>
            </div>

            <footer className="mt-6 border-t border-gray-200 pt-4 text-xs text-gray-500">
              <div className="flex flex-wrap gap-3">
                <Link href="/politica-privacidade" className="hover:text-blue-600">
                  Política de Privacidade
                </Link>
                <Link href="/termos-uso" className="hover:text-blue-600">
                  Termos de Uso
                </Link>
                <span>Tela de Login {LOGIN_PAGE_VERSION}</span>
              </div>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
