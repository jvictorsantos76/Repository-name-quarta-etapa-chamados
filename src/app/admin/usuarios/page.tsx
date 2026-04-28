import { revalidatePath } from "next/cache";
import Link from "next/link";
import {
  createSupabaseServerClient,
  requireAdminOuGestor,
} from "@/lib/supabase/server";

type SolicitacaoAcesso = {
  id: string;
  nome_completo: string;
  email: string;
  empresa: string;
  cnpj: string | null;
  status: string;
  created_at: string;
};

async function atualizarSolicitacao(formData: FormData) {
  "use server";

  const perfil = await requireAdminOuGestor();
  const supabase = await createSupabaseServerClient();

  const id = String(formData.get("id") ?? "");
  const acao = String(formData.get("acao") ?? "");

  if (!id || (acao !== "aprovado" && acao !== "rejeitado")) {
    return;
  }

  const payload =
    acao === "aprovado"
      ? {
          status: "aprovado",
          aprovado_por: perfil.id,
          aprovado_em: new Date().toISOString(),
        }
      : {
          status: "rejeitado",
          rejeitado_por: perfil.id,
          rejeitado_em: new Date().toISOString(),
        };

  await supabase.from("solicitacoes_acesso").update(payload).eq("id", id);
  revalidatePath("/admin/usuarios");
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

export default async function AdminUsuariosPage() {
  await requireAdminOuGestor();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("solicitacoes_acesso")
    .select("id, nome_completo, email, empresa, cnpj, status, created_at")
    .order("created_at", { ascending: false });

  const solicitacoes = (data as SolicitacaoAcesso[] | null) ?? [];

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            Voltar para chamados
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Administração
          </p>
          <h1 className="mt-2 text-2xl font-bold">Solicitações de acesso</h1>
          <p className="mt-2 text-sm text-gray-600">
            Aprovar ou rejeitar aqui altera apenas o status da solicitação. A
            criação do perfil operacional deve ser feita de forma validada.
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Não foi possível carregar as solicitações.
            </div>
          )}

          <div className="mt-6 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">CNPJ</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Criado em</th>
                  <th className="px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {solicitacoes.map((solicitacao) => (
                  <tr key={solicitacao.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3 font-semibold">
                      {solicitacao.nome_completo}
                    </td>
                    <td className="px-4 py-3">{solicitacao.email}</td>
                    <td className="px-4 py-3">{solicitacao.empresa}</td>
                    <td className="px-4 py-3">{solicitacao.cnpj ?? "-"}</td>
                    <td className="px-4 py-3">{solicitacao.status}</td>
                    <td className="px-4 py-3">
                      {formatarData(solicitacao.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <form action={atualizarSolicitacao}>
                          <input type="hidden" name="id" value={solicitacao.id} />
                          <input type="hidden" name="acao" value="aprovado" />
                          <button
                            type="submit"
                            className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800"
                          >
                            Aprovar
                          </button>
                        </form>
                        <form action={atualizarSolicitacao}>
                          <input type="hidden" name="id" value={solicitacao.id} />
                          <input type="hidden" name="acao" value="rejeitado" />
                          <button
                            type="submit"
                            className="rounded-lg bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800"
                          >
                            Rejeitar
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {solicitacoes.length === 0 && !error && (
              <p className="mt-4 text-sm text-gray-600">
                Nenhuma solicitação registrada.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
