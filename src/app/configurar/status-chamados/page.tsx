import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  StatusChamadosClient,
  type StatusChamadoListItem,
} from "./StatusChamadosClient";

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find the table")
  );
}

async function contarReferencias(codigo: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const [chamados, historico] = await Promise.all([
    supabaseAdmin
      .from("chamados")
      .select("id", { head: true, count: "exact" })
      .eq("status", codigo),
    supabaseAdmin
      .from("historico_status")
      .select("id", { head: true, count: "exact" })
      .or(`status_anterior.eq.${codigo},status_novo.eq.${codigo}`),
  ]);

  return (chamados.count ?? 0) + (historico.count ?? 0);
}

export default async function StatusChamadosPage() {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chamado_status")
    .select("id, codigo, nome, descricao, cor, ordem, ativo, eh_padrao")
    .order("ordem")
    .order("nome");

  const itensBase =
    error && isSchemaCacheError(error.message)
      ? []
      : ((data as Omit<StatusChamadoListItem, "referencias">[] | null) ?? []);

  const itens: StatusChamadoListItem[] = await Promise.all(
    itensBase.map(async (item) => ({
      ...item,
      referencias: await contarReferencias(item.codigo),
    }))
  );

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <StatusChamadosClient
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
