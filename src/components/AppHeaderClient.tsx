"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useContext, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { atualizarPreferenciasPerfil } from "@/app/perfil/actions";
import { ThemeContext } from "@/components/theme/ThemeProvider";
import {
  createSupabaseBrowserClient,
  syncSupabaseSessionCookies,
} from "@/lib/supabase/client";
import {
  ROADMAP_PATH,
  findNavigationItem,
  navigationGroups,
  type MenuIcon,
  type NavigationGroup,
  type NavigationItem,
} from "@/config/navigation";
import type { TemaPreferido } from "@/lib/theme/types";
import type { PapelUsuario } from "@/lib/auth/types";

type HeaderPerfil = {
  nomeCompleto: string;
  avatarUrl?: string | null;
  papel: PapelUsuario;
  papelLabel: string;
  iniciais: string;
};

const SIDEBAR_STORAGE_KEY = "quarta-etapa-sidebar-collapsed";

const statusLabel: Record<NavigationItem["status"], string> = {
  disponivel: "",
  em_construcao: "Em construção",
  em_breve: "Em breve",
};

function Icon({ name, className = "h-5 w-5" }: { name: MenuIcon; className?: string }) {
  const common = {
    "aria-hidden": true,
    viewBox: "0 0 24 24",
    className,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (name) {
    case "archive":
      return <svg {...common}><path d="M21 8v13H3V8" /><path d="M1 3h22v5H1z" /><path d="M10 12h4" /></svg>;
    case "barChart":
      return <svg {...common}><path d="M3 3v18h18" /><path d="M8 17V9" /><path d="M13 17V5" /><path d="M18 17v-6" /></svg>;
    case "calendar":
      return <svg {...common}><path d="M8 2v4" /><path d="M16 2v4" /><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M3 10h18" /></svg>;
    case "checkSquare":
      return <svg {...common}><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>;
    case "clipboard":
      return <svg {...common}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /></svg>;
    case "database":
      return <svg {...common}><ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5" /><path d="M3 12c0 1.66 4.03 3 9 3s9-1.34 9-3" /></svg>;
    case "fileText":
      return <svg {...common}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></svg>;
    case "folder":
      return <svg {...common}><path d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>;
    case "globe":
      return <svg {...common}><circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 0 20" /><path d="M12 2a15.3 15.3 0 0 0 0 20" /></svg>;
    case "headphones":
      return <svg {...common}><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><path d="M21 19a2 2 0 0 1-2 2h-1v-7h3z" /><path d="M3 19a2 2 0 0 0 2 2h1v-7H3z" /></svg>;
    case "home":
      return <svg {...common}><path d="M3 11 12 3l9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
    case "keyboard":
      return <svg {...common}><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M6 10h.01" /><path d="M10 10h.01" /><path d="M14 10h.01" /><path d="M18 10h.01" /><path d="M8 14h8" /></svg>;
    case "monitor":
      return <svg {...common}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8" /><path d="M12 16v4" /></svg>;
    case "package":
      return <svg {...common}><path d="m7.5 4.27 9 5.15" /><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" /><path d="m3.3 7 8.7 5 8.7-5" /><path d="M12 22V12" /></svg>;
    case "printer":
      return <svg {...common}><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v8H6z" /></svg>;
    case "server":
      return <svg {...common}><rect x="3" y="4" width="18" height="8" rx="2" /><rect x="3" y="12" width="18" height="8" rx="2" /><path d="M7 8h.01" /><path d="M7 16h.01" /></svg>;
    case "settings":
      return <svg {...common}><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6V20a2 2 0 1 1-4 0v-.1a1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-.6-1H4a2 2 0 1 1 0-4h.1a1.65 1.65 0 0 0 .6-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-.6V4a2 2 0 1 1 4 0v.1a1.65 1.65 0 0 0 1 .6 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.14.36.35.68.6 1H20a2 2 0 1 1 0 4h-.1c-.25.32-.46.64-.5 1z" /></svg>;
    case "shield":
      return <svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
    case "tool":
      return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0-5 5L3 18l3 3 6.7-6.7a4 4 0 0 0 5-5l-2.4 2.4-3-3z" /></svg>;
    case "users":
      return <svg {...common}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
    case "wrench":
      return <svg {...common}><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19l3 3 7.3-7.3a4 4 0 0 0 5.4-5.4l-3 3-3-3z" /></svg>;
  }
}

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function ThemeIcon({ tema }: { tema: TemaPreferido }) {
  if (tema === "dark") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M4.93 4.93l1.41 1.41" />
        <path d="M17.66 17.66l1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M6.34 17.66l-1.41 1.41" />
        <path d="M19.07 4.93l-1.41 1.41" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}

function Logo({
  collapsed = false,
  compact = false,
}: {
  collapsed?: boolean;
  compact?: boolean;
}) {
  const logoClass = compact
    ? "h-8 w-auto max-w-24 object-contain"
    : "h-12 w-auto max-w-44 object-contain xl:h-14 xl:max-w-52";
  const collapsedClass = "h-8 w-8 object-contain object-center";

  return (
    <Link
      href="/"
      className="flex h-14 min-w-0 items-center justify-center px-2"
      aria-label="Ir para Home"
    >
      {collapsed ? (
        <>
          <Image src="/brand/quarta-etapa-logo-light.png" alt="Quarta Etapa" width={42} height={42} priority className={`qe-logo-light ${collapsedClass}`} />
          <Image src="/brand/quarta-etapa-logo-dark.png" alt="Quarta Etapa" width={42} height={42} priority className={`qe-logo-dark hidden ${collapsedClass}`} />
        </>
      ) : (
        <>
          <Image src="/brand/quarta-etapa-logo-light.png" alt="Quarta Etapa" width={220} height={64} priority className={`qe-logo-light ${logoClass}`} />
          <Image src="/brand/quarta-etapa-logo-dark.png" alt="Quarta Etapa" width={220} height={64} priority className={`qe-logo-dark hidden ${logoClass}`} />
        </>
      )}
    </Link>
  );
}

function Avatar({ perfil }: { perfil: HeaderPerfil }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-900 text-xs font-bold text-white">
      {perfil.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={perfil.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        perfil.iniciais
      )}
    </span>
  );
}

