export type PapelUsuario = "admin" | "gestor" | "operador" | "analista" | "tecnico";

export type PerfilAutenticado = {
  id: string;
  nome_completo: string;
  papel: PapelUsuario;
  ativo: boolean;
};
