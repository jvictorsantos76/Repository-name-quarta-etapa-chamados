"use client";

import { useContext, useState, useTransition } from "react";
import { ThemeContext } from "@/components/theme/ThemeProvider";
import { atualizarPreferenciasPerfil } from "@/app/perfil/actions";
import {
  createSupabaseBrowserClient,
  syncSupabaseSessionCookies,
} from "@/lib/supabase/client";
import type { TemaPreferido } from "@/lib/theme/types";

type ContaAcoesRapidasProps = {
  variant?: "header" | "footer";
};

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function ThemeIcon({ tema }: { tema: TemaPreferido }) {
  if (tema === "dark") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M6.34 17.66l-1.41 1.41" />
        <path d="M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}

export function ContaAcoesRapidas({
  variant = "header",
}: ContaAcoesRapidasProps) {
  const { preferencias, setPreferencias } = useContext(ThemeContext);
  const [mensagem, setMensagem] = useState("");
  const [pendente, startTransition] = useTransition();
  const temaAtual = preferencias.tema_preferido === "dark" ? "dark" : "light";
  const proximoTema: TemaPreferido = temaAtual === "dark" ? "light" : "dark";
  const themeLabel =
    temaAtual === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro";

  function alternarTema() {
    const proximasPreferencias = {
      ...preferencias,
      tema_preferido: proximoTema,
    };

    setMensagem("");
    setPreferencias(proximasPreferencias);

    startTransition(() => {
      void atualizarPreferenciasPerfil(proximasPreferencias).then((resultado) => {
        if (resultado.status !== "success") {
          setMensagem(resultado.message);
        }
      });
    });
  }

  function encerrarSessao() {
    setMensagem("");

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      syncSupabaseSessionCookies(null);

      if (error) {
        setMensagem(
          "Não foi possível encerrar a sessão no navegador. Tente novamente."
        );
        return;
      }

      window.location.assign("/auth/logout");
    });
  }

  if (variant === "footer") {
    return (
      <section className="mt-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-950">Ações da conta</h2>
            <p className="mt-1 text-sm text-gray-600">
              Alternância rápida de tema e encerramento seguro da sessão.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={alternarTema}
              disabled={pendente}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ThemeIcon tema={temaAtual} />
              {themeLabel}
            </button>
            <button
              type="button"
              onClick={encerrarSessao}
              disabled={pendente}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogoutIcon />
              Encerrar sessão
            </button>
          </div>
        </div>
        {mensagem ? (
          <p className="mt-3 text-sm font-medium text-red-700" role="alert">
            {mensagem}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={alternarTema}
        disabled={pendente}
        aria-label={themeLabel}
        title={themeLabel}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ThemeIcon tema={temaAtual} />
      </button>
      <button
        type="button"
        onClick={encerrarSessao}
        disabled={pendente}
        aria-label="Encerrar sessão"
        title="Encerrar sessão"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-red-200 bg-white text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogoutIcon />
      </button>
      {mensagem ? <span className="sr-only">{mensagem}</span> : null}
    </div>
  );
}
