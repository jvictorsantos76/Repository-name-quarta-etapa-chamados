import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  requireAdminOuGestor,
} from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type SolicitacaoAcesso = {
  id: string;
  nome_completo: string;
  email: string;
  empresa: string;
  cnpj: string | null;
  status: string;
  created_at: string;
  auth_user_id: string | null;
  perfil_id: string | null;
  provisionado_em: string | null;
  erro_provisionamento: string | null;
  link_acesso_manual: string | null;
  link_acesso_manual_gerado_em: string | null;
};

function getBaseUrl(headersList: Headers) {
  const origin = headersList.get("origin");

  if (origin) {
    return origin;
  }

  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";

  return host ? `${proto}://${host}` : "http://localhost:3000";
}

function getAuthConfirmUrl(headersList: Headers) {
  return `${getBaseUrl(headersList)}/auth/confirm?next=/auth/alterar-senha`;
}

async function buscarUsuarioAuthPorEmail(email: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const emailNormalizado = email.trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 100,
    });

    if (error) {
      return { user: null, error };
    }

    const user = data.users.find(
      (usuario) => usuario.email?.toLowerCase() === emailNormalizado
    );

    if (user) {
      return { user, error: null };
    }

    if (data.users.length < 100) {
      break;
    }
  }

  return { user: null, error: null };
}

async function convidarOuLocalizarUsuario(
  email: string,
  nomeCompleto: string,
  redirectTo: string
): Promise<{
  user: User | null;
  errorMessage: string | null;
  linkAcessoManual: string | null;
}> {
  const supabaseAdmin = createSupabaseAdminClient();
  const emailNormalizado = email.trim().toLowerCase();
  const gerarLinkAcessoManual = async (tipoLink: "invite" | "magiclink") => {
    const { data: dadosLink, error: erroLink } =
      await supabaseAdmin.auth.admin.generateLink({
        type: tipoLink,
        email: emailNormalizado,
        options: {
          redirectTo,
          data: {
            nome_completo: nomeCompleto,
          },
        },
      });

    return {
      user: dadosLink.user,
      error: erroLink,
      linkAcessoManual: dadosLink.properties?.action_link ?? null,
    };
  };

  const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(
    emailNormalizado,
    {
      redirectTo,
      data: {
        nome_completo: nomeCompleto,
      },
    }
  );

  if (!error && data.user) {
    const linkManual = await gerarLinkAcessoManual("magiclink");

    return {
      user: data.user,
      errorMessage: null,
      linkAcessoManual: linkManual.linkAcessoManual,
    };
  }

  const usuarioExistente = await buscarUsuarioAuthPorEmail(email);

  if (usuarioExistente.error) {
    return {
      user: null,
      errorMessage: usuarioExistente.error.message,
      linkAcessoManual: null,
    };
  }

  const tipoLink = usuarioExistente.user ? "magiclink" : "invite";
  const linkManual = await gerarLinkAcessoManual(tipoLink);

  if (!linkManual.error && linkManual.user && linkManual.linkAcessoManual) {
    return {
      user: linkManual.user,
      errorMessage: null,
      linkAcessoManual: linkManual.linkAcessoManual,
    };
  }

  return {
    user: null,
    errorMessage:
      linkManual.error?.message ??
      error?.message ??
      "Não foi possível enviar o convite.",
    linkAcessoManual: null,
  };
}

