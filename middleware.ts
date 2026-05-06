import { NextResponse, type NextRequest } from "next/server";
import { createClient, type Session } from "@supabase/supabase-js";
import {
  SUPABASE_ACCESS_TOKEN_COOKIE,
  SUPABASE_REFRESH_TOKEN_COOKIE,
} from "@/lib/supabase/constants";

const PUBLIC_PATHS = [
  "/login",
  "/auth",
  "/cadastro",
  "/aguardando-aprovacao",
  "/politica-privacidade",
  "/termos-uso",
  "/brand",
];

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return null;
  }

  return { supabaseUrl, supabaseKey };
}

function createSupabaseAuthClient(accessToken?: string) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createClient(config.supabaseUrl, config.supabaseKey, {
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

function setSessionRequestCookies(request: NextRequest, session: Session) {
  request.cookies.set(SUPABASE_ACCESS_TOKEN_COOKIE, session.access_token);
  request.cookies.set(SUPABASE_REFRESH_TOKEN_COOKIE, session.refresh_token);
}

function setSessionResponseCookies(response: NextResponse, session: Session) {
  const secure = process.env.NODE_ENV === "production";
  const accessMaxAge = Math.max(session.expires_in ?? 3600, 60);
  const refreshMaxAge = 60 * 60 * 24 * 30;

  response.cookies.set(SUPABASE_ACCESS_TOKEN_COOKIE, session.access_token, {
    path: "/",
    maxAge: accessMaxAge,
    sameSite: "lax",
    secure,
  });

  response.cookies.set(SUPABASE_REFRESH_TOKEN_COOKIE, session.refresh_token, {
    path: "/",
    maxAge: refreshMaxAge,
    sameSite: "lax",
    secure,
  });
}

function clearSessionCookies(request: NextRequest, response: NextResponse) {
  const secure = process.env.NODE_ENV === "production";

  request.cookies.delete(SUPABASE_ACCESS_TOKEN_COOKIE);
  request.cookies.delete(SUPABASE_REFRESH_TOKEN_COOKIE);

  response.cookies.set(SUPABASE_ACCESS_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure,
  });

  response.cookies.set(SUPABASE_REFRESH_TOKEN_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure,
  });
}

async function validarOuRenovarSessao(
  accessToken: string,
  refreshToken: string | null
) {
  const supabase = createSupabaseAuthClient(accessToken);

  if (!supabase) {
    return { autenticado: false, session: null };
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(
    accessToken
  );

  if (!userError && userData.user) {
    return { autenticado: true, session: null };
  }

  if (!refreshToken) {
    return { autenticado: false, session: null };
  }

  const supabaseRefresh = createSupabaseAuthClient();

  if (!supabaseRefresh) {
    return { autenticado: false, session: null };
  }

  const { data, error } = await supabaseRefresh.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return { autenticado: false, session: null };
  }

  return { autenticado: true, session: data.session };
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const accessToken =
    request.cookies.get(SUPABASE_ACCESS_TOKEN_COOKIE)?.value ?? null;
  const refreshToken =
    request.cookies.get(SUPABASE_REFRESH_TOKEN_COOKIE)?.value ?? null;
  const isAuthEntryPath = pathname === "/login" || pathname === "/cadastro";

  if (!accessToken && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!accessToken || (isPublicPath && !isAuthEntryPath)) {
    return NextResponse.next();
  }

  const sessao = await validarOuRenovarSessao(
    accessToken,
    refreshToken
  );

  if (!sessao.autenticado) {
    const response = isPublicPath
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/login", request.url));

    clearSessionCookies(request, response);

    return response;
  }

  if (sessao.session) {
    setSessionRequestCookies(request, sessao.session);
  }

  const response = isAuthEntryPath
    ? NextResponse.redirect(new URL("/", request.url))
    : NextResponse.next({
        request: {
          headers: request.headers,
        },
      });

  if (sessao.session) {
    setSessionResponseCookies(response, sessao.session);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
