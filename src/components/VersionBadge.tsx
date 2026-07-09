"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  APP_UPDATED_AT,
  APP_VERSION,
  BASE_CONHECIMENTO_PAGE_VERSION,
  CADASTRO_USUARIO_PAGE_VERSION,
  CALENDARIOS_SLA_PAGE_VERSION,
  CONTA_APARENCIA_PAGE_VERSION,
  CONTA_PAGE_VERSION,
  CONTA_PERFIL_PAGE_VERSION,
  CONTA_PERMISSOES_PAGE_VERSION,
  CONTRATOS_PAGE_VERSION,
  DASHBOARD_PAGE_VERSION,
  LOGIN_PAGE_VERSION,
  NOVO_CHAMADO_PAGE_VERSION,
  ORGANIZACOES_PAGE_VERSION,
  PARCEIROS_PAGE_VERSION,
  GRUPOS_ATENDIMENTO_PAGE_VERSION,
  ORIGENS_CHAMADO_PAGE_VERSION,
  PERFIL_USUARIO_PAGE_VERSION,
  SLAS_PAGE_VERSION,
  STATUS_CHAMADOS_PAGE_VERSION,
  SOLICITACOES_ACESSO_PAGE_VERSION,
  TIPOS_CHAMADO_PAGE_VERSION,
} from "@/config/version";

const footerGroups = [
  {
    title: "Operação",
    links: [
      { label: "Dashboard", href: "/" },
      { label: "Novo chamado", href: "/chamados/novo" },
      { label: "Roadmap", href: "/roadmap" },
    ],
  },
  {
    title: "Administração",
    links: [
      { label: "Usuários e acessos", href: "/admin/usuarios" },
      { label: "Conta", href: "/conta" },
      { label: "Perfil", href: "/conta/perfil" },
      { label: "Aparência", href: "/conta/aparencia" },
    ],
  },
  {
    title: "Suporte e governança",
    links: [
      { label: "Permissões", href: "/conta/permissoes" },
      { label: "FAQ", href: "/faq/permissoes" },
      { label: "Changelog", href: "/changelog" },
      { label: "Termos de uso", href: "/termos-uso" },
      { label: "Privacidade", href: "/politica-privacidade" },
    ],
  },
];

const appChromePrefixes = ["/chamados", "/admin", "/conta", "/roadmap", "/configurar", "/cadastros"];

