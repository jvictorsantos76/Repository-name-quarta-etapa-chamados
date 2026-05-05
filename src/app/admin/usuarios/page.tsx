import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import Link from "next/link";
import {
  createSupabaseAdminClient,
  createSupabaseServerClient,
  requireAdminUsuarios,
} from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";
import type { PapelUsuario } from "@/lib/auth/types";
import {
  LABEL_PAPEL_USUARIO,
  PAPEIS_PROVISIONAMENTO,
  isPapelUsuario,
} from "@/lib/auth/permissions";
import { SOLICITACOES_ACESSO_PAGE_VERSION } from "@/config/version";
import { AppHeader } from "@/components/AppHeader";

type SolicitacaoAcesso = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  empresa: string;
  cnpj: string | null;
  loja_unidade: string | null;
  cargo: string | null;
  status: string;
  nivel_acesso: PapelUsuario | null;
  motivo_rejeicao: string | null;
  created_at: string;
  expira_em: string | null;
  aprovado_por: string | null;
  aprovado_em: string | null;
  rejeitado_por: string | null;
  rejeitado_em: string | null;
  auth_user_id: string | null;
  perfil_id: string | null;
  provisionado_em: string | null;
  erro_provisionamento: string | null;
  status_provisionamento: string | null;
  provisionamento_tentado_em: string | null;
  convite_reenviado_em: string | null;
  link_acesso_manual: string | null;
  link_acesso_manual_gerado_em: string | null;
};

type PerfilResponsavel = {
  id: string;
  nome_completo: string;
};

type Cliente = {
  id: string;
  nome_fantasia: string;
};

type Loja = {
  id: string;
  nome_loja: string;
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  aprovado: "Aprovado",
  provisionado: "Provisionado",
  rejeitado: "Rejeitado",
  expirado: "Expirado",
  erro_envio_convite: "Erro no convite",
};

