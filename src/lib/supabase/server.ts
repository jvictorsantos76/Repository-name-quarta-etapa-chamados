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

export async function getSupabaseRefreshToken() {
  return (await cookies()).get(SUPABASE_REFRESH_TOKEN_COOKIE)?.value ?? null;
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

async function bloquearSolicitacaoExpirada(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const agora = new Date().toISOString();

  await supabaseAdmin
    .from("solicitacoes_acesso")
    .update({
      status: "expirado",
      bloqueado_em: agora,
      erro_provisionamento:
        "Acesso temporário expirado automaticamente após 72 horas úteis.",
    })
    .or(`user_id.eq.${userId},auth_user_id.eq.${userId},perfil_id.eq.${userId}`)
    .eq("status", "pendente_aprovacao")
    .not("expira_em", "is", null)
    .lt("expira_em", agora);
}

async function buscarSolicitacaoAcesso(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();

  await bloquearSolicitacaoExpirada(userId);

  const { data } = await supabaseAdmin
    .from("solicitacoes_acesso")
    .select("status, expira_em, email_confirmado_em, bloqueado_em")
    .or(`user_id.eq.${userId},auth_user_id.eq.${userId},perfil_id.eq.${userId}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as {
    status: string;
    expira_em: string | null;
    email_confirmado_em: string | null;
    bloqueado_em: string | null;
  } | null;
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
      "id, nome_completo, email, papel, ativo, telefone, avatar_url, biografia, cargo, cliente_id, loja_id, tema_preferido, cor_preferida, fonte_escala"
    )
    .eq("id", userData.user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (perfilError || !perfil || !isPapelUsuario(perfil.papel)) {
    redirect("/aguardando-aprovacao");
  }

  const solicitacao = await buscarSolicitacaoAcesso(userData.user.id);

  if (perfil.papel === "solicitante") {
    const acessoTemporarioAtivo =
      solicitacao?.status === "pendente_aprovacao" &&
      Boolean(solicitacao.email_confirmado_em) &&
      Boolean(solicitacao.expira_em) &&
      new Date(solicitacao.expira_em as string).getTime() > Date.now() &&
      !solicitacao.bloqueado_em;

    if (!acessoTemporarioAtivo) {
      redirect("/aguardando-aprovacao");
    }
  }

  return {
    ...(perfil as PerfilAutenticado),
    acesso_status: solicitacao?.status ?? null,
    acesso_expira_em: solicitacao?.expira_em ?? null,
  };
}

export async function requireAdminOuGestor() {
  const perfil = await requirePerfilAutenticado();

  if (!podeAdministrarUsuarios(perfil.papel)) {
    redirect("/");
  }

  return perfil;
}

export const requireAdminUsuarios = requireAdminOuGestor;
