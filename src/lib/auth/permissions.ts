import type { PapelUsuario } from "./types";

export const PAPEIS_USUARIO: PapelUsuario[] = [
  "super_admin",
  "admin",
  "comercial",
  "analista",
  "tecnico_quarta",
  "tecnico_terceirizado",
  "cliente",
  "parceiro",
];

export const PAPEIS_PROVISIONAMENTO: PapelUsuario[] = [
  "super_admin",
  "admin",
  "comercial",
  "analista",
  "tecnico_quarta",
  "tecnico_terceirizado",
  "cliente",
  "parceiro",
];

export const PAPEIS_ADMIN_USUARIOS: PapelUsuario[] = ["super_admin", "admin"];
export const PAPEIS_CATALOGOS_CHAMADO: PapelUsuario[] = [
  "super_admin",
  "admin",
  "analista",
];
export const PAPEIS_BASE_CONHECIMENTO: PapelUsuario[] = [
  ...PAPEIS_CATALOGOS_CHAMADO,
  "tecnico_quarta",
  "tecnico_terceirizado",
];
export const PAPEIS_ALTERAR_CHAMADO_FATURADO: PapelUsuario[] = [
  "super_admin",
  "admin",
  "analista",
];

export const LABEL_PAPEL_USUARIO: Record<PapelUsuario, string> = {
  super_admin: "Super-Admin",
  admin: "Admin",
  comercial: "Comercial",
  analista: "Analista",
  tecnico_quarta: "Técnico-Quarta",
  tecnico_terceirizado: "Técnico-Terceirizado",
  cliente: "Cliente",
  parceiro: "Parceiro",
};

export function isPapelUsuario(papel: string): papel is PapelUsuario {
  return PAPEIS_USUARIO.includes(papel as PapelUsuario);
}

export function podeAdministrarUsuarios(papel: PapelUsuario) {
  return PAPEIS_ADMIN_USUARIOS.includes(papel);
}

export function podeGerenciarCatalogosChamado(papel: PapelUsuario) {
  return PAPEIS_CATALOGOS_CHAMADO.includes(papel);
}

export function podeConsultarBaseConhecimento(papel: PapelUsuario) {
  return PAPEIS_BASE_CONHECIMENTO.includes(papel);
}

export function isClienteOuParceiro(papel: PapelUsuario) {
  return papel === "cliente" || papel === "parceiro";
}

export function podeOperarChamados(papel: PapelUsuario) {
  return PAPEIS_OPERACIONAIS.includes(papel);
}

export function podeAlterarChamadoFaturado(papel: PapelUsuario) {
  return PAPEIS_ALTERAR_CHAMADO_FATURADO.includes(papel);
}

export type PermissaoAcao = {
  id: string;
  label: string;
  papeis: PapelUsuario[];
};

export type PermissaoTela = {
  id: string;
  tela: string;
  descricao: string;
  acoes: PermissaoAcao[];
};

const TODOS_PAPEIS: PapelUsuario[] = PAPEIS_USUARIO;
const PAPEIS_OPERACIONAIS: PapelUsuario[] = [
  "super_admin",
  "admin",
  "comercial",
  "analista",
  "tecnico_quarta",
  "tecnico_terceirizado",
];

export const MATRIZ_PERMISSOES: PermissaoTela[] = [
  {
    id: "chamados",
    tela: "Chamados",
    descricao: "Acompanhamento e execução operacional dos chamados técnicos.",
    acoes: [
      {
        id: "chamados.visualizar",
        label: "Visualizar chamados",
        papeis: TODOS_PAPEIS,
      },
      {
        id: "chamados.criar",
        label: "Criar chamados",
        papeis: TODOS_PAPEIS,
      },
      {
        id: "chamados.alterar_status",
        label: "Alterar status",
        papeis: PAPEIS_OPERACIONAIS,
      },
      {
        id: "chamados.registrar_atendimento",
        label: "Registrar atendimento técnico",
        papeis: PAPEIS_OPERACIONAIS,
      },
      {
        id: "chamados.encerrar",
        label: "Encerrar ou resolver chamados",
        papeis: PAPEIS_OPERACIONAIS,
      },
      {
        id: "chamados.alterar_faturado",
        label: "Alterar chamado faturado",
        papeis: PAPEIS_ALTERAR_CHAMADO_FATURADO,
      },
    ],
  },
  {
    id: "perfil",
    tela: "Perfil",
    descricao: "Dados do próprio usuário exibidos nos fluxos operacionais.",
    acoes: [
      {
        id: "perfil.visualizar_proprio",
        label: "Visualizar próprio perfil",
        papeis: TODOS_PAPEIS,
      },
      {
        id: "perfil.editar_telefone",
        label: "Editar telefone",
        papeis: TODOS_PAPEIS,
      },
      {
        id: "perfil.editar_cargo",
        label: "Editar cargo",
        papeis: TODOS_PAPEIS,
      },
      {
        id: "perfil.editar_biografia",
        label: "Editar biografia",
        papeis: TODOS_PAPEIS,
      },
      {
        id: "perfil.alterar_foto",
        label: "Alterar foto",
        papeis: TODOS_PAPEIS,
      },
    ],
  },
  {
    id: "aparencia",
    tela: "Aparência e Acessibilidade",
    descricao: "Preferências visuais individuais do sistema.",
    acoes: [
      {
        id: "aparencia.visualizar",
        label: "Visualizar preferências",
        papeis: TODOS_PAPEIS,
      },
      {
        id: "aparencia.alterar",
        label: "Alterar tema, cor e fonte",
        papeis: TODOS_PAPEIS,
      },
    ],
  },
  {
    id: "admin_usuarios",
    tela: "Admin/Usuários",
    descricao: "Governança de solicitações de acesso e provisionamento.",
    acoes: [
      {
        id: "admin_usuarios.visualizar_solicitacoes",
        label: "Visualizar solicitações",
        papeis: PAPEIS_ADMIN_USUARIOS,
      },
      {
        id: "admin_usuarios.aprovar",
        label: "Aprovar usuários",
        papeis: PAPEIS_ADMIN_USUARIOS,
      },
      {
        id: "admin_usuarios.rejeitar",
        label: "Rejeitar usuários",
        papeis: PAPEIS_ADMIN_USUARIOS,
      },
    ],
  },
];

export function getPermissoesPorPapel(papel: PapelUsuario) {
  return MATRIZ_PERMISSOES.map((grupo) => ({
    ...grupo,
    acoes: grupo.acoes.filter((acao) => acao.papeis.includes(papel)),
  })).filter((grupo) => grupo.acoes.length > 0);
}
