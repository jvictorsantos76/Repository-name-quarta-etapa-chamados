"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  APP_UPDATED_AT,
  APP_VERSION,
  CADASTRO_USUARIO_PAGE_VERSION,
  LOGIN_PAGE_VERSION,
  PERFIL_USUARIO_PAGE_VERSION,
  SOLICITACOES_ACESSO_PAGE_VERSION,
} from "@/config/version";

const footerLinks = [
  { label: "Dashboard", href: "/" },
  { label: "Novo chamado", href: "/chamados/novo" },
  { label: "Usuários e acessos", href: "/admin/usuarios" },
  { label: "Permissões", href: "/conta/permissoes" },
  { label: "FAQ", href: "/faq/permissoes" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Changelog", href: "/changelog" },
  { label: "Termos", href: "/termos-uso" },
  { label: "Privacidade", href: "/politica-privacidade" },
];

function formatarDataVersao(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${data}T00:00:00Z`));
}

function FooterIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="M4 5h16" />
      <path d="M4 12h16" />
      <path d="M4 19h10" />
    </svg>
  );
}

export function VersionBadge() {
  const pathname = usePathname();
  const [compactOpen, setCompactOpen] = useState(false);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const pageVersion =
    pathname === "/login"
      ? `Tela de Login ${LOGIN_PAGE_VERSION}`
      : pathname === "/cadastro"
        ? `Tela | Cadastro de Usuário ${CADASTRO_USUARIO_PAGE_VERSION}`
        : pathname === "/admin/usuarios"
          ? `Tela | Solicitações de Acesso ${SOLICITACOES_ACESSO_PAGE_VERSION}`
          : pathname === "/perfil"
            ? `Tela | Perfil de Usuário ${PERFIL_USUARIO_PAGE_VERSION}`
            : null;

  useEffect(() => {
    if (!compactOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (target instanceof Node && !footerRef.current?.contains(target)) {
        setCompactOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setCompactOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [compactOpen]);

  return (
    <div ref={footerRef} className="qe-app-footer" aria-label="Links principais">
      <div className={`qe-app-footer-panel ${compactOpen ? "qe-app-footer-panel-open" : ""}`}>
        <div className="qe-app-footer-version">
          <span className="font-semibold">
            {APP_VERSION} - {formatarDataVersao(APP_UPDATED_AT)}
          </span>
          {pageVersion ? <span>{pageVersion}</span> : null}
        </div>
        <nav className="qe-app-footer-links" aria-label="Links principais do sistema">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setCompactOpen(false)}
              className={pathname === link.href ? "qe-app-footer-link-active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <button
        type="button"
        className="qe-app-footer-toggle"
        onClick={() => setCompactOpen((current) => !current)}
        aria-expanded={compactOpen}
        aria-label="Abrir links principais e versão do sistema"
        title={`${APP_VERSION} - ${formatarDataVersao(APP_UPDATED_AT)}`}
      >
        <FooterIcon />
        <span className="sr-only">Links principais</span>
      </button>
    </div>
  );
}
