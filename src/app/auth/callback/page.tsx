"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createSupabaseBrowserClient,
  syncSupabaseSessionCookies,
} from "@/lib/supabase/client";

function getSafeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  return value;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mensagem, setMensagem] = useState("Concluindo autenticação...");

  useEffect(() => {
    let ativo = true;

    async function concluirLogin() {
      try {
        const code = searchParams.get("code");
        const nextPath = getSafeNextPath(searchParams.get("next"));

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            if (ativo) {
              setMensagem("Não foi possível concluir o login. Tente novamente.");
            }

            return;
          }
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;

        if (!session) {
          router.replace("/login");
          router.refresh();
          return;
        }

        syncSupabaseSessionCookies(session);

        const { data: perfil, error: perfilError } = await supabase
          .from("perfis")
          .select("id, nome_completo, email, papel, ativo")
          .eq("id", session.user.id)
          .eq("ativo", true)
          .maybeSingle();

        if (perfilError || !perfil) {
          router.replace("/aguardando-aprovacao");
          router.refresh();
          return;
        }

        router.replace(nextPath);
        router.refresh();
      } catch {
        if (ativo) {
          setMensagem("Ocorreu um erro ao concluir a autenticação.");
        }
      }
    }

    concluirLogin();

    return () => {
      ativo = false;
    };
  }, [router, searchParams, supabase]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-gray-900">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Portal de Atendimento Quarta Etapa
        </p>

        <h1 className="mt-3 text-2xl font-bold">Login com Google</h1>

        <p className="mt-3 text-sm leading-6 text-gray-600">{mensagem}</p>
      </section>
    </main>
  );
}

function AuthCallbackFallback() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 text-gray-900">
      <section className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Portal de Atendimento Quarta Etapa
        </p>

        <h1 className="mt-3 text-2xl font-bold">Login com Google</h1>

        <p className="mt-3 text-sm leading-6 text-gray-600">
          Preparando autenticação...
        </p>
      </section>
    </main>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthCallbackFallback />}>
      <AuthCallbackContent />
    </Suspense>
  );
}
