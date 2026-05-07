"use client";

import { createContext, useEffect, useMemo, useState } from "react";
import {
  applyTheme,
  persistTheme,
  readStoredTheme,
} from "@/lib/theme/applyTheme";
import {
  DEFAULT_THEME_PREFERENCES,
  normalizarPreferenciasTema,
} from "@/lib/theme/constants";
import type { PreferenciasTema } from "@/lib/theme/types";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";

type ThemeContextValue = {
  preferencias: PreferenciasTema;
  setPreferencias: (preferencias: PreferenciasTema) => void;
};

export const ThemeContext = createContext<ThemeContextValue>({
  preferencias: DEFAULT_THEME_PREFERENCES,
  setPreferencias: () => undefined,
});

export function ThemeProvider({
  children,
  initialPreferences = DEFAULT_THEME_PREFERENCES,
}: {
  children: React.ReactNode;
  initialPreferences?: PreferenciasTema;
}) {
  const supabase = useSupabaseBrowserClient();
  const [preferencias, setPreferenciasState] = useState<PreferenciasTema>(
    () => readStoredTheme(initialPreferences)
  );

  const contextValue = useMemo<ThemeContextValue>(
    () => ({
      preferencias,
      setPreferencias: (novasPreferencias) => {
        const normalizadas = applyTheme(novasPreferencias);
        persistTheme(normalizadas);
        setPreferenciasState(normalizadas);
      },
    }),
    [preferencias]
  );

  useEffect(() => {
    applyTheme(preferencias);
  }, [preferencias]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    function reaplicarTemaSistema() {
      applyTheme(preferencias);
    }

    mediaQuery.addEventListener("change", reaplicarTemaSistema);

    return () => {
      mediaQuery.removeEventListener("change", reaplicarTemaSistema);
    };
  }, [preferencias]);

  useEffect(() => {
    let ativo = true;

    async function carregarPreferenciasPerfil() {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;

      if (!userId) {
        return;
      }

      const { data, error } = await supabase
        .from("perfis")
        .select("tema_preferido, cor_preferida, fonte_escala")
        .eq("id", userId)
        .eq("ativo", true)
        .maybeSingle();

      if (!ativo || error || !data) {
        return;
      }

      const preferenciasPerfil = normalizarPreferenciasTema(data);
      applyTheme(preferenciasPerfil);
      persistTheme(preferenciasPerfil);
      setPreferenciasState(preferenciasPerfil);
    }

    void carregarPreferenciasPerfil();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user.id) {
        return;
      }

      void carregarPreferenciasPerfil();
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return (
    <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>
  );
}
