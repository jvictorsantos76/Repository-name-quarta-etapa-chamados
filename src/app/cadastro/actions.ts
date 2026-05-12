"use server";

import { headers } from "next/headers";
import { LEGAL_DOCUMENTS_VERSION } from "@/config/version";
import {
  createSupabaseAdminClient,
  createSupabasePublicServerClient,
  resolverVinculoClienteLoja,
} from "@/lib/supabase/server";

export type CadastroSolicitacaoInput = {
  nome_completo: string;
  email: string;
  telefone: string;
  empresa: string;
  cnpj: string;
  loja_unidade: string;
  cargo: string;
  motivo_acesso: string;
  senha: string;
  confirmacao_senha: string;
  aceite_termos: boolean;
  aceite_privacidade: boolean;
};

export type CadastroSolicitacaoResult = {
  ok: boolean;
  mensagem?: string;
};

async function buscarAuthUserIdPorEmail(email: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  let page = 1;

  while (page <= 5) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error || !data.users.length) {
      return null;
    }

    const user = data.users.find(
      (usuario) => usuario.email?.trim().toLowerCase() === email
    );

    if (user) {
      return {
        id: user.id,
        emailConfirmado: Boolean(user.email_confirmed_at),
      };
    }

    page += 1;
  }

  return null;
}