function SearchForm({ compact = false, onSubmit }: { compact?: boolean; onSubmit: (mensagem: string) => void }) {
  const [termo, setTermo] = useState("");

  return (
    <form
      className={compact ? "w-full" : "hidden min-w-56 max-w-md flex-1 lg:block"}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(termo.trim() ? "Busca global em estruturação." : "Informe um termo para pesquisar.");
      }}
    >
      <label className="relative block">
        <span className="sr-only">Pesquisa global</span>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={termo}
          onChange={(event) => setTermo(event.target.value)}
          placeholder="Pesquisar chamado, cliente, técnico..."
          className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600"
        />
      </label>
    </form>
  );
}

function MenuSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mb-3 px-1">
      <label className="relative block">
        <span className="sr-only">Buscar no menu</span>
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Encontrar um menu"
          className="qe-menu-search h-10 w-full rounded-lg border pl-10 pr-3 text-sm font-semibold outline-none"
        />
      </label>
    </div>
  );
}

function MenuGroupControls({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <div className="mb-3 px-1">
      <button
        type="button"
        onClick={onClick}
        className="qe-sidebar-link min-h-9 w-full rounded-lg border px-3 text-xs font-bold transition"
      >
        {label}
      </button>
    </div>
  );
}

function SidebarItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavigationItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const isRoadmapItem = item.status === "em_breve";
  const content = (
    <>
      <Icon name={item.icon} className="h-4 w-4 shrink-0" />
      {!collapsed ? (
        <>
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {statusLabel[item.status] ? (
            <span className="rounded-full border border-current px-2 py-0.5 text-[10px] font-bold uppercase opacity-80">
              {statusLabel[item.status]}
            </span>
          ) : null}
        </>
      ) : null}
    </>
  );
  const className = [
    "qe-sidebar-link flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-semibold transition",
    collapsed ? "justify-center" : "",
    active ? "qe-sidebar-link-active" : "",
    item.status === "em_breve" ? "qe-sidebar-link-future" : "",
  ].join(" ");

  return (
    <Link
      href={isRoadmapItem ? ROADMAP_PATH : item.href}
      title={collapsed ? `${item.label}${statusLabel[item.status] ? ` - ${statusLabel[item.status]}` : ""}` : undefined}
      onClick={onNavigate}
      className={className}
    >
      {content}
    </Link>
  );
}

