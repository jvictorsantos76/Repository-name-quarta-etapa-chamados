const MIN_PASSWORD_LENGTH = 8;
const LOWERCASE_REGEX = /[a-z]/;
const UPPERCASE_REGEX = /[A-Z]/;
const DIGIT_REGEX = /\d/;

export const PASSWORD_POLICY_HINT =
  "Use pelo menos 8 caracteres, com 1 letra minúscula, 1 maiúscula e 1 número.";

export function validarPoliticaSenha(senha: string) {
  if (senha.length < MIN_PASSWORD_LENGTH) {
    return "Informe uma senha com pelo menos 8 caracteres.";
  }

  if (!LOWERCASE_REGEX.test(senha)) {
    return "A senha deve conter pelo menos uma letra minúscula.";
  }

  if (!UPPERCASE_REGEX.test(senha)) {
    return "A senha deve conter pelo menos uma letra maiúscula.";
  }

  if (!DIGIT_REGEX.test(senha)) {
    return "A senha deve conter pelo menos um número.";
  }

  return null;
}
