"use server";

import {
  clearSupabasePasswordSetupCookie,
  clearSupabaseSessionCookies,
  createSupabaseAdminClient,
  createSupabasePublicServerClient,
  getSupabasePasswordSetupToken,
} from "@/lib/supabase/server";
import { validarPoliticaSenha } from "@/lib/auth/password-policy";

export type AlterarSenhaResult = {
  ok: boolean;
  mensagem: string;
};

export async function alterarSenhaAutenticada(
  senha: string,
  confirmacao: string
): Promise<AlterarSenhaResult> {
  const erroSenha = validarPoliticaSenha(senha);

  if (erroSenha) {
    return {
      ok: false,
      mensagem: erroSenha,
    };
  }

  if (senha !== confirmacao) {
    return {
      ok: false,
      mensagem: "A confirmação de senha não confere.",
    };
  }

  const passwordSetupToken = await getSupabasePasswordSetupToken();

  if (!passwordSetupToken) {
    return {
      ok: false,
      mensagem: "O link de alteração expirou. Solicite um novo link.",
    };
  }

  const supabase = createSupabasePublicServerClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(passwordSetupToken);

  if (userError || !user) {
    await clearSupabasePasswordSetupCookie();
    return {
      ok: false,
      mensagem: "O link de alteração expirou. Solicite um novo link.",
    };
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
    password: senha,
  });

  if (error) {
    return {
      ok: false,
      mensagem:
        "Não foi possível alterar a senha no momento. Solicite um novo link.",
    };
  }

  await clearSupabasePasswordSetupCookie();
  await clearSupabaseSessionCookies();

  return {
    ok: true,
    mensagem: "Senha alterada com sucesso. Acesse novamente com sua nova senha.",
  };
}
