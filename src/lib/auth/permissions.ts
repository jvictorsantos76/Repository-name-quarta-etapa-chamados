import type { PapelUsuario } from "./types";

export const PAPEIS_USUARIO: PapelUsuario[] = [
  "super_admin",
  "admin",
  "gestor",
  "operador",
  "analista",
  "tecnico",
  "cliente",
  "solicitante",
];

export const PAPEIS_PROVISIONAMENTO: PapelUsuario[] = [
  "super_admin",
  "admin",
  "gestor",
  "analista",
  "tecnico",
  "cliente",
  "solicitante",
];

export const PAPEIS_ADMIN_USUARIOS: PapelUsuario[] = ["super_admin", "admin"];

export const LABEL_PAPEL_USUARIO: Record<PapelUsuario, string> = {
  super_admin: "Super-Admin",
  admin: "Admin",
  gestor: "Gestor",
  operador: "Operador (legado)",
  analista: "Analista",
  tecnico: "Técnico",
  cliente: "Cliente",
  solicitante: "Solicitante",
};

export function isPapelUsuario(papel: string): papel is PapelUsuario {
  return PAPEIS_USUARIO.includes(papel as PapelUsuario);
}

export function podeAdministrarUsuarios(papel: PapelUsuario) {
  return PAPEIS_ADMIN_USUARIOS.includes(papel);
}
