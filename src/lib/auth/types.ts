export type PapelUsuario =
  | "super_admin"
  | "admin"
  | "gestor"
  | "operador"
  | "analista"
  | "tecnico"
  | "cliente"
  | "solicitante";

export type PerfilAutenticado = {
  id: string;
  nome_completo: string;
  email?: string | null;
  papel: PapelUsuario;
  ativo: boolean;
  telefone?: string | null;
  avatar_url?: string | null;
  biografia?: string | null;
  cargo?: string | null;
  cliente_id?: string | null;
  loja_id?: string | null;
};
