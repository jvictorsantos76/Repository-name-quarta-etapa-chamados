import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createClient,
  type Session,
  type SupabaseClient,
} from "@supabase/supabase-js";
import type { PerfilAutenticado } from "@/lib/auth/types";
import { isPapelUsuario, podeAdministrarUsuarios } from "@/lib/auth/permissions";
import {
  SUPABASE_ACCESS_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
} from "./constants";

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

function getSupabaseAdminConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Configuração administrativa do Supabase não encontrada.");
  }

  return { supabaseUrl, serviceRoleKey };
}

export async function getSupabaseAccessToken() {
  return (await cookies()).get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function setSupabaseSessionCookies(session: Session) {
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === "production";

  cookieStore.set(SUPABASE_ACCESS_TOKEN_COOKIE, session.access_token, {
    path: "/",
    maxAge: Math.max(session.expires_in ?? 3600, 60),
    sameSite: "lax",
    secure,
  });

  cookieStore.set(SUPABASE_REFRESH_TOKEN_COOKIE, session.refresh_token, {
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
    secure,
  });
}

export async function clearSupabaseSessionCookies() {
  const cookieStore = await cookies();

  cookieStore.set(SUPABASE_ACCESS_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  cookieStore.set(SUPABASE_REFRESH_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function createSupabasePublicServerClient(): SupabaseClient {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const { supabaseUrl, supabaseKey } = getSupabaseConfig();
  const accessToken = await getSupabaseAccessToken();

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export function createSupabaseAdminClient(): SupabaseClient {
  const { supabaseUrl, serviceRoleKey } = getSupabaseAdminConfig();

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function requirePerfilAutenticado() {
  const accessToken = await getSupabaseAccessToken();

  if (!accessToken) {
    redirect("/login");
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(
    accessToken
  );

  if (userError || !userData.user) {
    redirect("/login");
  }

  const { data: perfil, error: perfilError } = await supabase
    .from("perfis")
    .select(
      "id, nome_completo, email, papel, ativo, telefone, avatar_url, biografia, cargo, cliente_id, loja_id"
    )
    .eq("id", userData.user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (perfilError || !perfil || !isPapelUsuario(perfil.papel)) {
    redirect("/aguardando-aprovacao");
  }

  return perfil as PerfilAutenticado;
}

export async function requireAdminOuGestor() {
  const perfil = await requirePerfilAutenticado();

  if (!podeAdministrarUsuarios(perfil.papel)) {
    redirect("/");
  }

  return perfil;
}

export const requireAdminUsuarios = requireAdminOuGestor;
