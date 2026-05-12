"use server";

import {
  clearSupabaseSessionCookies,
  createSupabaseServerClient,
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

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      mensagem: "O link de alteração expirou. Solicite um novo link.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    return {
      ok: false,
      mensagem:
        "Não foi possível alterar a senha no momento. Solicite um novo link.",
    };
  }

  await clearSupabaseSessionCookies();

  return {
    ok: true,
    mensagem: "Senha alterada com sucesso. Acesse novamente com sua nova senha.",
  };
}
