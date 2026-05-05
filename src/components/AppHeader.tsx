import Link from "next/link";
import type { PerfilAutenticado } from "@/lib/auth/types";
import { LABEL_PAPEL_USUARIO } from "@/lib/auth/permissions";

function getIniciais(nome: string) {
  return nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
}

export function AppHeader({ perfil }: { perfil: PerfilAutenticado }) {
  return (
    <header className="mb-6 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-8">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <Link href="/" className="text-sm font-bold text-gray-900">
          Quarta Etapa Chamados
        </Link>
        <Link
          href="/perfil"
          className="flex min-h-11 items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left hover:bg-gray-100"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-900 text-xs font-bold text-white">
            {perfil.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={perfil.avatar_url}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              getIniciais(perfil.nome_completo)
            )}
          </span>
          <span className="min-w-0">
            <span className="block max-w-40 truncate text-sm font-semibold text-gray-900">
              {perfil.nome_completo}
            </span>
            <span className="block text-xs text-gray-600">
              {LABEL_PAPEL_USUARIO[perfil.papel]}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
