import type { PapelUsuario } from "@/lib/auth/types";

export type MenuItemStatus = "disponivel" | "em_construcao" | "em_breve";

export type MenuIcon =
  | "archive"
  | "barChart"
  | "calendar"
  | "checkSquare"
  | "clipboard"
  | "database"
  | "fileText"
  | "folder"
  | "globe"
  | "headphones"
  | "home"
  | "keyboard"
  | "monitor"
  | "package"
  | "printer"
  | "server"
  | "settings"
  | "shield"
  | "tool"
  | "users"
  | "wrench";

export type NavigationItem = {
  id: string;
  label: string;
  href: string;
  status: MenuItemStatus;
  icon: MenuIcon;
  allowedRoles?: PapelUsuario[];
};

export type NavigationGroup = {
  id: string;
  label: string;
  icon: MenuIcon;
  items: NavigationItem[];
  allowedRoles?: PapelUsuario[];
};

export const ROADMAP_PATH = "/roadmap";

export const ROADMAP_MONTHS = [
  "Consolidação da navegação e base visual",
  "Assistência essencial",
  "Gerência comercial e cadastral",
  "Administração, usuários e permissões",
  "Configurações operacionais de chamados",
  "Ativos prioritários de campo",
  "Ferramentas de padronização operacional",
  "Planejamento, agenda e recorrência",
  "Relatórios, indicadores e painéis",
  "Configuração avançada e automações",
  "Integrações e infraestrutura de negócio",
  "Inventário avançado, auditoria e fechamento do ciclo",
];

export const navigationGroups: NavigationGroup[] = [
  {
    id: "ativos",
    label: "Ativos",
    icon: "archive",
    items: [
      {
        id: "ativos-dashboard",
        label: "Dashboard",
        href: "/",
        status: "disponivel",
        icon: "barChart",
      },
      {
        id: "ativos-computadores",
        label: "Computadores",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "monitor",
      },
      {
        id: "ativos-monitores",
        label: "Monitores",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "monitor",
      },
      {
        id: "ativos-softwares",
        label: "Softwares",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "database",
      },
      {
        id: "ativos-rede",
        label: "Dispositivos de rede",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "globe",
      },
      {
        id: "ativos-perifericos",
        label: "Periféricos",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "keyboard",
      },
      {
        id: "ativos-impressoras",
        label: "Impressoras",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "printer",
      },
      {
        id: "ativos-racks",
        label: "Racks",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "server",
      },
    ],
  },
  {
    id: "assistencia",
    label: "Assistência",
    icon: "headphones",
    items: [
      {
        id: "assistencia-chamados",
        label: "Chamados",
        href: "/",
        status: "disponivel",
        icon: "clipboard",
      },
      {
        id: "assistencia-novo-chamado",
        label: "Novo chamado",
        href: "/chamados/novo",
        status: "disponivel",
        icon: "fileText",
      },
    ],
  },
  {
    id: "gerencia",
    label: "Gerência",
    icon: "folder",
    items: [
      {
        id: "gerencia-clientes",
        label: "Clientes / Parceiros",
        href: "/cadastros/parceiros",
        status: "disponivel",
        icon: "users",
        allowedRoles: ["super_admin", "admin", "analista"],
      },
      {
        id: "gerencia-organizacoes",
        label: "Organizações",
        href: "/cadastros/organizacoes",
        status: "disponivel",
        icon: "folder",
        allowedRoles: ["super_admin", "admin", "analista"],
      },
      {
        id: "gerencia-tecnicos",
        label: "Técnicos",
        href: "/admin/usuarios",
        status: "disponivel",
        icon: "wrench",
      },
      {
        id: "gerencia-relatorios",
        label: "Relatórios",
        href: "/",
        status: "em_construcao",
        icon: "barChart",
      },
    ],
  },
  {
    id: "ferramentas",
    label: "Ferramentas",
    icon: "tool",
    items: [
      {
        id: "ferramentas-base-conhecimento",
        label: "Base de conhecimento",
        href: "/ferramentas/base-conhecimento",
        status: "disponivel",
        icon: "database",
        allowedRoles: [
          "super_admin",
          "admin",
          "analista",
          "tecnico_quarta",
          "tecnico_terceirizado",
        ],
      },
      {
        id: "ferramentas-faq",
        label: "FAQ",
        href: "/faq/permissoes",
        status: "disponivel",
        icon: "checkSquare",
      },
      {
        id: "ferramentas-changelog",
        label: "Changelog",
        href: "/changelog",
        status: "disponivel",
        icon: "fileText",
      },
      {
        id: "ferramentas-roadmap",
        label: "Roadmap",
        href: ROADMAP_PATH,
        status: "disponivel",
        icon: "calendar",
      },
    ],
  },
  {
    id: "administracao",
    label: "Administração",
    icon: "shield",
    items: [
      {
        id: "administracao-usuarios",
        label: "Usuários e acessos",
        href: "/admin/usuarios",
        status: "disponivel",
        icon: "users",
      },
      {
        id: "administracao-permissoes",
        label: "Permissões",
        href: "/conta/permissoes",
        status: "disponivel",
        icon: "shield",
      },
    ],
  },
  {
    id: "configurar",
    label: "Configurar",
    icon: "settings",
    items: [
      {
        id: "configurar-status-chamados",
        label: "Status de chamados",
        href: "/configurar/status-chamados",
        status: "disponivel",
        icon: "checkSquare",
        allowedRoles: ["super_admin", "admin", "analista"],
      },
      {
        id: "configurar-tipos-chamado",
        label: "Tipos de chamado",
        href: "/configurar/tipos-chamado",
        status: "disponivel",
        icon: "clipboard",
        allowedRoles: ["super_admin", "admin", "analista"],
      },
      {
        id: "configurar-origens-chamado",
        label: "Origem do chamado",
        href: "/configurar/origens-chamado",
        status: "disponivel",
        icon: "globe",
        allowedRoles: ["super_admin", "admin", "analista"],
      },
      {
        id: "configurar-grupos-atendimento",
        label: "Grupos de atendimento",
        href: "/configurar/grupos-atendimento",
        status: "disponivel",
        icon: "users",
        allowedRoles: ["super_admin", "admin", "analista"],
      },
      {
        id: "configurar-preferencias",
        label: "Preferências",
        href: "/conta/aparencia",
        status: "disponivel",
        icon: "settings",
      },
      {
        id: "configurar-slas",
        label: "SLAs",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "calendar",
      },
      {
        id: "configurar-automacoes",
        label: "Automações",
        href: ROADMAP_PATH,
        status: "em_breve",
        icon: "tool",
      },
    ],
  },
];

export function filterNavigationGroupsByRole(
  papel: PapelUsuario,
  groups: NavigationGroup[] = navigationGroups
) {
  return groups
    .filter((group) => !group.allowedRoles || group.allowedRoles.includes(papel))
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.allowedRoles || item.allowedRoles.includes(papel)
      ),
    }))
    .filter((group) => group.items.length > 0);
}

export function findNavigationItem(pathname: string, papel?: PapelUsuario) {
  const groups = papel
    ? filterNavigationGroupsByRole(papel)
    : navigationGroups;
  const exactMatch = groups
    .flatMap((group) => group.items.map((item) => ({ group, item })))
    .find(({ item }) => item.href === pathname);

  if (exactMatch) {
    return exactMatch;
  }

  if (pathname.startsWith("/chamados/") && pathname !== "/chamados/novo") {
    const group = groups.find((item) => item.id === "assistencia");
    const item = group?.items.find((navItem) => navItem.id === "assistencia-chamados");

    return group && item ? { group, item } : null;
  }

  return null;
}
