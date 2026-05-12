"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  syncSupabaseSessionCookies,
  useSupabaseBrowserClient,
} from "@/lib/supabase/client";

export function AguardandoAprovacaoClient() {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [mensagem, setMensagem] = useState("Verificando sessão...");

  useEffect(() => {
    let ativo = true;

    async function verificarAcesso() {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData.session;

      if (!ativo || !session) {
        setMensagem("Entre novamente para atualizar sua sessão.");
        return;
      }

      syncSupabaseSessionCookies(session);
      const resposta = await fetch("/auth/access-status", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      const acesso = (await resposta.json()) as {
        kind: string;
        redirectTo: string;
        message?: string;
      };

      if (!ativo) {
        return;
      }

      if (!resposta.ok) {
        setMensagem("Não foi possível verificar a sessão automaticamente.");
        return;
      }

      if (acesso.kind !== "operational" && acesso.kind !== "temporary") {
        setMensagem(acesso.message ?? "Sessão encontrada, mas sem acesso ativo.");
        return;
      }

      router.replace(acesso.redirectTo);
      router.refresh();
    }

    verificarAcesso().catch(() => {
      if (ativo) {
        setMensagem("Não foi possível verificar a sessão automaticamente.");
      }
    });

    return () => {
      ativo = false;
    };
  }, [router, supabase]);

  return <p className="mt-4 text-xs text-gray-500">{mensagem}</p>;
}
