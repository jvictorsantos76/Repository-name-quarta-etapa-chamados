export type TemaPreferido = "system" | "light" | "dark";

export type CorPreferida =
  | "quarta-etapa"
  | "verde"
  | "roxo"
  | "laranja"
  | "neutro";

export type FonteEscala = "padrao" | "grande" | "extra_grande";

export type PreferenciasTema = {
  tema_preferido: TemaPreferido;
  cor_preferida: CorPreferida;
  fonte_escala: FonteEscala;
};
