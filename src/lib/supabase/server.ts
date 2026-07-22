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
  SUPABASE_PASSWORD_SETUP_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
} from "./constants";

const PERFIL_SELECT =
  "id, nome_completo, email, papel, ativo, telefone, avatar_url, biografia, cargo, cliente_id, loja_id, tema_preferido, cor_preferida, fonte_escala";

type SolicitacaoAcessoResumo = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  empresa: string;
  cnpj: string | null;
  loja_unidade: string | null;
  cargo: string | null;
  status: string;
  user_id: string | null;
  auth_user_id: string | null;
  perfil_id: string | null;
  email_confirmado_em: string | null;
  expira_em: string | null;
  bloqueado_em: string | null;
  cliente_id: string | null;
  loja_id: string | null;
  motivo_rejeicao: string | null;
  erro_provisionamento: string | null;
};

type AccessResolution =
  | {
      kind: "unauthenticated";
      redirectTo: "/login";
      message: string;
      perfil: null;
      solicitacao: null;
    }
  | {
      kind: "operational";
      redirectTo: "/";
      message: string;
      perfil: PerfilAutenticado;
      solicitacao: SolicitacaoAcessoResumo | null;
    }
  | {
      kind: "awaiting_email" | "awaiting_approval" | "blocked" | "inconsistent";
      redirectTo: "/aguardando-aprovacao";
      message: string;
      perfil: PerfilAutenticado | null;
      solicitacao: SolicitacaoAcessoResumo | null;
    };

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

export async function getSupabasePasswordSetupToken() {
  return (
    (await cookies()).get(SUPABASE_PASSWORD_SETUP_TOKEN_COOKIE)?.value ?? null
  );
}

export async function setSupabasePasswordSetupCookie(session: Session) {
  const cookieStore = await cookies();

  cookieStore.set(
    SUPABASE_PASSWORD_SETUP_TOKEN_COOKIE,
    session.access_token,
    {
      httpOnly: true,
      path: "/auth/alterar-senha",
      maxAge: Math.min(Math.max(session.expires_in ?? 3600, 60), 30 * 60),
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      priority: "high",
    }
  );
}

export async function clearSupabasePasswordSetupCookie() {
  (await cookies()).set(SUPABASE_PASSWORD_SETUP_TOKEN_COOKIE, "", {
    httpOnly: true,
    path: "/auth/alterar-senha",
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    priority: "high",
  });
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

async function buscarPerfilAtivoPorId(userId: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("perfis")
    .select(PERFIL_SELECT)
    .eq("id", userId)
    .eq("ativo", true)
    .maybeSingle();

  if (error || !data || !isPapelUsuario(data.papel)) {
    return null;
  }

  return data as PerfilAutenticado;
}

async function buscarSolicitacaoPorUsuario(
  userId: string,
  email: string | null
) {
  const supabaseAdmin = createSupabaseAdminClient();
  const filtros = [
    `user_id.eq.${userId}`,
    `auth_user_id.eq.${userId}`,
    `perfil_id.eq.${userId}`,
  ];

  if (email) {
    filtros.push(`email.eq.${email}`);
  }

  const { data } = await supabaseAdmin
    .from("solicitacoes_acesso")
    .select(
      "id, nome_completo, email, telefone, empresa, cnpj, loja_unidade, cargo, status, user_id, auth_user_id, perfil_id, email_confirmado_em, expira_em, bloqueado_em, cliente_id, loja_id, motivo_rejeicao, erro_provisionamento"
    )
    .or(filtros.join(","))
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as SolicitacaoAcessoResumo | null) ?? null;
}

export async function resolverAcessoAutenticadoComToken(
  accessToken: string | null
): Promise<AccessResolution> {
  if (!accessToken) {
    return {
      kind: "unauthenticated",
      redirectTo: "/login",
      message: "Entre novamente para continuar.",
      perfil: null,
      solicitacao: null,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(
    accessToken
  );

  if (userError || !userData.user) {
    return {
      kind: "unauthenticated",
      redirectTo: "/login",
      message: "Sua sessão expirou. Entre novamente.",
      perfil: null,
      solicitacao: null,
    };
  }

  const user = userData.user;
  const solicitacao = await buscarSolicitacaoPorUsuario(
    user.id,
    user.email?.trim().toLowerCase() ?? null
  );
  const perfil = await buscarPerfilAtivoPorId(user.id);

  if (perfil) {
    return {
      kind: "operational",
      redirectTo: "/",
      message: "Acesso operacional liberado.",
      perfil,
      solicitacao,
    };
  }

  if (!user.email_confirmed_at) {
    return {
      kind: "awaiting_email",
      redirectTo: "/aguardando-aprovacao",
      message:
        "Confirme seu e-mail para concluir a solicitação e seguir para a aprovação administrativa.",
      perfil,
      solicitacao,
    };
  }

  if (solicitacao?.status === "rejeitado") {
    return {
      kind: "blocked",
      redirectTo: "/aguardando-aprovacao",
      message:
        solicitacao.motivo_rejeicao?.trim() ||
        "Sua solicitação foi rejeitada e o acesso está bloqueado.",
      perfil,
      solicitacao,
    };
  }

  if (solicitacao?.status === "expirado" || solicitacao?.bloqueado_em) {
    return {
      kind: "blocked",
      redirectTo: "/aguardando-aprovacao",
      message:
        "Seu acesso está bloqueado. Solicite uma nova análise ao responsável administrativo.",
      perfil,
      solicitacao,
    };
  }

  if (solicitacao?.status === "cancelado") {
    return {
      kind: "blocked",
      redirectTo: "/aguardando-aprovacao",
      message: "Sua solicitação foi cancelada e não possui acesso ativo.",
      perfil,
      solicitacao,
    };
  }

  if (
    solicitacao &&
    ["pendente_confirmacao_email", "pendente_aprovacao", "aprovado"].includes(
      solicitacao.status
    )
  ) {
    return {
      kind: "awaiting_approval",
      redirectTo: "/aguardando-aprovacao",
      message:
        solicitacao.status === "pendente_confirmacao_email"
          ? "Confirme o e-mail enviado para que a solicitação siga para aprovação administrativa."
          : "Seu cadastro foi recebido e aguarda aprovação administrativa para liberar o acesso operacional.",
      perfil,
      solicitacao,
    };
  }

  return {
    kind: "inconsistent",
    redirectTo: "/aguardando-aprovacao",
    message:
      "Seu usuário foi autenticado, mas ainda não há perfil operacional ativo vinculado. Entre em contato com a equipe responsável.",
    perfil,
    solicitacao,
  };
}

export async function resolverAcessoAutenticado() {
  return resolverAcessoAutenticadoComToken(await getSupabaseAccessToken());
}

export async function requirePerfilAutenticado() {
  const acesso = await resolverAcessoAutenticado();

  if (acesso.kind === "unauthenticated") {
    redirect("/login");
  }

  if (acesso.kind === "operational") {
    return {
      ...acesso.perfil,
      acesso_status: acesso.solicitacao?.status ?? null,
      acesso_expira_em: acesso.solicitacao?.expira_em ?? null,
    };
  }

  redirect("/aguardando-aprovacao");
}

export async function requireAdminOuGestor() {
  const perfil = await requirePerfilAutenticado();

  if (!podeAdministrarUsuarios(perfil.papel)) {
    redirect("/");
  }

  return perfil;
}

export const requireAdminUsuarios = requireAdminOuGestor;
