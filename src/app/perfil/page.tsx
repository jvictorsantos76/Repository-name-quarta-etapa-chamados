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
      "id, nome_completo, email, papel, ativo, telefone, avatar_url, biografia, cargo, cliente_id, loja_id"
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
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-6xl px-6 pb-10 md:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            Voltar para chamados
          </Link>
          <span className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
            Tela v{PERFIL_USUARIO_PAGE_VERSION.replace(/^v/, "")}
          </span>
        </div>

        <div className="mb-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-gray-950 px-6 py-6 text-white">
            <p className="text-xs font-semibold uppercase text-blue-200">
              Perfil de usuário
            </p>
            <h1 className="mt-2 text-2xl font-bold">
              Account / Personal info
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-200">
              Consulte dados básicos, segurança e preferências do perfil
              operacional vinculado ao Supabase.
            </p>
          </div>

          <div className="flex flex-col gap-5 px-6 py-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-950 text-xl font-bold text-white ring-4 ring-gray-100">
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
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="break-words text-xl font-bold text-gray-950">
                    {perfil.nome_completo}
                  </h2>
                  {editandoOutroPerfil ? (
                    <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      Admin
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm font-medium text-gray-700">
                  {LABEL_PAPEL_USUARIO[perfil.papel]}
                  {perfil.cargo ? ` · ${perfil.cargo}` : ""}
                </p>
                <p className="mt-1 break-words text-sm text-gray-500">
                  {perfil.email ?? "E-mail não informado"}
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 md:max-w-xs">
              <span className="block text-xs font-semibold uppercase text-gray-500">
                Escopo de edição
              </span>
              <span className="mt-1 block font-medium text-gray-950">
                {editandoOutroPerfil
                  ? "Perfil de outro usuário"
                  : "Meu próprio perfil"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="h-fit rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">
              Configurações
            </p>
            <nav className="mt-4 space-y-2 text-sm font-medium">
              <a
                href="#dados-basicos"
                className="block rounded-lg bg-gray-950 px-3 py-2 text-white"
              >
                Dados básicos
              </a>
              <a
                href="#seguranca"
                className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                Segurança
              </a>
              <a
                href="#preferencias"
                className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                Preferências / Perfil
              </a>
            </nav>
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
