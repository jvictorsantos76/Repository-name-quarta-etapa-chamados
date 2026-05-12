import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import {
  createSupabaseAdminClient,
  createSupabasePublicServerClient,
  resolverAcessoAutenticadoComToken,
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

async function confirmarSolicitacaoEmail(session: Session) {
  const supabase = createSupabaseAdminClient();
  const agora = new Date().toISOString();
  const email = session.user.email?.trim().toLowerCase();

  if (!email) {
    return { ok: false };
  }

  const { data: solicitacao, error } = await supabase
    .from("solicitacoes_acesso")
    .select("id")
    .or(`user_id.eq.${session.user.id},auth_user_id.eq.${session.user.id},email.eq.${email}`)
    .in("status", ["pendente_confirmacao_email", "pendente_aprovacao"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !solicitacao) {
    return { ok: false };
  }

  const { error: erroAtualizacaoSolicitacao } = await supabase
    .from("solicitacoes_acesso")
    .update({
      status: "pendente_aprovacao",
      user_id: session.user.id,
      auth_user_id: session.user.id,
      email_confirmado_em: agora,
      erro_provisionamento: null,
    })
    .eq("id", solicitacao.id);

  if (erroAtualizacaoSolicitacao) {
    return { ok: false };
  }
  return { ok: true };
}

export async function GET(request: NextRequest) {
  const requestedType = request.nextUrl.searchParams.get("type");
  const hasCode = request.nextUrl.searchParams.has("code");
  const fallbackPath =
    requestedType === "recovery" || requestedType === "invite"
      ? "/auth/alterar-senha"
      : requestedType === "email"
        ? "/aguardando-aprovacao"
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
    await confirmarSolicitacaoEmail(session);
  }

  await setSupabaseSessionCookies(session);

  if (type === "recovery" || type === "invite") {
    return redirectTo(request, nextPath);
  }

  const acesso = await resolverAcessoAutenticadoComToken(session.access_token);

  if (acesso.kind === "operational") {
    return redirectTo(request, nextPath === "/" ? "/" : nextPath);
  }

  return redirectTo(request, acesso.redirectTo);
}
