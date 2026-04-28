import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ACCESS_TOKEN_COOKIE } from "@/lib/supabase/constants";

const PUBLIC_PATHS = [
  "/login",
  "/cadastro",
  "/aguardando-aprovacao",
  "/politica-privacidade",
  "/termos-uso",
  "/brand",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicPath = PUBLIC_PATHS.some((path) => pathname.startsWith(path));
  const hasSession = Boolean(request.cookies.get(SUPABASE_ACCESS_TOKEN_COOKIE));

  if (!hasSession && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (hasSession && (pathname === "/login" || pathname === "/cadastro")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
