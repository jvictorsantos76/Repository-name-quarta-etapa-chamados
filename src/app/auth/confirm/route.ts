import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType, Session } from "@supabase/supabase-js";
import {
  createSupabaseAdminClient,
  createSupabasePublicServerClient,
  setSupabaseSessionCookies,
} from "@/lib/supabase/server";

const tiposOtpPermitidos = new Set(["email", "invite", "recovery"]);

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

export async function GET(request: NextRequest) {
  const requestedType = request.nextUrl.searchParams.get("type");
  const fallbackPath =
    requestedType === "recovery" || requestedType === "invite"
      ? "/auth/alterar-senha"
      : "/";
  const nextPath = getSafeNextPath(
    request.nextUrl.searchParams.get("next"),
    fallbackPath
  );
  const { session, error, type } = await getSessionFromRequest(request);

  if (error || !session) {
    return redirectTo(request, "/login");
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