export async function enviarSolicitacaoAcesso(
  campos: CadastroSolicitacaoInput
): Promise<CadastroSolicitacaoResult> {
  if (
    !campos.nome_completo.trim() ||
    !campos.email.trim() ||
    !campos.empresa.trim()
  ) {
    return {
      ok: false,
      mensagem: "Preencha nome completo, e-mail e empresa.",
    };
  }

  if (!campos.aceite_termos || !campos.aceite_privacidade) {
    return {
      ok: false,
      mensagem:
        "É necessário aceitar os Termos de Uso e a Política de Privacidade.",
    };
  }

  if (campos.senha.length < 8) {
    return {
      ok: false,
      mensagem: "Informe uma senha com pelo menos 8 caracteres.",
    };
  }

  if (campos.senha !== campos.confirmacao_senha) {
    return {
      ok: false,
      mensagem: "A confirmação de senha não confere.",
    };
  }

  const supabase = createSupabasePublicServerClient();
  const headersList = await headers();
  const solicitacaoId = crypto.randomUUID();
  const email = campos.email.trim().toLowerCase();
  const userAgent = headersList.get("user-agent");
  const origin = headersList.get("origin");
  const host = headersList.get("host");
  const proto = headersList.get("x-forwarded-proto") ?? "http";
  const baseUrl = origin ?? (host ? `${proto}://${host}` : "http://localhost:3000");
  const supabaseAdmin = createSupabaseAdminClient();

  const { data: authData, error: erroAuth } = await supabase.auth.signUp({
    email,
    password: campos.senha,
    options: {
      emailRedirectTo: `${baseUrl}/auth/confirm`,
      data: {
        nome_completo: campos.nome_completo.trim(),
      },
    },
  });

  let authUserId = authData.user?.id ?? null;
  let emailJaConfirmado = Boolean(authData.user?.email_confirmed_at);
  const usuarioExistenteSemNovaIdentidade =
    !erroAuth &&
    Boolean(authData.user) &&
    Array.isArray(authData.user?.identities) &&
    authData.user.identities.length === 0;

  if (erroAuth?.message === "User already registered" || usuarioExistenteSemNovaIdentidade) {
    authUserId = null;
    emailJaConfirmado = false;

    const { data: loginData, error: erroLogin } = await supabase.auth.signInWithPassword({
      email,
      password: campos.senha,
    });

    if (!erroLogin && loginData.user) {
      authUserId = loginData.user.id;
      emailJaConfirmado = Boolean(loginData.user.email_confirmed_at || loginData.session);
    } else {
      const usuarioAuthExistente = await buscarAuthUserIdPorEmail(email);
      authUserId = usuarioAuthExistente?.id ?? null;
      emailJaConfirmado = usuarioAuthExistente?.emailConfirmado ?? false;
    }
  }

  if (!authUserId) {
    return {
      ok: false,
      mensagem:
        erroAuth?.message === "User already registered"
          ? "Este e-mail já possui cadastro. Use a recuperação de senha ou solicite revisão do acesso."
          : "Não foi possível iniciar a confirmação de e-mail. Tente novamente.",
    };
  }

  const { data: perfilExistente } = await supabaseAdmin
    .from("perfis")
    .select("id, papel, ativo")
    .eq("id", authUserId)
    .maybeSingle();

  if (perfilExistente?.ativo && perfilExistente.papel !== "solicitante") {
    return {
      ok: false,
      mensagem: "Este e-mail já possui acesso operacional. Volte ao login para entrar.",
    };
  }

  const vinculo = await resolverVinculoClienteLoja({
    cnpj: campos.cnpj,
    empresa: campos.empresa,
    lojaUnidade: campos.loja_unidade,
  });
  const agora = new Date().toISOString();
  const { data: expiracao } = emailJaConfirmado
    ? await supabaseAdmin.rpc("calcular_expiracao_horas_uteis", {
        inicio: agora,
        horas_uteis: 72,
      })
    : { data: null };
  const expiraEm =
    emailJaConfirmado && typeof expiracao === "string"
      ? expiracao
      : emailJaConfirmado
        ? new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        : null;

  const solicitacaoPayload = {
    id: solicitacaoId,
    nome_completo: campos.nome_completo.trim(),
    email,
    telefone: campos.telefone.trim() || null,
    empresa: campos.empresa.trim(),
    cnpj: campos.cnpj.trim() || null,
    loja_unidade: campos.loja_unidade.trim() || null,
    cliente_id: vinculo.clienteId,
    loja_id: vinculo.lojaId,
    cargo: campos.cargo.trim() || null,
    motivo_acesso: campos.motivo_acesso.trim() || null,
    status: emailJaConfirmado
      ? "pendente_aprovacao"
      : "pendente_confirmacao_email",
    user_id: authUserId,
    auth_user_id: authUserId,
    perfil_id: emailJaConfirmado ? authUserId : null,
    email_confirmado_em: emailJaConfirmado ? agora : null,
    expira_em: expiraEm,
    aceite_termos: campos.aceite_termos,
    aceite_privacidade: campos.aceite_privacidade,
    user_agent: userAgent,
  };

  const { error: erroSolicitacaoAdmin } = await supabaseAdmin
    .from("solicitacoes_acesso")
    .insert(solicitacaoPayload);
  const { error: erroSolicitacaoPublica } = erroSolicitacaoAdmin
    ? await supabase.from("solicitacoes_acesso").insert(solicitacaoPayload)
    : { error: null };
  const erroSolicitacao = erroSolicitacaoPublica ?? erroSolicitacaoAdmin;

  if (erroSolicitacao) {
    if (erroSolicitacao.code === "23505") {
      return {
        ok: true,
        mensagem:
          "Já existe uma solicitação em andamento para este e-mail. Use o link de confirmação recebido ou solicite recuperação de senha no login.",
      };
    }

    console.error("Falha ao registrar solicitacao_acesso", {
      code: erroSolicitacao.code,
      message: erroSolicitacao.message,
      details: erroSolicitacao.details,
      hint: erroSolicitacao.hint,
      email,
      authUserId,
    });

    return {
      ok: false,
      mensagem:
        "Sua conta foi criada, mas não conseguimos registrar a solicitação operacional. Tente enviar novamente com o mesmo e-mail e senha.",
    };
  }

  if (emailJaConfirmado) {
    await supabaseAdmin.from("perfis").upsert({
      id: authUserId,
      nome_completo: campos.nome_completo.trim(),
      email,
      telefone: campos.telefone.trim() || null,
      papel: "solicitante",
      ativo: true,
      cargo: campos.cargo.trim() || null,
      cliente_id: vinculo.clienteId,
      loja_id: vinculo.lojaId,
    });
  }

  const { error: erroAceites } = await supabaseAdmin.from("aceites_legais").insert([
    {
      solicitacao_acesso_id: solicitacaoId,
      email,
      tipo_documento: "termos_uso",
      versao_documento: LEGAL_DOCUMENTS_VERSION,
      user_agent: userAgent,
    },
    {
      solicitacao_acesso_id: solicitacaoId,
      email,
      tipo_documento: "politica_privacidade",
      versao_documento: LEGAL_DOCUMENTS_VERSION,
      user_agent: userAgent,
    },
  ]);

  if (erroAceites) {
    return {
      ok: false,
      mensagem:
        "Solicitação criada, mas houve erro ao registrar os aceites legais.",
    };
  }

  return { ok: true };
}
