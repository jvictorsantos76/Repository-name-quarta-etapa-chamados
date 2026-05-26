import { NextResponse } from "next/server";
import { resolverAcessoAutenticado } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const acesso = await resolverAcessoAutenticado();

  return NextResponse.json({
    kind: acesso.kind,
    redirectTo: acesso.redirectTo,
    message: acesso.message,
  });
}
