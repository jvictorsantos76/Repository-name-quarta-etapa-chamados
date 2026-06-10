"use client";

import { useEffect, useMemo } from "react";
import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import {
  SUPABASE_ACCESS_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
} from "./constants";

let browserClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuração do Supabase não encontrada.");
  }

  return { supabaseUrl, supabaseKey };
}

function getSupabaseAuthStorageKey(supabaseUrl: string) {
  try {
    const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
    return projectRef ? `sb-${projectRef}-auth-token` : null;
  } catch {
    return null;
  }
}

function getStoredSessionExpiration(value: unknown) {
  if (!value || typeof value !== "object") {
    return null;
  }

  const session = value as {
    expires_at?: unknown;
    currentSession?: { expires_at?: unknown };
  };
  const expiresAt = session.expires_at ?? session.currentSession?.expires_at;

  if (typeof expiresAt === "number") {
    return expiresAt;
  }

  if (typeof expiresAt === "string") {
    const parsed = Number(expiresAt);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function discardExpiredSupabaseBrowserSession(storageKey: string) {
  if (typeof window === "undefined") {
    return;
  }

  const storedSession = window.localStorage.getItem(storageKey);

  if (!storedSession) {
    return;
  }

  try {
    const expiresAt = getStoredSessionExpiration(JSON.parse(storedSession));
    const nowInSeconds = Math.floor(Date.now() / 1000);

    if (expiresAt !== null && expiresAt <= nowInSeconds + 30) {
      window.localStorage.removeItem(storageKey);
      syncSupabaseSessionCookies(null);
    }
  } catch {
    window.localStorage.removeItem(storageKey);
    syncSupabaseSessionCookies(null);
  }
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax`;
}

export function syncSupabaseSessionCookies(session: Session | null) {
  if (!session) {
    deleteCookie(SUPABASE_ACCESS_TOKEN_COOKIE);
    deleteCookie(SUPABASE_REFRESH_TOKEN_COOKIE);
    return;
  }

  const expiresIn = Math.max(session.expires_in ?? 3600, 60);
  setCookie(SUPABASE_ACCESS_TOKEN_COOKIE, session.access_token, expiresIn);
  setCookie(
    SUPABASE_REFRESH_TOKEN_COOKIE,
    session.refresh_token,
    60 * 60 * 24 * 30
  );
}

export async function clearInvalidSupabaseBrowserSession(
  supabase: SupabaseClient
) {
  syncSupabaseSessionCookies(null);

  try {
    await supabase.auth.signOut({ scope: "local" });
  } catch {
    // A sessão local já foi descartada; erros de refresh token inválido não
    // devem bloquear a navegação nem poluir o fluxo do usuário.
  }
}

export function createSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const storageKey = getSupabaseAuthStorageKey(supabaseUrl);

  if (storageKey) {
    discardExpiredSupabaseBrowserSession(storageKey);
  }

  browserClient = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: true,
      ...(storageKey ? { storageKey } : {}),
    },
  });

  return browserClient;
}

export function useSupabaseBrowserClient(): SupabaseClient {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let ativo = true;

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (ativo) {
          syncSupabaseSessionCookies(data.session);
        }
      })
      .catch(() => {
        if (ativo) {
          void clearInvalidSupabaseBrowserSession(supabase);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      syncSupabaseSessionCookies(session);
    });

    return () => {
      ativo = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  return supabase;
}
