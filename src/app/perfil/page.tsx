import { revalidatePath } from "next/cache";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { PERFIL_USUARIO_PAGE_VERSION } from "@/config/version";
import { LABEL_PAPEL_USUARIO } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

async function atualizarPerfil(formData: FormData) {
  "use server";

  const perfil = await requirePerfilAutenticado();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const biografia = String(formData.get("biografia") ?? "").trim();

  if (avatarUrl && !/^https?:\/\/.+/i.test(avatarUrl)) {
    return;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("perfis")
    .update({
      telefone: telefone || null,
      avatar_url: avatarUrl || null,
      biografia: biografia || null,
    })
    .eq("id", perfil.id);

  if (error) {
    return;
  }

  revalidatePath("/perfil");
}

export default async function PerfilPage() {
  const perfil = await requirePerfilAutenticado();

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfil} />
      <section className="mx-auto max-w-4xl px-6 pb-8 md:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            Voltar para chamados
          </Link>
          <span className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
            Tela v{PERFIL_USUARIO_PAGE_VERSION.replace(/^v/, "")}
          </span>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Perfil de usuário
          </p>
          <h1 className="mt-2 text-2xl font-bold">Dados básicos</h1>
          <p className="mt-2 text-sm text-gray-600">
            Consulte seu nível de acesso e mantenha dados pessoais básicos
            atualizados. O nível operacional é definido pela administração.
          </p>

          <div className="mt-6 grid gap-4 text-sm md:grid-cols-2">
            <Info label="Nome" value={perfil.nome_completo} />
            <Info label="E-mail" value={perfil.email ?? "Não informado"} />
            <Info label="Nível" value={LABEL_PAPEL_USUARIO[perfil.papel]} />
            <Info label="Cargo" value={perfil.cargo ?? "Não informado"} />
          </div>

          <form action={atualizarPerfil} className="mt-8 space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <CampoTexto
                label="Telefone"
                name="telefone"
                defaultValue={perfil.telefone ?? ""}
              />
              <CampoTexto
                label="URL da foto"
                name="avatar_url"
                defaultValue={perfil.avatar_url ?? ""}
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Biografia
              </label>
              <textarea
                name="biografia"
                defaultValue={perfil.biografia ?? ""}
                rows={4}
                maxLength={500}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                className="min-h-11 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800"
              >
                Salvar perfil
              </button>
              <Link
                href="/auth/alterar-senha"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Alterar senha
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
      <dd className="mt-1 font-medium text-gray-900">{value}</dd>
    </div>
  );
}

function CampoTexto({
  label,
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
