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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuração do Supabase não encontrada.");
  }

  return { supabaseUrl, supabaseKey };
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

export function createSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  browserClient = createClient(supabaseUrl, supabaseKey);

  return browserClient;
}

export function useSupabaseBrowserClient(): SupabaseClient {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    let ativo = true;

    supabase.auth.getSession().then(({ data }) => {
      if (ativo) {
        syncSupabaseSessionCookies(data.session);
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
