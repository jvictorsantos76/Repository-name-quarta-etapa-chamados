import { NextResponse } from "next/server";
import { resolverAcessoAutenticado } from "@/lib/supabase/server";

export async function GET() {
  const acesso = await resolverAcessoAutenticado();

  return NextResponse.json({
    kind: acesso.kind,
    redirectTo: acesso.redirectTo,
    message: acesso.message,
  });
}