const STATUS_PROVISIONAMENTO_LABEL: Record<string, string> = {
  nao_iniciado: "Não iniciado",
  pendente: "Pendente",
  provisionado: "Provisionado",
  erro_envio_convite: "Erro no convite",
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

async function marcarSolicitacoesExpiradas() {
  const supabase = await createSupabaseServerClient();

  await supabase
    .from("solicitacoes_acesso")
    .update({
      status: "expirado",
      status_provisionamento: "nao_iniciado",
    })
    .eq("status", "pendente")
    .lt("expira_em", new Date().toISOString());
}

async function atualizarSolicitacao(formData: FormData) {
  "use server";

  const perfil = await requireAdminUsuarios();
  const supabase = await createSupabaseServerClient();
  const supabaseAdmin = createSupabaseAdminClient();

  await marcarSolicitacoesExpiradas();

  const id = String(formData.get("id") ?? "");
  const acao = String(formData.get("acao") ?? "");
  const agora = new Date().toISOString();

  if (!id || (acao !== "aprovar" && acao !== "rejeitar")) {
    return;
  }

  if (acao === "rejeitar") {
    const motivoRejeicao = String(formData.get("motivo_rejeicao") ?? "").trim();

    if (!motivoRejeicao) {
      await supabase
        .from("solicitacoes_acesso")
        .update({
          erro_provisionamento: "Informe o motivo obrigatório da rejeição.",
        })
        .eq("id", id)
        .eq("status", "pendente");

      revalidatePath("/admin/usuarios");
      return;
    }

    await supabase
      .from("solicitacoes_acesso")
      .update({
        status: "rejeitado",
        motivo_rejeicao: motivoRejeicao,
        rejeitado_por: perfil.id,
        rejeitado_em: agora,
        status_provisionamento: "nao_iniciado",
        erro_provisionamento: null,
      })
      .eq("id", id)
      .eq("status", "pendente");

    revalidatePath("/admin/usuarios");
    return;
  }

  const nivelAcesso = String(formData.get("nivel_acesso") ?? "");
  const clienteId = String(formData.get("cliente_id") ?? "") || null;
  const lojaId = String(formData.get("loja_id") ?? "") || null;
  const cargoAprovado = String(formData.get("cargo") ?? "").trim();

  if (
    !isPapelUsuario(nivelAcesso) ||
    !PAPEIS_PROVISIONAMENTO.includes(nivelAcesso)
  ) {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        erro_provisionamento:
          "Defina um nível de acesso válido antes de aprovar.",
      })
      .eq("id", id);

    revalidatePath("/admin/usuarios");
    return;
  }

  if ((nivelAcesso === "cliente" || nivelAcesso === "solicitante") && !clienteId) {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        erro_provisionamento:
          "Informe o cliente antes de provisionar cliente ou solicitante.",
      })
      .eq("id", id);

    revalidatePath("/admin/usuarios");
    return;
  }

  const { data: solicitacao, error: erroSolicitacao } = await supabase
    .from("solicitacoes_acesso")
    .select(
      "id, nome_completo, email, telefone, cargo, status, expira_em, auth_user_id, perfil_id, provisionado_em, erro_provisionamento"
    )
    .eq("id", id)
    .maybeSingle();

  if (erroSolicitacao || !solicitacao) {
    revalidatePath("/admin/usuarios");
    return;
  }

  if (
    solicitacao.status === "expirado" ||
    (solicitacao.expira_em && new Date(solicitacao.expira_em) < new Date())
  ) {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        status: "expirado",
        erro_provisionamento:
          "Solicitação expirada. Registre nova solicitação para aprovar o acesso.",
      })
      .eq("id", id);

    revalidatePath("/admin/usuarios");
    return;
  }

  const podeProvisionar =
    solicitacao.status === "pendente" ||
    solicitacao.status === "aprovado" ||
    solicitacao.status === "erro_envio_convite";

  if (!podeProvisionar) {
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

  await supabase
    .from("solicitacoes_acesso")
    .update({
      nivel_acesso: nivelAcesso,
      aprovado_por: perfil.id,
      aprovado_em: agora,
      provisionamento_tentado_em: agora,
      convite_reenviado_em:
        solicitacao.status === "erro_envio_convite" ? agora : null,
      status_provisionamento: "pendente",
    })
    .eq("id", id);

  if (!resultadoConvite.user) {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        status: "erro_envio_convite",
        erro_provisionamento: resultadoConvite.errorMessage,
        status_provisionamento: "erro_envio_convite",
        link_acesso_manual: null,
        link_acesso_manual_gerado_em: null,
      })
      .eq("id", id);

    revalidatePath("/admin/usuarios");
    return;
  }

  const { error: erroPerfil } = await supabaseAdmin.from("perfis").upsert({
    id: resultadoConvite.user.id,
    nome_completo: solicitacao.nome_completo,
    email: solicitacao.email.trim().toLowerCase(),
    telefone: solicitacao.telefone,
    papel: nivelAcesso,
    ativo: true,
    cargo: cargoAprovado || solicitacao.cargo,
    cliente_id: clienteId,
    loja_id: lojaId,
  });

  if (erroPerfil) {
    await supabase
      .from("solicitacoes_acesso")
      .update({
        status: "aprovado",
        auth_user_id: resultadoConvite.user.id,
        erro_provisionamento: erroPerfil.message,
        status_provisionamento: "erro_envio_convite",
        link_acesso_manual: null,
        link_acesso_manual_gerado_em: null,
      })
      .eq("id", id);

    revalidatePath("/admin/usuarios");
    return;
  }

  await supabase
    .from("solicitacoes_acesso")
    .update({
      status: "provisionado",
      aprovado_por: perfil.id,
      aprovado_em: agora,
      auth_user_id: resultadoConvite.user.id,
      perfil_id: resultadoConvite.user.id,
      provisionado_em: agora,
      erro_provisionamento: null,
      status_provisionamento: "provisionado",
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

function formatarData(data: string | null) {
  if (!data) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarTempoRestante(expiraEm: string | null, status: string) {
  if (!expiraEm) {
    return "-";
  }

  if (status === "expirado") {
    return "Expirada";
  }

  const diferencaMs = new Date(expiraEm).getTime() - Date.now();

  if (diferencaMs <= 0) {
    return "Expirada";
  }

  const horas = Math.floor(diferencaMs / (1000 * 60 * 60));
  const dias = Math.floor(horas / 24);
  const horasRestantes = horas % 24;

  return dias > 0 ? `${dias}d ${horasRestantes}h` : `${horasRestantes}h`;
}

function getNomeResponsavel(
  id: string | null,
  responsaveis: Map<string, string>
) {
  return id ? responsaveis.get(id) ?? "Perfil não localizado" : "-";
}

function podeAprovar(solicitacao: SolicitacaoAcesso) {
  return ["pendente", "aprovado", "erro_envio_convite"].includes(
    solicitacao.status
  );
}

export default async function AdminUsuariosPage() {
  const perfilAtual = await requireAdminUsuarios();
  await marcarSolicitacoesExpiradas();
  const supabase = await createSupabaseServerClient();

  const [{ data, error }, clientesResposta, lojasResposta] = await Promise.all([
    supabase
      .from("solicitacoes_acesso")
      .select(
        "id, nome_completo, email, telefone, empresa, cnpj, loja_unidade, cargo, status, nivel_acesso, motivo_rejeicao, created_at, expira_em, aprovado_por, aprovado_em, rejeitado_por, rejeitado_em, auth_user_id, perfil_id, provisionado_em, erro_provisionamento, status_provisionamento, provisionamento_tentado_em, convite_reenviado_em, link_acesso_manual, link_acesso_manual_gerado_em"
      )
      .order("created_at", { ascending: false }),
    supabase.from("clientes").select("id, nome_fantasia").order("nome_fantasia"),
    supabase.from("lojas").select("id, nome_loja").order("nome_loja"),
  ]);

  const solicitacoes = (data as SolicitacaoAcesso[] | null) ?? [];
  const responsavelIds = Array.from(
    new Set(
      solicitacoes
        .flatMap((solicitacao) => [
          solicitacao.aprovado_por,
          solicitacao.rejeitado_por,
        ])
        .filter(Boolean) as string[]
    )
  );

  const { data: perfisResponsaveis } = responsavelIds.length
    ? await supabase
        .from("perfis")
        .select("id, nome_completo")
        .in("id", responsavelIds)
    : { data: [] };

  const responsaveis = new Map(
    ((perfisResponsaveis as PerfilResponsavel[] | null) ?? []).map((perfil) => [
      perfil.id,
      perfil.nome_completo,
    ])
  );
  const clientes = (clientesResposta.data as Cliente[] | null) ?? [];
  const lojas = (lojasResposta.data as Loja[] | null) ?? [];

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-7xl px-6 pb-8 md:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            Voltar para chamados
          </Link>
          <span className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
            Tela v{SOLICITACOES_ACESSO_PAGE_VERSION.replace(/^v/, "")}
          </span>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Administração
          </p>
          <h1 className="mt-2 text-2xl font-bold">Solicitações de acesso</h1>
          <p className="mt-2 text-sm text-gray-600">
            Aprovação exige nível de acesso, registra responsáveis, bloqueia
            solicitações expiradas e mantém o provisionamento rastreável.
          </p>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              Não foi possível carregar as solicitações.
            </div>
          )}

          <div className="mt-6 space-y-4">
            {solicitacoes.map((solicitacao) => (
              <article
                key={solicitacao.id}
                className="rounded-lg border border-gray-200 p-4"
              >
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
                  <div>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg font-bold">
                          {solicitacao.nome_completo}
                        </h2>
                        <p className="mt-1 text-sm text-gray-600">
                          {solicitacao.email}
                        </p>
                      </div>
                      <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                        {STATUS_LABEL[solicitacao.status] ?? solicitacao.status}
                      </span>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                      <Info label="Empresa" value={solicitacao.empresa} />
                      <Info label="CNPJ" value={solicitacao.cnpj ?? "-"} />
                      <Info
                        label="Nível"
                        value={
                          solicitacao.nivel_acesso
                            ? LABEL_PAPEL_USUARIO[solicitacao.nivel_acesso]
                            : "Não definido"
                        }
                      />
                      <Info
                        label="Criado em"
                        value={formatarData(solicitacao.created_at)}
                      />
                      <Info
                        label="Expira em"
                        value={formatarData(solicitacao.expira_em)}
                      />
                      <Info
                        label="Tempo restante"
                        value={formatarTempoRestante(
                          solicitacao.expira_em,
                          solicitacao.status
                        )}
                      />
                      <Info
                        label="Aprovado por"
                        value={getNomeResponsavel(
                          solicitacao.aprovado_por,
                          responsaveis
                        )}
                      />
                      <Info
                        label="Aprovado em"
                        value={formatarData(solicitacao.aprovado_em)}
                      />
                      <Info
                        label="Rejeitado por"
                        value={getNomeResponsavel(
                          solicitacao.rejeitado_por,
                          responsaveis
                        )}
                      />
                      <Info
                        label="Rejeitado em"
                        value={formatarData(solicitacao.rejeitado_em)}
                      />
                      <Info
                        label="Provisionamento"
                        value={
                          STATUS_PROVISIONAMENTO_LABEL[
                            solicitacao.status_provisionamento ?? "nao_iniciado"
                          ] ?? "Não iniciado"
                        }
                      />
                      <Info
                        label="Tentativa"
                        value={formatarData(solicitacao.provisionamento_tentado_em)}
                      />
                    </dl>

                    {solicitacao.motivo_rejeicao && (
                      <div className="mt-4 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-red-700">
                        <span className="font-semibold">Motivo da rejeição:</span>{" "}
                        {solicitacao.motivo_rejeicao}
                      </div>
                    )}

                    {solicitacao.erro_provisionamento && (
                      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                        <span className="font-semibold">Status operacional:</span>{" "}
                        {solicitacao.erro_provisionamento}
                      </div>
                    )}

                    {solicitacao.link_acesso_manual && (
                      <a
                        href={solicitacao.link_acesso_manual}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                      >
                        Abrir link manual
                      </a>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg bg-gray-50 p-4">
                    <form action={atualizarSolicitacao} className="space-y-3">
                      <input type="hidden" name="id" value={solicitacao.id} />
                      <input type="hidden" name="acao" value="aprovar" />
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                          Nível de acesso
                        </label>
                        <select
                          name="nivel_acesso"
                          required
                          defaultValue={solicitacao.nivel_acesso ?? ""}
                          disabled={!podeAprovar(solicitacao)}
                          className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">Definir nível</option>
                          {PAPEIS_PROVISIONAMENTO.map((papel) => (
                            <option key={papel} value={papel}>
                              {LABEL_PAPEL_USUARIO[papel]}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <SelectOpcional
                          label="Cliente"
                          name="cliente_id"
                          disabled={!podeAprovar(solicitacao)}
                          opcoes={clientes.map((cliente) => ({
                            value: cliente.id,
                            label: cliente.nome_fantasia,
                          }))}
                        />
                        <SelectOpcional
                          label="Loja/Unidade"
                          name="loja_id"
                          disabled={!podeAprovar(solicitacao)}
                          opcoes={lojas.map((loja) => ({
                            value: loja.id,
                            label: loja.nome_loja,
                          }))}
                        />
                      </div>

                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                          Cargo
                        </label>
                        <input
                          name="cargo"
                          defaultValue={solicitacao.cargo ?? ""}
                          disabled={!podeAprovar(solicitacao)}
                          className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!podeAprovar(solicitacao)}
                        className="min-h-10 w-full rounded-lg bg-green-700 px-3 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {solicitacao.status === "erro_envio_convite"
                          ? "Tentar novamente"
                          : "Aprovar e provisionar"}
                      </button>
                    </form>

                    <form action={atualizarSolicitacao} className="space-y-3">
                      <input type="hidden" name="id" value={solicitacao.id} />
                      <input type="hidden" name="acao" value="rejeitar" />
                      <div>
                        <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                          Motivo da rejeição
                        </label>
                        <textarea
                          name="motivo_rejeicao"
                          rows={3}
                          required
                          disabled={solicitacao.status !== "pendente"}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={solicitacao.status !== "pendente"}
                        className="min-h-10 w-full rounded-lg bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Rejeitar
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}

            {solicitacoes.length === 0 && !error && (
              <p className="text-sm text-gray-600">
                Nenhuma solicitação registrada.
              </p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
      <dd className="mt-1 font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function SelectOpcional({
  label,
  name,
  opcoes,
  disabled,
}: {
  label: string;
  name: string;
  opcoes: { value: string; label: string }[];
  disabled: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase text-gray-500">
        {label}
      </label>
      <select
        name={name}
        disabled={disabled}
        className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
      >
        <option value="">Não definido</option>
        {opcoes.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </div>
  );
}