function SidebarGroup({
  group,
  activeItemId,
  collapsed,
  open,
  onToggle,
  onNavigate,
}: {
  group: NavigationGroup;
  activeItemId?: string;
  collapsed?: boolean;
  open: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
}) {
  return (
    <section className="relative">
      <button
        type="button"
        onClick={onToggle}
        className={`qe-sidebar-group-button flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-bold transition ${collapsed ? "justify-center" : ""}`}
        title={collapsed ? group.label : undefined}
        aria-expanded={open}
      >
        <Icon name={group.icon} className="qe-sidebar-group-icon h-4 w-4 shrink-0" />
        {!collapsed ? (
          <>
            <span className="flex-1 text-left">{group.label}</span>
            <ChevronIcon className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
          </>
        ) : null}
      </button>
      {open && !collapsed ? (
        <div className="mt-1 grid gap-1 pl-3">
          {group.items.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              active={activeItemId === item.id}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function SidebarFlyout({
  group,
  activeItemId,
  onNavigate,
}: {
  group: NavigationGroup;
  activeItemId?: string;
  onNavigate: () => void;
}) {
  return (
    <div className="qe-sidebar-flyout fixed left-[calc(var(--qe-sidebar-width)+0.5rem)] top-20 z-50 w-64 rounded-xl border p-2 shadow-lg">
      <div className="mb-2 border-b border-current/15 px-3 py-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-70">
          Menu
        </p>
        <p className="text-sm font-bold">{group.label}</p>
      </div>
      <nav className="grid gap-1" aria-label={`Itens de ${group.label}`}>
        {group.items.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            active={activeItemId === item.id}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  );
}

function UserMenu({
  perfil,
  pendente,
  themeLabel,
  temaAtual,
  onTheme,
  onLogout,
  onNavigate,
}: {
  perfil: HeaderPerfil;
  pendente: boolean;
  themeLabel: string;
  temaAtual: TemaPreferido;
  onTheme: () => void;
  onLogout: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="absolute right-0 top-full mt-3 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-sm" role="menu">
      <div className="mb-2 border-b border-gray-200 px-3 py-2">
        <p className="truncate text-sm font-bold text-gray-950">{perfil.nomeCompleto}</p>
        <p className="truncate text-xs font-medium text-gray-600">{perfil.papelLabel}</p>
      </div>
      <Link href="/conta/perfil" onClick={onNavigate} className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Meu perfil</Link>
      <Link href="/conta/aparencia" onClick={onNavigate} className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Preferências</Link>
      <Link href="/faq/permissoes" onClick={onNavigate} className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">FAQ</Link>
      <Link href="/changelog" onClick={onNavigate} className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100">Changelog</Link>
      <button type="button" onClick={onTheme} disabled={pendente} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60">
        <ThemeIcon tema={temaAtual} />
        {themeLabel}
      </button>
      <button type="button" onClick={onLogout} disabled={pendente} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60">
        <LogoutIcon />
        Sair
      </button>
    </div>
  );
}

export function AppHeaderClient({ perfil }: { perfil: HeaderPerfil }) {
  const pathname = usePathname();
  const { preferencias, setPreferencias } = useContext(ThemeContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const [mobileBuscaAberta, setMobileBuscaAberta] = useState(false);
  const [usuarioAberto, setUsuarioAberto] = useState(false);
  const [flyoutGroupId, setFlyoutGroupId] = useState<string | null>(null);
  const [menuTerm, setMenuTerm] = useState("");
  const [groupBulkAction, setGroupBulkAction] = useState<"expand" | "collapse">("collapse");
  const [mensagem, setMensagem] = useState("");
  const [pendente, startTransition] = useTransition();
  const userMenuRef = useRef<HTMLDivElement | null>(null);
  const sidebarRef = useRef<HTMLElement | null>(null);
  const active = findNavigationItem(pathname);
  const activeItemId = active?.item.id;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(navigationGroups.map((group) => [group.id, true]))
  );
  const temaAtual = preferencias.tema_preferido === "dark" ? "dark" : "light";
  const proximoTema: TemaPreferido = temaAtual === "dark" ? "light" : "dark";
  const themeLabel = temaAtual === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro";
  const breadcrumb = useMemo(() => {
    if (pathname === ROADMAP_PATH) {
      return [{ label: "Ferramentas" }, { label: "Roadmap" }];
    }

    if (!active) {
      return [];
    }

    return [
      { label: active.group.label },
      { label: active.item.label },
    ];
  }, [active, pathname]);
  const filteredGroups = useMemo(() => {
    const term = menuTerm.trim().toLowerCase();

    if (!term) {
      return navigationGroups;
    }

    return navigationGroups
      .map((group) => ({
        ...group,
        items: group.items.filter(
          (item) =>
            group.label.toLowerCase().includes(term) ||
            item.label.toLowerCase().includes(term)
        ),
      }))
      .filter((group) => group.items.length > 0);
  }, [menuTerm]);
  const allGroupsOpen = filteredGroups.every((group) => openGroups[group.id] ?? true);
  const allGroupsClosed = filteredGroups.every((group) => !(openGroups[group.id] ?? true));
  const effectiveGroupAction = allGroupsOpen
    ? "collapse"
    : allGroupsClosed
      ? "expand"
      : groupBulkAction;
  const groupControlLabel = effectiveGroupAction === "collapse" ? "Recolher todos" : "Expandir todos";
  const activeFlyoutGroup = sidebarCollapsed
    ? filteredGroups.find((group) => group.id === flyoutGroupId)
    : undefined;

  useEffect(() => {
    document.documentElement.dataset.sidebarState = sidebarCollapsed ? "collapsed" : "expanded";
  }, [sidebarCollapsed]);

  useEffect(() => {
    if (!usuarioAberto && !flyoutGroupId) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (!(target instanceof Node)) {
        return;
      }

      if (usuarioAberto && !userMenuRef.current?.contains(target)) {
        setUsuarioAberto(false);
      }

      if (flyoutGroupId && !sidebarRef.current?.contains(target)) {
        setFlyoutGroupId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") {
        return;
      }

      setUsuarioAberto(false);
      setFlyoutGroupId(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [flyoutGroupId, usuarioAberto]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const collapsed = window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true";
      setSidebarCollapsed(collapsed);
      document.documentElement.dataset.sidebarState = collapsed ? "collapsed" : "expanded";
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      document.documentElement.dataset.sidebarState = next ? "collapsed" : "expanded";
      if (!next) {
        setFlyoutGroupId(null);
      }
      return next;
    });
  }

  function alternarTema() {
    const proximasPreferencias = { ...preferencias, tema_preferido: proximoTema };

    setMensagem("");
    setPreferencias(proximasPreferencias);

    startTransition(() => {
      void atualizarPreferenciasPerfil(proximasPreferencias).then((resultado) => {
        if (resultado.status !== "success") {
          setMensagem(resultado.message);
        }
      });
    });
  }

  function encerrarSessao() {
    setMensagem("");

    startTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();
      syncSupabaseSessionCookies(null);

      if (error) {
        setMensagem("Não foi possível encerrar a sessão no navegador. Tente novamente.");
        return;
      }

      window.location.assign("/auth/logout");
    });
  }

  function toggleGroup(groupId: string) {
    if (sidebarCollapsed) {
      setFlyoutGroupId((current) => (current === groupId ? null : groupId));
      return;
    }

    setOpenGroups((current) => ({ ...current, [groupId]: !current[groupId] }));
  }

  function expandAllGroups() {
    setOpenGroups(Object.fromEntries(filteredGroups.map((group) => [group.id, true])));
    setGroupBulkAction("collapse");
  }

  function collapseAllGroups() {
    setOpenGroups(Object.fromEntries(filteredGroups.map((group) => [group.id, false])));
    setGroupBulkAction("expand");
  }

  function toggleAllGroups() {
    if (effectiveGroupAction === "collapse") {
      collapseAllGroups();
      return;
    }

    expandAllGroups();
  }

  return (
    <>
      <aside ref={sidebarRef} className="qe-sidebar fixed inset-y-0 left-0 z-50 hidden w-72 overflow-y-auto overflow-x-hidden border-r px-2 py-3 shadow-sm md:block">
        <div
          className={
            sidebarCollapsed
              ? "qe-sidebar-top mb-3 flex items-center justify-center"
              : "qe-sidebar-top mb-3 grid grid-cols-[2.5rem_minmax(0,1fr)_2.5rem] items-center gap-2"
          }
        >
          <button
            type="button"
            onClick={toggleSidebar}
            className="qe-menu-button flex h-10 w-10 items-center justify-center rounded-lg"
            aria-label={sidebarCollapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {sidebarCollapsed ? <MenuIcon /> : <CloseIcon />}
          </button>
          {!sidebarCollapsed ? (
            <>
              <div className="min-w-0 justify-self-center">
                <Logo />
              </div>
              <span aria-hidden="true" className="h-10 w-10" />
            </>
          ) : null}
        </div>
        {!sidebarCollapsed ? (
          <>
            <MenuSearch value={menuTerm} onChange={setMenuTerm} />
            <MenuGroupControls
              label={groupControlLabel}
              onClick={toggleAllGroups}
            />
          </>
        ) : null}
        <nav className="grid gap-1" aria-label="Navegação principal">
          {filteredGroups.map((group) => (
            <SidebarGroup
              key={group.id}
              group={group}
              activeItemId={activeItemId}
              collapsed={sidebarCollapsed}
              open={sidebarCollapsed ? flyoutGroupId === group.id : openGroups[group.id] ?? true}
              onToggle={() => toggleGroup(group.id)}
            />
          ))}
        </nav>
        {activeFlyoutGroup ? (
          <SidebarFlyout
            group={activeFlyoutGroup}
            activeItemId={activeItemId}
            onNavigate={() => setFlyoutGroupId(null)}
          />
        ) : null}
      </aside>

      <header className="qe-app-header sticky top-0 z-40 mb-6 border-b border-gray-200 bg-white px-3 py-3 shadow-sm md:px-5">
        <div className="relative mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={() => setMobileAberto((current) => !current)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 md:hidden"
            aria-label={mobileAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileAberto}
          >
            {mobileAberto ? <CloseIcon /> : <MenuIcon />}
          </button>

          <div className="absolute left-1/2 -translate-x-1/2 md:hidden">
            <Logo compact />
          </div>

          {sidebarCollapsed ? (
            <div className="pointer-events-none absolute left-1/2 hidden -translate-x-1/2 md:block">
              <Logo compact />
            </div>
          ) : null}

          <Link
            href="/"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-gray-800 hover:bg-gray-100 md:inline-flex"
            aria-label="Home"
            title="Home"
          >
            <Icon name="home" className="h-4 w-4" />
          </Link>

          <nav aria-label="Caminho atual" className="hidden min-w-0 flex-1 items-center gap-2 text-sm font-semibold text-gray-600 md:flex">
            {breadcrumb.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
                <span className="text-gray-400">/</span>
                {"href" in item && item.href && index < breadcrumb.length - 1 ? (
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1 truncate hover:text-gray-950"
                    aria-label={item.label}
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="truncate text-gray-950">{item.label}</span>
                )}
              </span>
            ))}
          </nav>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
            <SearchForm onSubmit={setMensagem} />
            <button
              type="button"
              onClick={() => setMobileBuscaAberta((current) => !current)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 lg:hidden"
              aria-label="Abrir pesquisa"
              aria-expanded={mobileBuscaAberta}
            >
              <SearchIcon />
            </button>
            <Link href="/faq/permissoes" className="hidden rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 md:inline-flex">
              FAQ
            </Link>
            <button
              type="button"
              onClick={alternarTema}
              disabled={pendente}
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 md:flex"
              aria-label={themeLabel}
              title={themeLabel}
            >
              <ThemeIcon tema={temaAtual} />
            </button>
            <div ref={userMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setUsuarioAberto((current) => !current)}
                className="flex h-10 items-center gap-2 rounded-lg bg-gray-950 py-1 pl-1 pr-2 text-left text-white hover:bg-gray-800"
                aria-expanded={usuarioAberto}
                aria-haspopup="menu"
              >
                <Avatar perfil={perfil} />
                <span className="hidden max-w-28 truncate text-sm font-semibold lg:block">{perfil.nomeCompleto}</span>
                <ChevronIcon />
              </button>
              {usuarioAberto ? (
                <UserMenu
                  perfil={perfil}
                  pendente={pendente}
                  themeLabel={themeLabel}
                  temaAtual={temaAtual}
                  onTheme={alternarTema}
                  onLogout={encerrarSessao}
                  onNavigate={() => setUsuarioAberto(false)}
                />
              ) : null}
            </div>
          </div>
        </div>

        {mobileBuscaAberta ? (
          <div className="mx-auto mt-3 max-w-7xl lg:hidden">
            <SearchForm compact onSubmit={setMensagem} />
          </div>
        ) : null}

        {mobileAberto ? (
          <div className="qe-sidebar mt-3 rounded-xl border p-3 shadow-sm md:hidden">
            <MenuSearch value={menuTerm} onChange={setMenuTerm} />
            <MenuGroupControls
              label={groupControlLabel}
              onClick={toggleAllGroups}
            />
            <nav className="grid gap-1" aria-label="Menu mobile">
              {filteredGroups.map((group) => (
                <SidebarGroup
                  key={group.id}
                  group={group}
                  activeItemId={activeItemId}
                  open={openGroups[group.id] ?? true}
                  onToggle={() =>
                    setOpenGroups((current) => ({
                      ...current,
                      [group.id]: !current[group.id],
                    }))
                  }
                  onNavigate={() => setMobileAberto(false)}
                />
              ))}
              {filteredGroups.length === 0 ? (
                <p className="rounded-lg border border-current px-3 py-4 text-sm font-semibold opacity-75">
                  Nenhum menu encontrado.
                </p>
              ) : null}
            </nav>
          </div>
        ) : null}

        {mensagem ? (
          <p className="mx-auto mt-2 max-w-7xl text-xs font-semibold text-gray-600" role="status">
            {mensagem}
          </p>
        ) : null}
      </header>
    </>
  );
}
