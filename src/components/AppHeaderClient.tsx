"use client";

import Image from "next/image";
import Link from "next/link";
import { useContext, useState, useTransition } from "react";
import { atualizarPreferenciasPerfil } from "@/app/perfil/actions";
import { ThemeContext } from "@/components/theme/ThemeProvider";
import {
  createSupabaseBrowserClient,
  syncSupabaseSessionCookies,
} from "@/lib/supabase/client";
import type { TemaPreferido } from "@/lib/theme/types";

type HeaderPerfil = {
  nomeCompleto: string;
  avatarUrl?: string | null;
  papelLabel: string;
  iniciais: string;
};

type NavItem = {
  label: string;
  href: string;
  title?: string;
};

const mainNavItems: NavItem[] = [
  { label: "Chamados", href: "/" },
  {
    label: "Clientes",
    href: "/chamados/novo",
    title: "Clientes ficam disponíveis no fluxo de abertura de chamados.",
  },
  { label: "Técnicos", href: "/admin/usuarios" },
  {
    label: "Relatórios",
    href: "/",
    title: "Relatórios consolidados serão estruturados a partir do dashboard.",
  },
];

const programasItems: NavItem[] = [
  {
    label: "Ativos",
    href: "/chamados/novo",
    title: "Ativos ficam disponíveis no fluxo de abertura de chamados.",
  },
  {
    label: "Serviços",
    href: "/chamados/novo",
    title: "Serviços ficam disponíveis no fluxo de abertura de chamados.",
  },
  {
    label: "Produtos",
    href: "/chamados/novo",
    title: "Produtos ficam disponíveis no fluxo de abertura de chamados.",
  },
  { label: "Dashboard", href: "/" },
  { label: "Administração", href: "/admin/usuarios" },
];

function SearchIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="M16 17l5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

function ThemeIcon({ tema }: { tema: TemaPreferido }) {
  if (tema === "dark") {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
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
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8z" />
    </svg>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex h-12 shrink-0 items-center"
      aria-label="Ir para o Dashboard"
    >
      <Image
        src="/brand/quarta-etapa-logo-light.png"
        alt="Quarta Etapa"
        width={184}
        height={54}
        priority
        className="qe-logo-light h-9 w-auto object-contain"
      />
      <Image
        src="/brand/quarta-etapa-logo-dark.png"
        alt="Quarta Etapa"
        width={184}
        height={54}
        priority
        className="qe-logo-dark hidden h-9 w-auto object-contain"
      />
    </Link>
  );
}

function SearchForm({
  compact = false,
  onSubmit,
}: {
  compact?: boolean;
  onSubmit: (mensagem: string) => void;
}) {
  const [termo, setTermo] = useState("");

  return (
    <form
      className={compact ? "w-full" : "hidden min-w-64 max-w-md flex-1 lg:block"}
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(
          termo.trim()
            ? "Busca global em estruturação."
            : "Informe um termo para pesquisar."
        );
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
          className="h-11 w-full rounded-full border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition focus:border-blue-600"
        />
      </label>
    </form>
  );
}

function Avatar({ perfil }: { perfil: HeaderPerfil }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-xs font-bold text-white">
      {perfil.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={perfil.avatarUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        perfil.iniciais
      )}
    </span>
  );
}

function NavLink({
  item,
  onClick,
  className = "",
}: {
  item: NavItem;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={item.href}
      title={item.title}
      onClick={onClick}
      className={`rounded-full px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 ${className}`}
    >
      {item.label}
    </Link>
  );
}

