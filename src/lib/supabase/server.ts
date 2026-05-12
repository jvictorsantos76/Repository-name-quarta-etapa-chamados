import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createClient,
  type Session,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import type { PerfilAutenticado } from "@/lib/auth/types";
import { isPapelUsuario, podeAdministrarUsuarios } from "@/lib/auth/permissions";
import {
  SUPABASE_ACCESS_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
} from "./constants";

const PERFIL_SELECT =
  "id, nome_completo, email, papel, ativo, telefone, avatar_url, biografia, cargo, cliente_id, loja_id, tema_preferido, cor_preferida, fonte_escala";
const TRIAGEM_CLIENTE_NOME = "Triagem de Acesso Temporario";
const TRIAGEM_LOJA_NOME = "Fila de Triagem";

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

type VinculoClienteLoja = {
  clienteId: string | null;
  lojaId: string | null;
  origem: "real" | "triagem";
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
      kind: "temporary";
      redirectTo: "/chamados/novo";
      message: string;
      perfil: PerfilAutenticado;
      solicitacao: SolicitacaoAcessoResumo;
    }
  | {
      kind: "awaiting_email" | "blocked" | "inconsistent";
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

async function calcularExpiracaoAcesso(agora: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin.rpc("calcular_expiracao_horas_uteis", {
    inicio: agora,
    horas_uteis: 72,
  });

  return typeof data === "string"
    ? data
    : new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
}

async function garantirVinculoTriagem() {
  const supabaseAdmin = createSupabaseAdminClient();
  let clienteId =
    (
      await supabaseAdmin
        .from("clientes")
        .select("id")
        .eq("nome_fantasia", TRIAGEM_CLIENTE_NOME)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle()
    ).data?.id ?? null;

  if (!clienteId) {
    const { data } = await supabaseAdmin
      .from("clientes")
      .insert({
        nome_fantasia: TRIAGEM_CLIENTE_NOME,
        razao_social: TRIAGEM_CLIENTE_NOME,
        ativo: true,
      })
      .select("id")
      .single();
    clienteId = data?.id ?? null;
  }

  if (!clienteId) {
    return null;
  }

  let lojaId =
    (
      await supabaseAdmin
        .from("lojas")
        .select("id")
        .eq("cliente_id", clienteId)
        .eq("nome_loja", TRIAGEM_LOJA_NOME)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle()
    ).data?.id ?? null;

  if (!lojaId) {
    const { data } = await supabaseAdmin
      .from("lojas")
      .insert({
        cliente_id: clienteId,
        nome_loja: TRIAGEM_LOJA_NOME,
        cidade: "Fortaleza",
        estado: "CE",
        ativo: true,
      })
      .select("id")
      .single();
    lojaId = data?.id ?? null;
  }

  if (!lojaId) {
    return null;
  }

  return {
    clienteId,
    lojaId,
    origem: "triagem" as const,
  };
}

export async function resolverVinculoClienteLoja(input: {
  cnpj?: string | null;
  empresa?: string | null;
  lojaUnidade?: string | null;
}) {
  const supabaseAdmin = createSupabaseAdminClient();
  const cnpj = input.cnpj?.trim() || null;
  const empresa = input.empresa?.trim() || null;
  const lojaUnidade = input.lojaUnidade?.trim() || null;

  const clientePorCnpj = cnpj
    ? await supabaseAdmin
        .from("clientes")
        .select("id")
        .eq("cnpj", cnpj)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle()
    : { data: null };
  const clientePorNome =
    !clientePorCnpj.data && empresa
      ? await supabaseAdmin
          .from("clientes")
          .select("id")
          .ilike("nome_fantasia", empresa)
          .eq("ativo", true)
          .limit(1)
          .maybeSingle()
      : { data: null };
  const clienteId = clientePorCnpj.data?.id ?? clientePorNome.data?.id ?? null;

  if (clienteId && lojaUnidade) {
    const { data: loja } = await supabaseAdmin
      .from("lojas")
      .select("id")
      .eq("cliente_id", clienteId)
      .ilike("nome_loja", lojaUnidade)
      .eq("ativo", true)
      .limit(1)
      .maybeSingle();

    if (loja?.id) {
      return {
        clienteId,
        lojaId: loja.id,
        origem: "real" as const,
      } satisfies VinculoClienteLoja;
    }
  }

  const vinculoTriagem = await garantirVinculoTriagem();

  return (
    vinculoTriagem ?? {
      clienteId,
      lojaId: null,
      origem: "triagem" as const,
    }
  );
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

async function reconciliarSolicitacaoTemporaria(user: User) {
  const email = user.email?.trim().toLowerCase() ?? null;

  if (!email || !user.email_confirmed_at) {
    return null;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const solicitacao = await buscarSolicitacaoPorUsuario(user.id, email);

  if (
    !solicitacao ||
    ["rejeitado", "expirado", "cancelado", "aprovado"].includes(
      solicitacao.status
    )
  ) {
    return solicitacao;
  }

  const vinculo = await resolverVinculoClienteLoja({
    cnpj: solicitacao.cnpj,
    empresa: solicitacao.empresa,
    lojaUnidade: solicitacao.loja_unidade,
  });
  const agora = new Date().toISOString();
  const expiraEm = await calcularExpiracaoAcesso(agora);

  await supabaseAdmin
    .from("solicitacoes_acesso")
    .update({
      status: "pendente_aprovacao",
      user_id: user.id,
      auth_user_id: user.id,
      perfil_id: user.id,
      email_confirmado_em: solicitacao.email_confirmado_em ?? agora,
      expira_em: expiraEm,
      cliente_id: vinculo.clienteId,
      loja_id: vinculo.lojaId,
      bloqueado_em: null,
      erro_provisionamento: null,
    })
    .eq("id", solicitacao.id);

  await supabaseAdmin.from("perfis").upsert({
    id: user.id,
    nome_completo:
      solicitacao.nome_completo ||
      String(user.user_metadata?.nome_completo ?? email),
    email,
    telefone: solicitacao.telefone,
    papel: "solicitante",
    ativo: true,
    cargo: solicitacao.cargo,
    cliente_id: vinculo.clienteId,
    loja_id: vinculo.lojaId,
  });

  await supabaseAdmin
    .from("aceites_legais")
    .update({
      perfil_id: user.id,
    })
    .eq("solicitacao_acesso_id", solicitacao.id)
    .is("perfil_id", null);

  return await buscarSolicitacaoPorUsuario(user.id, email);
}

function acessoTemporarioAtivo(
  perfil: PerfilAutenticado | null,
  solicitacao: SolicitacaoAcessoResumo | null
) {
  return Boolean(
    perfil &&
      perfil.papel === "solicitante" &&
      solicitacao?.status === "pendente_aprovacao" &&
      solicitacao.email_confirmado_em &&
      solicitacao.expira_em &&
      solicitacao.cliente_id &&
      solicitacao.loja_id &&
      !solicitacao.bloqueado_em &&
      new Date(solicitacao.expira_em).getTime() > Date.now()
  );
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
  await bloquearSolicitacaoExpirada(user.id);

  let solicitacao = await buscarSolicitacaoPorUsuario(
    user.id,
    user.email?.trim().toLowerCase() ?? null
  );
  let perfil = await buscarPerfilAtivoPorId(user.id);

  const precisaReconciliar =
    Boolean(user.email_confirmed_at) &&
    solicitacao &&
    ["pendente_confirmacao_email", "pendente_aprovacao"].includes(
      solicitacao.status
    ) &&
    (!perfil ||
      perfil.papel === "solicitante" ||
      !solicitacao.email_confirmado_em ||
      !solicitacao.expira_em ||
      !solicitacao.cliente_id ||
      !solicitacao.loja_id);

  if (precisaReconciliar) {
    solicitacao = await reconciliarSolicitacaoTemporaria(user);
    perfil = await buscarPerfilAtivoPorId(user.id);
  }

  if (perfil && perfil.papel !== "solicitante") {
    return {
      kind: "operational",
      redirectTo: "/",
      message: "Acesso operacional liberado.",
      perfil,
      solicitacao,
    };
  }

  if (acessoTemporarioAtivo(perfil, solicitacao)) {
    return {
      kind: "temporary",
      redirectTo: "/chamados/novo",
      message: "Acesso temporário ativo para abertura de chamados.",
      perfil: perfil as PerfilAutenticado,
      solicitacao: solicitacao as SolicitacaoAcessoResumo,
    };
  }

  if (!user.email_confirmed_at) {
    return {
      kind: "awaiting_email",
      redirectTo: "/aguardando-aprovacao",
      message:
        "Confirme seu e-mail para liberar o acesso temporário de 72 horas úteis.",
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
        "Seu acesso temporário expirou após 72 horas úteis sem aprovação definitiva.",
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

  return {
    kind: "inconsistent",
    redirectTo: "/aguardando-aprovacao",
    message:
      "Seu usuário foi autenticado, mas o acesso temporário ainda não pôde ser conciliado. Entre novamente ou contate o suporte.",
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

  if (acesso.kind === "operational" || acesso.kind === "temporary") {
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
