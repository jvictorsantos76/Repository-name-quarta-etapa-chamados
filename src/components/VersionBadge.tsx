"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  APP_UPDATED_AT,
  APP_VERSION,
  LOGIN_PAGE_VERSION,
} from "@/config/version";

function formatarDataVersao(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${data}T00:00:00Z`));
}

export function VersionBadge() {
  const pathname = usePathname();
  const pageVersion =
    pathname === "/login" ? `Tela de Login ${LOGIN_PAGE_VERSION}` : null;

  return (
    <div className="mx-4 mb-4 mt-4 flex w-fit max-w-[calc(100%-2rem)] flex-col gap-1 self-start rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 md:fixed md:bottom-3 md:left-3 md:z-40 md:m-0 md:bg-white/95 md:shadow-sm md:backdrop-blur">
      <span className="font-semibold text-gray-900">
        {APP_VERSION} — {formatarDataVersao(APP_UPDATED_AT)}
      </span>
      {pageVersion && (
        <span className="font-medium text-gray-700">{pageVersion}</span>
      )}
      <Link href="/changelog" className="font-semibold text-blue-600">
        Ver atualizações
      </Link>
    </div>
  );
}
