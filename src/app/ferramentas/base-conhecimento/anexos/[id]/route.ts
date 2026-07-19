import { NextResponse, type NextRequest } from "next/server";
import { podeConsultarBaseConhecimento } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

const BUCKET_ANEXOS = "base-conhecimento-anexos";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  const perfil = await requirePerfilAutenticado();

  if (!podeConsultarBaseConhecimento(perfil.papel)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: anexo, error } = await supabase
    .from("base_conhecimento_anexos")
    .select("caminho_storage, nome_arquivo, tipo_mime")
    .eq("id", id)
    .eq("ativo", true)
    .single();

  if (error || !anexo) {
    return new NextResponse("Anexo não encontrado ou sem permissão de acesso.", {
      status: 404,
    });
  }

  const { data: urlAssinada, error: erroUrl } = await supabase.storage
    .from(BUCKET_ANEXOS)
    .createSignedUrl(anexo.caminho_storage as string, 60);

  if (erroUrl || !urlAssinada?.signedUrl) {
    return new NextResponse("Não foi possível gerar o link seguro do anexo.", {
      status: 500,
    });
  }

  if (request.nextUrl.searchParams.get("download") === "1") {
    const arquivo = await fetch(urlAssinada.signedUrl);
    if (!arquivo.ok || !arquivo.body) {
      return new NextResponse("Não foi possível baixar o anexo.", {
        status: 502,
      });
    }

    const nomeArquivo = String(anexo.nome_arquivo ?? "anexo").replace(/["\r\n]/g, "");
    return new NextResponse(arquivo.body, {
      headers: {
        "Content-Disposition": `attachment; filename="${nomeArquivo}"`,
        "Content-Type": String(anexo.tipo_mime ?? arquivo.headers.get("content-type") ?? "application/octet-stream"),
        "Cache-Control": "private, no-store",
      },
    });
  }

  return NextResponse.redirect(urlAssinada.signedUrl);
}
