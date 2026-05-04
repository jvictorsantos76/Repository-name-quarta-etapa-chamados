"use server";

import {
  clearSupabaseSessionCookies,
  createSupabaseServerClient,
} from "@/lib/supabase/server";

export type AlterarSenhaResult = {
  ok: boolean;
  mensagem: string;
};

export async function alterarSenhaAutenticada(
  senha: string,
  confirmacao: string
): Promise<AlterarSenhaResult> {
  if (senha.length < 8) {
    return {
      ok: false,
      mensagem: "Informe uma senha com pelo menos 8 caracteres.",
    };
  }

  if (senha !== confirmacao) {
    return {
      ok: false,
      mensagem: "A confirmação de senha não confere.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password: senha });

  if (error) {
    return {
      ok: false,
      mensagem: "Não foi possível alterar a senha. Solicite um novo link.",
    };
  }

  await clearSupabaseSessionCookies();

  return {
    ok: true,
    mensagem: "Senha alterada com sucesso. Acesse novamente com sua nova senha.",
  };
}
