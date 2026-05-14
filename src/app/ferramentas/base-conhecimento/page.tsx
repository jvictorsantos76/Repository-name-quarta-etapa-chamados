import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import {
  podeConsultarBaseConhecimento,
  podeGerenciarCatalogosChamado,
} from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { salvarArtigoBaseConhecimento } from "./actions";

type ArtigoBase = {
  id: string;
  titulo: string;
  resumo: string | null;
  conteudo: string | null;
  url: string | null;
  ordem: number | null;
  ativo: boolean;
};

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find the table")
  );
}

export default async function BaseConhecimentoPage() {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeConsultarBaseConhecimento(perfilAtual.papel)) {
    notFound();
  }

  const podeEditar = podeGerenciarCatalogosChamado(perfilAtual.papel);
  const supabase = await createSupabaseServerClient();
  const query = supabase
    .from("bases_conhecimento")
    .select("id, titulo, resumo, conteudo, url, ordem, ativo")
    .order("ordem")
    .order("titulo");
  const { data, error } = podeEditar ? await query : await query.eq("ativo", true);
  const artigos = isSchemaCacheError(error?.message)
    ? []
    : (data as ArtigoBase[] | null) ?? [];

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-6xl px-6 pb-10 md:px-8">
        <div className="mb-6">
          <Link href="/chamados/novo" className="text-sm font-semibold text-blue-600">
            Voltar para novo chamado
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-950">
            Base de conhecimento
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Artigos operacionais para triagem, diagnóstico, atendimento e encerramento de chamados.
          </p>
        </div>

        {error && !isSchemaCacheError(error.message) ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Não foi possível carregar os artigos.
          </div>
        ) : null}

        {podeEditar ? (
          <section className="mb-6 rounded-xl bg-white p-5 shadow">
            <h2 className="text-lg font-bold">Novo artigo</h2>
            <ArtigoForm />
          </section>
        ) : null}

        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold">Artigos</h2>
          <div className="mt-4 space-y-3">
            {artigos.map((artigo) =>
              podeEditar ? (
                <ArtigoForm key={artigo.id} artigo={artigo} />
              ) : (
                <article key={artigo.id} className="rounded-lg border border-gray-200 p-4">
                  <h3 className="font-bold">{artigo.titulo}</h3>
                  {artigo.resumo ? (
                    <p className="mt-2 text-sm text-gray-600">{artigo.resumo}</p>
                  ) : null}
                  {artigo.conteudo ? (
                    <p className="mt-3 whitespace-pre-line text-sm text-gray-700">
                      {artigo.conteudo}
                    </p>
                  ) : null}
                  {artigo.url ? (
                    <a
                      href={artigo.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 block break-all text-sm font-semibold text-blue-600"
                    >
                      {artigo.url}
                    </a>
                  ) : null}
                </article>
              )
            )}

            {artigos.length === 0 ? (
              <p className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
                Nenhum artigo ativo cadastrado.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}

function ArtigoForm({ artigo }: { artigo?: ArtigoBase }) {
  return (
    <form
      action={salvarArtigoBaseConhecimento}
      className="mt-4 grid gap-4 rounded-lg border border-gray-200 p-4"
    >
      <input type="hidden" name="id" value={artigo?.id ?? ""} />
      <div className="grid gap-4 md:grid-cols-3">
        <CampoTexto
          name="titulo"
          label="Título"
          defaultValue={artigo?.titulo ?? ""}
          required
        />
        <CampoTexto
          name="url"
          label="URL"
          defaultValue={artigo?.url ?? ""}
          placeholder="https://..."
        />
        <CampoTexto
          name="ordem"
          label="Ordem"
          defaultValue={String(artigo?.ordem ?? 0)}
        />
      </div>
      <CampoTexto
        name="resumo"
        label="Resumo"
        defaultValue={artigo?.resumo ?? ""}
      />
      <label className="block text-sm font-semibold">
        Conteúdo
        <textarea
          name="conteudo"
          defaultValue={artigo?.conteudo ?? ""}
          rows={4}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal"
        />
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="ativo" defaultChecked={artigo?.ativo ?? true} />
          Ativo
        </label>
        <button
          type="submit"
          className="min-h-10 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        >
          {artigo ? "Atualizar artigo" : "Salvar artigo"}
        </button>
      </div>
    </form>
  );
}

function CampoTexto({
  name,
  label,
  defaultValue = "",
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold">
      {label}
      <input
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-normal"
      />
    </label>
  );
}
