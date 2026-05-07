import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { PERFIL_USUARIO_PAGE_VERSION } from "@/config/version";
import {
  isPapelUsuario,
  LABEL_PAPEL_USUARIO,
  podeAdministrarUsuarios,
} from "@/lib/auth/permissions";
import type { PerfilAutenticado } from "@/lib/auth/types";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { PerfilUsuarioForm } from "./PerfilUsuarioForm";

type PageProps = {
  searchParams?: Promise<{
    usuario?: string | string[];
  }>;
};

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getIniciais(nome: string) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return iniciais || "QE";
}

function normalizarUsuarioParam(usuario: string | string[] | undefined) {
  return Array.isArray(usuario) ? usuario[0] : usuario;
}

async function carregarPerfilAlvo(
  perfilAtual: PerfilAutenticado,
  usuarioParam: string | undefined
) {
  const podeEditarOutroPerfil = podeAdministrarUsuarios(perfilAtual.papel);

  if (!usuarioParam) {
    return {
      perfil: perfilAtual,
      aviso: undefined,
      modoAdministrativo: podeEditarOutroPerfil,
    };
  }

  if (!UUID_REGEX.test(usuarioParam)) {
    return {
      perfil: perfilAtual,
      aviso: "Usuário informado na URL é inválido. Exibindo seu próprio perfil.",
      modoAdministrativo: podeEditarOutroPerfil,
    };
  }

  if (usuarioParam === perfilAtual.id) {
    return {
      perfil: perfilAtual,
      aviso: undefined,
      modoAdministrativo: podeEditarOutroPerfil,
    };
  }

  if (!podeEditarOutroPerfil) {
    return {
      perfil: perfilAtual,
      aviso:
        "Você não tem permissão para visualizar ou editar o perfil de outro usuário.",
      modoAdministrativo: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("perfis")
    .select(
      "id, nome_completo, email, papel, ativo, telefone, avatar_url, biografia, cargo, cliente_id, loja_id, tema_preferido, cor_preferida, fonte_escala"
    )
    .eq("id", usuarioParam)
    .maybeSingle();

  if (error || !data || !isPapelUsuario(data.papel)) {
    return {
      perfil: perfilAtual,
      aviso:
        "Não foi possível carregar o usuário solicitado. Verifique a permissão e o ID informado.",
      modoAdministrativo: podeEditarOutroPerfil,
    };
  }

  return {
    perfil: data as PerfilAutenticado,
    aviso: undefined,
    modoAdministrativo: true,
  };
}

export default async function PerfilPage({ searchParams }: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();
  const parametros = await searchParams;
  const usuarioParam = normalizarUsuarioParam(parametros?.usuario);
  const { perfil, aviso, modoAdministrativo } = await carregarPerfilAlvo(
    perfilAtual,
    usuarioParam
  );
  const editandoOutroPerfil = perfil.id !== perfilAtual.id;
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-4 md:px-8 md:pt-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <nav
              aria-label="Navegação da conta"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600"
            >
              <Link href="/" className="hover:text-gray-950">
                Chamados
              </Link>
              <span aria-hidden="true" className="text-gray-400">
                &gt;
              </span>
              <span className="text-gray-950">Perfil de usuário</span>
            </nav>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Perfil de usuário
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              {perfil.nome_completo}
              {perfil.email ? `, ${perfil.email}` : ""} ·{" "}
              <Link href="/" className="font-semibold text-gray-950 underline">
                Voltar para chamados
              </Link>
            </p>
          </div>
          <span className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
            Tela v{PERFIL_USUARIO_PAGE_VERSION.replace(/^v/, "")}
          </span>
        </div>

        <div className="grid gap-10 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="h-fit border-b border-gray-200 pb-6 lg:border-b-0 lg:pb-0">
            <div className="flex items-center gap-4 lg:block">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-950 text-lg font-bold text-white ring-4 ring-gray-100 lg:h-20 lg:w-20 lg:text-xl">
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
              <div className="min-w-0 lg:mt-4">
                <h2 className="break-words text-lg font-bold text-gray-950">
                  {perfil.nome_completo}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {LABEL_PAPEL_USUARIO[perfil.papel]}
                  {perfil.cargo ? ` · ${perfil.cargo}` : ""}
                </p>
                <p className="mt-2 w-fit rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                  {editandoOutroPerfil
                    ? "Edição administrativa"
                    : "Meu perfil"}
                </p>
              </div>
            </div>
          </aside>

          <PerfilUsuarioForm
            perfil={perfil}
            perfilAtual={perfilAtual}
            modoAdministrativo={modoAdministrativo}
            aviso={aviso}
          />
        </div>
      </section>
    </main>
  );
}
