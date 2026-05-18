import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  CatalogoConfiguracaoClient,
  type CatalogoConfiguracaoItem,
} from "./CatalogoConfiguracaoClient";
import {
  type CatalogoChamadoKind,
} from "./catalogos-actions";

type CatalogoChamadosPageProps = {
  kind: Exclude<CatalogoChamadoKind, "status">;
  titulo: string;
  descricao: string;
  tabela: "chamado_tipos" | "chamado_origens" | "grupos_atendimento";
};

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find the table")
  );
}

export async function CatalogoChamadosPage({
  kind,
  titulo,
  descricao,
  tabela,
}: CatalogoChamadosPageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(tabela)
    .select("id, nome, descricao, ordem, ativo")
    .order("ordem")
    .order("nome");
  const itens = isSchemaCacheError(error?.message)
    ? []
    : (data as CatalogoConfiguracaoItem[] | null) ?? [];

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <CatalogoConfiguracaoClient
        kind={kind}
        titulo={titulo}
        descricao={descricao}
        itens={itens}
        erroCarregamento={
          error && !isSchemaCacheError(error.message)
            ? "Não foi possível carregar os registros."
            : null
        }
      />
    </main>
  );
}
