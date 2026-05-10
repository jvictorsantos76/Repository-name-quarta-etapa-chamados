"use server";

import { headers } from "next/headers";
import { LEGAL_DOCUMENTS_VERSION } from "@/config/version";
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

  if (erroAuth || !authData.user) {
    return {
      ok: false,
      mensagem:
        erroAuth?.message === "User already registered"
          ? "Este e-mail já possui cadastro. Use a recuperação de senha ou solicite revisão do acesso."
          : "Não foi possível iniciar a confirmação de e-mail. Tente novamente.",
    };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const cnpj = campos.cnpj.trim();
  const empresa = campos.empresa.trim();
  const lojaUnidade = campos.loja_unidade.trim();
  const clientePorCnpj = cnpj
    ? await supabaseAdmin
        .from("clientes")
        .select("id")
        .eq("cnpj", cnpj)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle()
    : { data: null };
  const clientePorNome = clientePorCnpj.data
    ? { data: null }
    : await supabaseAdmin
        .from("clientes")
        .select("id")
        .ilike("nome_fantasia", empresa)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
  const clienteVinculado = clientePorCnpj.data ?? clientePorNome.data;

  const { data: lojaVinculada } =
    clienteVinculado && lojaUnidade
      ? await supabaseAdmin
          .from("lojas")
          .select("id")
          .eq("cliente_id", clienteVinculado.id)
          .ilike("nome_loja", lojaUnidade)
          .eq("ativo", true)
          .limit(1)
          .maybeSingle()
      : { data: null };

  const { error: erroSolicitacao } = await supabase
    .from("solicitacoes_acesso")
    .insert({
      id: solicitacaoId,
      nome_completo: campos.nome_completo.trim(),
      email,
      telefone: campos.telefone.trim() || null,
      empresa: campos.empresa.trim(),
      cnpj: campos.cnpj.trim() || null,
      loja_unidade: campos.loja_unidade.trim() || null,
      cliente_id: clienteVinculado?.id ?? null,
      loja_id: lojaVinculada?.id ?? null,
      cargo: campos.cargo.trim() || null,
      motivo_acesso: campos.motivo_acesso.trim() || null,
      status: "pendente_confirmacao_email",
      user_id: authData.user.id,
      auth_user_id: authData.user.id,
      aceite_termos: campos.aceite_termos,
      aceite_privacidade: campos.aceite_privacidade,
      user_agent: userAgent,
    });

  if (erroSolicitacao) {
    return {
      ok: false,
      mensagem:
        erroSolicitacao.code === "23505"
          ? "Já existe uma solicitação em andamento para este e-mail."
          : "Não foi possível enviar a solicitação. Tente novamente.",
    };
  }

  const { error: erroAceites } = await supabase.from("aceites_legais").insert([
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
