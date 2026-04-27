import Link from "next/link";
import { APP_UPDATED_AT, APP_VERSION } from "@/config/version";

function formatarDataVersao(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${data}T00:00:00Z`));
}

export function VersionBadge() {
  return (
    <div className="fixed bottom-3 left-3 z-40 flex flex-col gap-1 rounded-lg border border-gray-200 bg-white/95 px-3 py-2 text-xs text-gray-600 shadow-sm backdrop-blur">
      <span className="font-semibold text-gray-900">
        {APP_VERSION} — {formatarDataVersao(APP_UPDATED_AT)}
      </span>
      <Link href="/changelog" className="font-semibold text-blue-600">
        Ver atualizações
      </Link>
    </div>
  );
}
