import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import {
  clearSupabaseSessionCookies,
  createSupabaseAdminClient,
  createSupabasePublicServerClient,
  setSupabaseSessionCookies,
} from "@/lib/supabase/server";

const tiposOtpPermitidos = new Set(["email", "invite", "recovery", "magiclink"]);

function getSafeNextPath(value: string | null, fallback = "/") {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

function redirectTo(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

async function getSessionFromRequest(request: NextRequest) {
  const supabase = createSupabasePublicServerClient();
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    return { session: data.session, error, type };
  }

  if (!tokenHash || !type || !tiposOtpPermitidos.has(type)) {
    return {
      session: null,
      error: new Error("Link de autenticação inválido."),
    };
  }

  const { data, error } = await supabase.auth.verifyOtp({
    token_hash: tokenHash,
    type: type as EmailOtpType,
  });

  return { session: data.session, error, type };
}

async function hasPerfilAtivo(session: Session) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("perfis")
    .select("id")
    .eq("id", session.user.id)
    .eq("ativo", true)
    .maybeSingle();

  return !error && Boolean(data);
}

async function confirmarSolicitacaoEmail(session: Session) {
  const supabase = createSupabaseAdminClient();
  const agora = new Date().toISOString();
  const email = session.user.email?.trim().toLowerCase();

  if (!email) {
    return { ok: false };
  }

  const { data: solicitacao, error } = await supabase
    .from("solicitacoes_acesso")
    .select("id, nome_completo, email, telefone, cargo, status, cliente_id, loja_id")
    .or(`user_id.eq.${session.user.id},auth_user_id.eq.${session.user.id},email.eq.${email}`)
    .in("status", ["pendente_confirmacao_email", "pendente_aprovacao"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !solicitacao) {
    return { ok: false };
  }

  const { data: expiracao } = await supabase.rpc(
    "calcular_expiracao_horas_uteis",
    {
      inicio: agora,
      horas_uteis: 72,
    }
  );

  const expiraEm =
    typeof expiracao === "string"
      ? expiracao
      : new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();

  const { error: erroAtualizacaoSolicitacao } = await supabase
    .from("solicitacoes_acesso")
    .update({
      status: "pendente_aprovacao",
      user_id: session.user.id,
      auth_user_id: session.user.id,
      perfil_id: session.user.id,
      email_confirmado_em: agora,
      expira_em: expiraEm,
      bloqueado_em: null,
      erro_provisionamento: null,
    })
    .eq("id", solicitacao.id);

  if (erroAtualizacaoSolicitacao) {
    return { ok: false };
  }

  const { error: erroPerfil } = await supabase.from("perfis").upsert({
    id: session.user.id,
    nome_completo: solicitacao.nome_completo,
    email,
    telefone: solicitacao.telefone,
    papel: "solicitante",
    ativo: true,
    cargo: solicitacao.cargo,
    cliente_id: solicitacao.cliente_id,
    loja_id: solicitacao.loja_id,
  });

  if (erroPerfil) {
    return { ok: false };
  }

  const { error: erroAceites } = await supabase
    .from("aceites_legais")
    .update({
      perfil_id: session.user.id,
    })
    .eq("solicitacao_acesso_id", solicitacao.id)
    .is("perfil_id", null);

  return { ok: !erroAceites };
}

export async function GET(request: NextRequest) {
  const requestedType = request.nextUrl.searchParams.get("type");
  const hasCode = request.nextUrl.searchParams.has("code");
  const fallbackPath =
    requestedType === "recovery" || requestedType === "invite"
      ? "/auth/alterar-senha"
      : requestedType === "email"
        ? "/chamados/novo"
      : "/";
  const nextPath = getSafeNextPath(
    request.nextUrl.searchParams.get("next"),
    fallbackPath
  );
  const { session, error, type } = await getSessionFromRequest(request);

  if (error || !session) {
    return redirectTo(request, "/login");
  }

  const isEmailConfirmation = type === "email";
  const isPkceSemTipo = !type && hasCode;

  if (isEmailConfirmation || isPkceSemTipo) {
    const confirmacaoOperacional = await confirmarSolicitacaoEmail(session);

    if (confirmacaoOperacional.ok) {
      await setSupabaseSessionCookies(session);
      return redirectTo(request, "/chamados/novo");
    }

    if (isEmailConfirmation) {
      await clearSupabaseSessionCookies();
      return redirectTo(request, "/login");
    }

    if (isPkceSemTipo) {
      const autorizado = await hasPerfilAtivo(session);

      if (!autorizado) {
        await setSupabaseSessionCookies(session);
        return redirectTo(request, "/aguardando-aprovacao");
      }

      await setSupabaseSessionCookies(session);
      return redirectTo(request, nextPath);
    }
  }

  await setSupabaseSessionCookies(session);

  if (type === "recovery" || type === "invite") {
    return redirectTo(request, nextPath);
  }

  const autorizado = await hasPerfilAtivo(session);

  if (!autorizado) {
    return redirectTo(request, "/aguardando-aprovacao");
  }

  return redirectTo(request, nextPath);
}
