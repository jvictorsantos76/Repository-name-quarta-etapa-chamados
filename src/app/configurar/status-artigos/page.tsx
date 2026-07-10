import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  StatusArtigosClient,
  type StatusArtigoListItem,
} from "./StatusArtigosClient";

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") ||
      message?.includes("Could not find") ||
      message?.includes("does not exist")
  );
}

async function contarReferencias(codigo: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { count } = await supabaseAdmin
    .from("bases_conhecimento")
    .select("id", { head: true, count: "exact" })
    .eq("status", codigo);

  return count ?? 0;
}

export default async function StatusArtigosPage() {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("base_conhecimento_status")
    .select(
      "id, codigo, nome, descricao, cor, ordem, ativo, eh_padrao, publica_artigo, arquiva_artigo"
    )
    .order("ordem")
    .order("nome");

  const itensBase =
    error && isSchemaCacheError(error.message)
      ? []
      : ((data as Omit<StatusArtigoListItem, "referencias">[] | null) ?? []);
  const itens = await Promise.all(
    itensBase.map(async (item) => ({
      ...item,
      referencias: await contarReferencias(item.codigo),
    }))
  );

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <StatusArtigosClient
        itens={itens}
        erroCarregamento={
          error && !isSchemaCacheError(error.message)
            ? "Não foi possível carregar os status de artigo."
            : null
        }
      />
    </main>
  );
}
