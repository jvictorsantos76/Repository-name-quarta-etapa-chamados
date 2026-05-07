import { redirect } from "next/navigation";

type PageProps = {
  searchParams?: Promise<{
    usuario?: string | string[];
  }>;
};

function normalizarUsuarioParam(usuario: string | string[] | undefined) {
  return Array.isArray(usuario) ? usuario[0] : usuario;
}

export default async function PerfilCompatPage({ searchParams }: PageProps) {
  const parametros = await searchParams;
  const usuario = normalizarUsuarioParam(parametros?.usuario);

  redirect(
    usuario
      ? `/conta/perfil?usuario=${encodeURIComponent(usuario)}`
      : "/conta/perfil"
  );
}