function formatarDataVersao(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${data}T00:00:00Z`));
}

function getPageVersion(pathname: string) {
  if (pathname === "/") {
    return `Tela | Dashboard ${DASHBOARD_PAGE_VERSION}`;
  }

  if (pathname === "/login") {
    return `Tela de Login ${LOGIN_PAGE_VERSION}`;
  }

  if (pathname === "/cadastro") {
    return `Tela | Cadastro de Usuário ${CADASTRO_USUARIO_PAGE_VERSION}`;
  }

  if (pathname === "/admin/usuarios") {
    return `Tela | Solicitações de Acesso ${SOLICITACOES_ACESSO_PAGE_VERSION}`;
  }

  if (pathname === "/perfil") {
    return `Tela | Perfil de Usuário ${PERFIL_USUARIO_PAGE_VERSION}`;
  }

  if (pathname === "/conta") {
    return `Tela | Conta ${CONTA_PAGE_VERSION}`;
  }

  if (pathname === "/conta/perfil") {
    return `Tela | Perfil ${CONTA_PERFIL_PAGE_VERSION}`;
  }

  if (pathname === "/conta/aparencia") {
    return `Tela | Aparência ${CONTA_APARENCIA_PAGE_VERSION}`;
  }

  if (pathname === "/conta/permissoes") {
    return `Tela | Permissões ${CONTA_PERMISSOES_PAGE_VERSION}`;
  }

  if (pathname === "/chamados/novo") {
    return `Tela | Novo Chamado ${NOVO_CHAMADO_PAGE_VERSION}`;
  }

  if (pathname === "/configurar/status-chamados") {
    return `Tela | Status de Chamados ${STATUS_CHAMADOS_PAGE_VERSION}`;
  }

  if (pathname === "/configurar/tipos-chamado") {
    return `Tela | Tipos de Chamado ${TIPOS_CHAMADO_PAGE_VERSION}`;
  }

  if (pathname === "/configurar/origens-chamado") {
    return `Tela | Origens de Chamado ${ORIGENS_CHAMADO_PAGE_VERSION}`;
  }

  if (pathname === "/configurar/grupos-atendimento") {
    return `Tela | Grupos de Atendimento ${GRUPOS_ATENDIMENTO_PAGE_VERSION}`;
  }

  if (pathname === "/configurar/slas") {
    return `Tela | SLAs ${SLAS_PAGE_VERSION}`;
  }

  if (pathname === "/configurar/slas/calendarios") {
    return `Tela | Calendários de SLA ${CALENDARIOS_SLA_PAGE_VERSION}`;
  }

  if (pathname.startsWith("/cadastros/parceiros")) {
    return `Tela | Clientes / Parceiros ${PARCEIROS_PAGE_VERSION}`;
  }

  if (pathname.startsWith("/cadastros/contratos")) {
    return `Tela | Contratos ${CONTRATOS_PAGE_VERSION}`;
  }

  if (pathname.startsWith("/cadastros/organizacoes")) {
    return `Tela | Organizações ${ORGANIZACOES_PAGE_VERSION}`;
  }

  if (pathname === "/ferramentas/base-conhecimento") {
    return `Tela | Base de Conhecimento ${BASE_CONHECIMENTO_PAGE_VERSION}`;
  }

  return null;
}

function hasAppChrome(pathname: string) {
  return pathname === "/" || appChromePrefixes.some((prefix) => pathname.startsWith(prefix));
}

export function VersionBadge() {
  const pathname = usePathname();
  const [openPathname, setOpenPathname] = useState<string | null>(null);
  const pageVersion = getPageVersion(pathname);
  const globalVersion = `${APP_VERSION} - ${formatarDataVersao(APP_UPDATED_AT)}`;
  const isOpen = openPathname === pathname;
  const showAppFooter = hasAppChrome(pathname);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPathname(null);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <div className="qe-version-control">
        {isOpen ? (
          <div id="qe-version-panel" className="qe-version-panel" role="status">
            <span className="qe-version-panel-label">Versionamento</span>
            <span className="qe-version-panel-global">{globalVersion}</span>
            {pageVersion ? <span className="qe-version-panel-page">{pageVersion}</span> : null}
          </div>
        ) : null}
        <button
          type="button"
          className="qe-version-button"
          onClick={() =>
            setOpenPathname((current) => (current === pathname ? null : pathname))
          }
          aria-expanded={isOpen}
          aria-controls="qe-version-panel"
          aria-label="Abrir versionamento do sistema"
          title={`${globalVersion}${pageVersion ? ` | ${pageVersion}` : ""}`}
        >
          <span className="qe-version-button-icon" aria-hidden="true">v</span>
          <span className="qe-version-button-text">
            <span className="qe-version-button-global">{globalVersion}</span>
            {pageVersion ? <span className="qe-version-button-page">{pageVersion}</span> : null}
          </span>
        </button>
      </div>

      {showAppFooter ? (
      <footer className="qe-app-footer" aria-label="Links principais e informações do sistema">
        <div className="qe-app-footer-inner">
          <div className="qe-app-footer-top">
            <section className="qe-app-footer-brand" aria-label="Quarta Etapa">
              <p className="qe-app-footer-kicker">QUARTA ETAPA</p>
              <h2>Portal de Atendimento Quarta Etapa</h2>
              <p>
                Abertura, acompanhamento e gestão de chamados técnicos.
              </p>
            </section>
            <p className="qe-app-footer-company">
              Ambiente interno de gestão operacional, suporte técnico e governança
              de atendimento.
            </p>
          </div>

          <nav className="qe-app-footer-links" aria-label="Links principais do sistema">
            {footerGroups.map((group) => (
              <section key={group.title} className="qe-app-footer-group">
                <h3>{group.title}</h3>
                <ul>
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={() => setOpenPathname(null)}
                        className={pathname === link.href ? "qe-app-footer-link-active" : undefined}
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </nav>

          <div className="qe-app-footer-bottom">
            <p>
              © 2026 Quarta Etapa. Versão global {APP_VERSION} publicada em{" "}
              {formatarDataVersao(APP_UPDATED_AT)}.
            </p>
            <nav aria-label="Links legais">
              <Link href="/politica-privacidade">Privacidade</Link>
              <Link href="/termos-uso">Termos de uso</Link>
              <Link href="/changelog">Changelog</Link>
            </nav>
          </div>
        </div>
      </footer>
      ) : null}
    </>
  );
}
