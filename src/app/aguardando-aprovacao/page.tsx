import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  getSupabaseAccessToken,
} from "@/lib/supabase/server";

async function redirecionarSeAcessoAtivo() {
  const accessToken = await getSupabaseAccessToken();

  if (!accessToken) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { data: userData, error: userError } = await supabase.auth.getUser(
    accessToken
  );

  if (userError || !userData.user) {
    return;
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("id, papel, ativo")
    .eq("id", userData.user.id)
    .eq("ativo", true)
    .maybeSingle();

  if (!perfil) {
    return;
  }

  if (perfil.papel !== "solicitante") {
    redirect("/");
  }

  const { data: solicitacao } = await supabase
    .from("solicitacoes_acesso")
    .select("status, email_confirmado_em, expira_em, bloqueado_em")
    .or(
      `user_id.eq.${userData.user.id},auth_user_id.eq.${userData.user.id},perfil_id.eq.${userData.user.id}`
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const acessoTemporarioAtivo =
    solicitacao?.status === "pendente_aprovacao" &&
    Boolean(solicitacao.email_confirmado_em) &&
    Boolean(solicitacao.expira_em) &&
    new Date(solicitacao.expira_em as string).getTime() > Date.now() &&
    !solicitacao.bloqueado_em;

  if (acessoTemporarioAtivo) {
    redirect("/chamados/novo");
  }
}

export default async function AguardandoAprovacaoPage() {
  await redirecionarSeAcessoAtivo();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 p-6 text-gray-900">
      <section className="w-full max-w-xl rounded-xl bg-white p-6 shadow">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Aguardando aprovação
        </p>
        <h1 className="mt-2 text-2xl font-bold">Acesso ainda não autorizado</h1>
        <p className="mt-4 text-sm leading-6 text-gray-600">
          Seu cadastro foi recebido ou seu usuário ainda não possui autorização
          operacional. A liberação de acesso depende de validação da Quarta
          Etapa ou do responsável autorizado da sua empresa.
        </p>
        <Link
          href="/auth/logout"
          className="mt-6 inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800"
        >
          Voltar ao login
        </Link>
      </section>
    </main>
  );
}