async function atualizarSolicitacao(formData: FormData) {
  "use server";

  const perfil = await requireAdminOuGestor();
  const supabase = await createSupabaseServerClient();

  const id = String(formData.get("id") ?? "");
  const acao = String(formData.get("acao") ?? "");

  if (!id || (acao !== "aprovado" && acao !== "rejeitado")) {
    return;
  }

  if (acao === "rejeitado") {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        status: "rejeitado",
        rejeitado_por: perfil.id,
        rejeitado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pendente_aprovacao");

    revalidatePath("/admin/usuarios");
    return;
  }

  const { data: solicitacao, error: erroSolicitacao } = await supabase
    .from("solicitacoes_acesso")
    .select(
      "id, nome_completo, email, status, auth_user_id, perfil_id, provisionado_em, erro_provisionamento"
    )
    .eq("id", id)
    .maybeSingle();

  if (erroSolicitacao || !solicitacao) {
    revalidatePath("/admin/usuarios");
    return;
  }

  const provisionado = Boolean(
    solicitacao.auth_user_id &&
      solicitacao.perfil_id &&
      solicitacao.provisionado_em
  );
  const podeProvisionar =
    solicitacao.status === "pendente_aprovacao" ||
    (solicitacao.status === "aprovado" && !provisionado);

  if (!podeProvisionar) {
    revalidatePath("/admin/usuarios");
    return;
  }

  if (provisionado) {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        status: "aprovado",
        aprovado_por: perfil.id,
        aprovado_em: new Date().toISOString(),
        erro_provisionamento: null,
      })
      .eq("id", id);

    revalidatePath("/admin/usuarios");
    return;
  }

  const headersList = await headers();
  const redirectTo = getAuthConfirmUrl(headersList);
  const resultadoConvite = await convidarOuLocalizarUsuario(
    solicitacao.email,
    solicitacao.nome_completo,
    redirectTo
  );

  if (!resultadoConvite.user) {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        erro_provisionamento: resultadoConvite.errorMessage,
        link_acesso_manual: null,
        link_acesso_manual_gerado_em: null,
      })
      .eq("id", id);

    revalidatePath("/admin/usuarios");
    return;
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error: erroPerfil } = await supabaseAdmin.from("perfis").upsert({
    id: resultadoConvite.user.id,
    nome_completo: solicitacao.nome_completo,
    email: solicitacao.email.trim().toLowerCase(),
    papel: "operador",
    ativo: true,
  });

  if (erroPerfil) {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        auth_user_id: resultadoConvite.user.id,
        erro_provisionamento: erroPerfil.message,
        link_acesso_manual: null,
        link_acesso_manual_gerado_em: null,
      })
      .eq("id", id);

    revalidatePath("/admin/usuarios");
    return;
  }

  const agora = new Date().toISOString();

  await supabase
    .from("solicitacoes_acesso")
    .update({
      status: "aprovado",
      aprovado_por: perfil.id,
      aprovado_em: agora,
      auth_user_id: resultadoConvite.user.id,
      perfil_id: resultadoConvite.user.id,
      provisionado_em: agora,
      erro_provisionamento: null,
      link_acesso_manual: resultadoConvite.linkAcessoManual,
      link_acesso_manual_gerado_em: resultadoConvite.linkAcessoManual
        ? agora
        : null,
    })
    .eq("id", id);

  await supabaseAdmin
    .from("aceites_legais")
    .update({
      perfil_id: resultadoConvite.user.id,
    })
    .eq("solicitacao_acesso_id", id)
    .is("perfil_id", null);

  revalidatePath("/admin/usuarios");
}

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function solicitacaoProvisionada(solicitacao: SolicitacaoAcesso) {
  return Boolean(
    solicitacao.auth_user_id &&
      solicitacao.perfil_id &&
      solicitacao.provisionado_em
  );
}

function podeProvisionarSolicitacao(solicitacao: SolicitacaoAcesso) {
  return (
    solicitacao.status === "pendente_aprovacao" ||
    (solicitacao.status === "aprovado" && !solicitacaoProvisionada(solicitacao))
  );
}

function getLabelAcaoProvisionamento(solicitacao: SolicitacaoAcesso) {
  if (solicitacao.erro_provisionamento) {
    return "Tentar novamente";
  }

  if (solicitacao.status === "aprovado" && !solicitacaoProvisionada(solicitacao)) {
    return "Provisionar convite";
  }

  return "Aprovar e convidar";
}

export default async function AdminUsuariosPage() {
  await requireAdminOuGestor();
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("solicitacoes_acesso")
    .select(
      "id, nome_completo, email, empresa, cnpj, status, created_at, auth_user_id, perfil_id, provisionado_em, erro_provisionamento, link_acesso_manual, link_acesso_manual_gerado_em"
    )
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
            Aprovar cria ou localiza o usuário Auth, envia convite ou link
            mágico, cria o perfil operacional operador e mantém a solicitação
            rastreável.
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
                  <th className="px-4 py-3">Provisionamento</th>
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
                      {solicitacaoProvisionada(solicitacao) ? (
                        <div className="space-y-2">
                          <span className="block font-semibold text-green-700">
                            Acesso provisionado
                          </span>
                          {solicitacao.link_acesso_manual && (
                            <a
                              href={solicitacao.link_acesso_manual}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex rounded-lg bg-blue-700 px-3 py-1 text-xs font-semibold text-white hover:bg-blue-800"
                            >
                              Abrir link manual
                            </a>
                          )}
                        </div>
                      ) : solicitacao.erro_provisionamento ? (
                        <span className="text-red-700">
                          {solicitacao.erro_provisionamento}
                        </span>
                      ) : solicitacao.status === "aprovado" ? (
                        <span className="font-semibold text-amber-700">
                          Aprovado sem provisionamento
                        </span>
                      ) : (
                        <span className="text-gray-500">Pendente</span>
                      )}
                    </td>
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
                            disabled={!podeProvisionarSolicitacao(solicitacao)}
                            className="rounded-lg bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {getLabelAcaoProvisionamento(solicitacao)}
                          </button>
                        </form>
                        <form action={atualizarSolicitacao}>
                          <input type="hidden" name="id" value={solicitacao.id} />
                          <input type="hidden" name="acao" value="rejeitado" />
                          <button
                            type="submit"
                            disabled={solicitacao.status !== "pendente_aprovacao"}
                            className="rounded-lg bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
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
