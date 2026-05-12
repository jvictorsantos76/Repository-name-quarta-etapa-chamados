"use server";

import { headers } from "next/headers";
import { LEGAL_DOCUMENTS_VERSION } from "@/config/version";
import { validarPoliticaSenha } from "@/lib/auth/password-policy";
import {
  createSupabaseAdminClient,
  createSupabasePublicServerClient,
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

async function buscarSolicitacaoExistente(email: string) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data } = await supabaseAdmin
    .from("solicitacoes_acesso")
    .select("id, status")
    .eq("email", email)
    .in("status", ["pendente_confirmacao_email", "pendente_aprovacao"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data;
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

  const erroSenha = validarPoliticaSenha(campos.senha);

  if (erroSenha) {
    return {
      ok: false,
      mensagem: erroSenha,
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
      return {
        ok: false,
        mensagem:
          "Este e-mail já possui cadastro. Use o login existente ou solicite recuperação de senha.",
      };
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

  if (perfilExistente?.ativo) {
    return {
      ok: false,
      mensagem: "Este e-mail já possui acesso operacional. Volte ao login para entrar.",
    };
  }
  const agora = new Date().toISOString();
  const solicitacaoExistente = await buscarSolicitacaoExistente(email);
  const solicitacaoId = solicitacaoExistente?.id ?? crypto.randomUUID();

  const solicitacaoPayload = {
    nome_completo: campos.nome_completo.trim(),
    email,
    telefone: campos.telefone.trim() || null,
    empresa: campos.empresa.trim(),
    cnpj: campos.cnpj.trim() || null,
    loja_unidade: campos.loja_unidade.trim() || null,
    cliente_id: null,
    loja_id: null,
    cargo: campos.cargo.trim() || null,
    motivo_acesso: campos.motivo_acesso.trim() || null,
    status: emailJaConfirmado
      ? "pendente_aprovacao"
      : "pendente_confirmacao_email",
    user_id: authUserId,
    auth_user_id: authUserId,
    perfil_id: null,
    email_confirmado_em: emailJaConfirmado ? agora : null,
    expira_em: null,
    bloqueado_em: null,
    aprovado_por: null,
    aprovado_em: null,
    rejeitado_por: null,
    rejeitado_em: null,
    motivo_rejeicao: null,
    observacao_interna: null,
    provisionado_em: null,
    erro_provisionamento: null,
    aceite_termos: campos.aceite_termos,
    aceite_privacidade: campos.aceite_privacidade,
    user_agent: userAgent,
  };

  const operacaoSolicitacao = solicitacaoExistente
    ? supabaseAdmin
        .from("solicitacoes_acesso")
        .update(solicitacaoPayload)
        .eq("id", solicitacaoExistente.id)
    : supabaseAdmin
        .from("solicitacoes_acesso")
        .insert({ id: solicitacaoId, ...solicitacaoPayload });
  const { error: erroSolicitacaoAdmin } = await operacaoSolicitacao;
  const { error: erroSolicitacaoPublica } = erroSolicitacaoAdmin
    ? solicitacaoExistente
      ? await supabase
          .from("solicitacoes_acesso")
          .update(solicitacaoPayload)
          .eq("id", solicitacaoExistente.id)
      : await supabase
          .from("solicitacoes_acesso")
          .insert({ id: solicitacaoId, ...solicitacaoPayload })
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

  const { error: erroAceites } = await supabaseAdmin.from("aceites_legais").upsert(
    [
      {
        solicitacao_acesso_id: solicitacaoId,
        email,
        tipo_documento: "termos_uso",
        versao_documento: LEGAL_DOCUMENTS_VERSION,
        user_agent: userAgent,
        perfil_id: null,
      },
      {
        solicitacao_acesso_id: solicitacaoId,
        email,
        tipo_documento: "politica_privacidade",
        versao_documento: LEGAL_DOCUMENTS_VERSION,
        user_agent: userAgent,
        perfil_id: null,
      },
    ],
    {
      onConflict: "solicitacao_acesso_id,tipo_documento",
    }
  );

  if (erroAceites) {
    return {
      ok: false,
      mensagem:
        "Solicitação criada, mas houve erro ao registrar os aceites legais.",
    };
  }

  return { ok: true };
}