export function AppHeaderClient({ perfil }: { perfil: HeaderPerfil }) {
  const { preferencias, setPreferencias } = useContext(ThemeContext);
  const [programasAberto, setProgramasAberto] = useState(false);
  const [usuarioAberto, setUsuarioAberto] = useState(false);
  const [mobileAberto, setMobileAberto] = useState(false);
  const [mobileBuscaAberta, setMobileBuscaAberta] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [pendente, startTransition] = useTransition();
  const temaAtual = preferencias.tema_preferido === "dark" ? "dark" : "light";
  const proximoTema: TemaPreferido = temaAtual === "dark" ? "light" : "dark";
  const themeLabel =
    temaAtual === "dark" ? "Alternar para tema claro" : "Alternar para tema escuro";

  function fecharMenus() {
    setProgramasAberto(false);
    setUsuarioAberto(false);
    setMobileAberto(false);
  }

  function alternarTema() {
    const proximasPreferencias = {
      ...preferencias,
      tema_preferido: proximoTema,
    };

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
        setMensagem(
          "Não foi possível encerrar a sessão no navegador. Tente novamente."
        );
        return;
      }

      window.location.assign("/auth/logout");
    });
  }

  const userMenuItems: NavItem[] = [
    { label: "Meu perfil", href: "/conta/perfil" },
    { label: "Preferências", href: "/conta/aparencia" },
    { label: "FAQ", href: "/faq/permissoes" },
    { label: "Changelog", href: "/changelog" },
  ];

  return (
    <header className="qe-app-header sticky top-0 z-50 mb-6 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-8">
      <div className="mx-auto flex max-w-7xl items-center gap-3">
        <Logo />

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Menu principal"
        >
          {mainNavItems.map((item) => (
            <NavLink key={item.label} item={item} />
          ))}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setProgramasAberto((aberto) => !aberto);
                setUsuarioAberto(false);
              }}
              className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950"
              aria-expanded={programasAberto}
              aria-haspopup="menu"
            >
              Programas
              <ChevronIcon />
            </button>
            {programasAberto ? (
              <div
                className="absolute left-0 top-full mt-3 w-56 rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
                role="menu"
              >
                {programasItems.map((item) => (
                  <NavLink
                    key={item.label}
                    item={item}
                    onClick={() => setProgramasAberto(false)}
                    className="block rounded-lg"
                  />
                ))}
              </div>
            ) : null}
          </div>
        </nav>

        <div className="ml-auto flex min-w-0 items-center justify-end gap-2">
          <SearchForm onSubmit={setMensagem} />

          <button
            type="button"
            onClick={() => setMobileBuscaAberta((aberta) => !aberta)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-700 transition hover:bg-gray-100 lg:hidden"
            aria-label="Abrir pesquisa"
            aria-expanded={mobileBuscaAberta}
          >
            <SearchIcon />
          </button>

          <Link
            href="/faq/permissoes"
            className="hidden rounded-full px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 md:inline-flex"
          >
            FAQ
          </Link>

          <div className="relative hidden md:block">
            <button
              type="button"
              onClick={() => {
                setUsuarioAberto((aberto) => !aberto);
                setProgramasAberto(false);
              }}
              className="flex h-11 max-w-56 items-center gap-2 rounded-full bg-gray-950 py-1 pl-1 pr-3 text-left text-white transition hover:bg-gray-800"
              aria-expanded={usuarioAberto}
              aria-haspopup="menu"
            >
              <Avatar perfil={perfil} />
              <span className="min-w-0">
                <span className="block max-w-28 truncate text-sm font-semibold">
                  {perfil.nomeCompleto}
                </span>
              </span>
              <ChevronIcon />
            </button>
            {usuarioAberto ? (
              <div
                className="absolute right-0 top-full mt-3 w-64 rounded-xl border border-gray-200 bg-white p-2 shadow-sm"
                role="menu"
              >
                <div className="mb-2 border-b border-gray-200 px-3 py-2">
                  <p className="truncate text-sm font-bold text-gray-950">
                    {perfil.nomeCompleto}
                  </p>
                  <p className="truncate text-xs font-medium text-gray-600">
                    {perfil.papelLabel}
                  </p>
                </div>
                {userMenuItems.map((item) => (
                  <NavLink
                    key={item.label}
                    item={item}
                    onClick={() => setUsuarioAberto(false)}
                    className="block rounded-lg"
                  />
                ))}
                <button
                  type="button"
                  onClick={alternarTema}
                  disabled={pendente}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ThemeIcon tema={temaAtual} />
                  {themeLabel}
                </button>
                <button
                  type="button"
                  onClick={encerrarSessao}
                  disabled={pendente}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <LogoutIcon />
                  Sair
                </button>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setMobileAberto((aberto) => !aberto)}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-950 text-white transition hover:bg-gray-800 lg:hidden"
            aria-label={mobileAberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileAberto}
          >
            {mobileAberto ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {mobileBuscaAberta ? (
        <div className="mx-auto mt-3 max-w-7xl lg:hidden">
          <SearchForm compact onSubmit={setMensagem} />
        </div>
      ) : null}

      {mobileAberto ? (
        <div className="mx-auto mt-3 max-w-7xl rounded-xl border border-gray-200 bg-white p-3 shadow-sm lg:hidden">
          <div className="mb-3 flex items-center gap-3 border-b border-gray-200 pb-3">
            <Avatar perfil={perfil} />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-950">
                {perfil.nomeCompleto}
              </p>
              <p className="truncate text-xs font-medium text-gray-600">
                {perfil.papelLabel}
              </p>
            </div>
          </div>
          <nav className="grid gap-1" aria-label="Menu mobile">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                onClick={fecharMenus}
                className="block rounded-lg"
              />
            ))}
            <div className="mt-2 border-t border-gray-200 pt-2">
              <p className="px-3 py-2 text-xs font-bold uppercase text-gray-500">
                Programas
              </p>
              {programasItems.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  onClick={fecharMenus}
                  className="block rounded-lg"
                />
              ))}
            </div>
            <div className="mt-2 border-t border-gray-200 pt-2">
              {userMenuItems.map((item) => (
                <NavLink
                  key={item.label}
                  item={item}
                  onClick={fecharMenus}
                  className="block rounded-lg"
                />
              ))}
              <button
                type="button"
                onClick={alternarTema}
                disabled={pendente}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-gray-700 transition hover:bg-gray-100 hover:text-gray-950 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <ThemeIcon tema={temaAtual} />
                {themeLabel}
              </button>
              <button
                type="button"
                onClick={encerrarSessao}
                disabled={pendente}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogoutIcon />
                Sair
              </button>
            </div>
          </nav>
        </div>
      ) : null}

      {mensagem ? (
        <p className="mx-auto mt-2 max-w-7xl text-xs font-semibold text-gray-600">
          {mensagem}
        </p>
      ) : null}
    </header>
  );
}
