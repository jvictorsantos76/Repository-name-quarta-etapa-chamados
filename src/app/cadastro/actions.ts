"use server";

import { headers } from "next/headers";
import { LEGAL_DOCUMENTS_VERSION } from "@/config/version";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CadastroSolicitacaoInput = {
  nome_completo: string;
  email: string;
  telefone: string;
  empresa: string;
  cnpj: string;
  loja_unidade: string;
  cargo: string;
  motivo_acesso: string;
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

  const supabase = await createSupabaseServerClient();
  const headersList = await headers();
  const solicitacaoId = crypto.randomUUID();
  const email = campos.email.trim().toLowerCase();
  const userAgent = headersList.get("user-agent");

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
      cargo: campos.cargo.trim() || null,
      motivo_acesso: campos.motivo_acesso.trim() || null,
      aceite_termos: campos.aceite_termos,
      aceite_privacidade: campos.aceite_privacidade,
      user_agent: userAgent,
    });

  if (erroSolicitacao) {
    return {
      ok: false,
      mensagem:
        erroSolicitacao.code === "23505"
          ? "Já existe uma solicitação pendente para este e-mail."
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
