import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  salvarCatalogoChamado,
  type CatalogoChamadoKind,
} from "./catalogos-actions";

type CatalogoItem = {
  id: string;
  nome: string;
  descricao: string | null;
  ordem: number | null;
  ativo: boolean;
  codigo?: string | null;
  cor?: string | null;
  eh_padrao?: boolean | null;
};

type CatalogoChamadosPageProps = {
  kind: CatalogoChamadoKind;
  titulo: string;
  descricao: string;
  tabela: "chamado_status" | "chamado_tipos" | "chamado_origens" | "grupos_atendimento";
};

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find the table")
  );
}

export async function CatalogoChamadosPage({
  kind,
  titulo,
  descricao,
  tabela,
}: CatalogoChamadosPageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const selectCampos =
    kind === "status"
      ? "id, codigo, nome, descricao, cor, ordem, ativo, eh_padrao"
      : "id, nome, descricao, ordem, ativo";
  const { data, error } = await supabase
    .from(tabela)
    .select(selectCampos)
    .order("ordem")
    .order("nome");
  const itens = isSchemaCacheError(error?.message)
    ? []
    : (data as CatalogoItem[] | null) ?? [];

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-6xl px-6 pb-10 md:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/chamados/novo" className="text-sm font-semibold text-blue-600">
              Voltar para novo chamado
            </Link>
            <h1 className="mt-3 text-2xl font-bold text-gray-950">{titulo}</h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">{descricao}</p>
          </div>
        </div>

        {error && !isSchemaCacheError(error.message) ? (
          <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            Não foi possível carregar os registros.
          </div>
        ) : null}

        <section className="mb-6 rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold">Novo item</h2>
          <form action={salvarCatalogoChamado} className="mt-4 grid gap-4 md:grid-cols-5">
            <input type="hidden" name="kind" value={kind} />
            {kind === "status" ? (
              <CampoTexto name="codigo" label="Código" placeholder="pendente_agendamento" />
            ) : null}
            <CampoTexto name="nome" label="Nome" required />
            <CampoTexto name="descricao" label="Descrição" />
            {kind === "status" ? <CampoTexto name="cor" label="Cor" placeholder="#2563eb" /> : null}
            <CampoTexto name="ordem" label="Ordem" defaultValue="0" />
            <label className="flex items-center gap-2 self-end text-sm font-semibold">
              <input type="checkbox" name="ativo" defaultChecked />
              Ativo
            </label>
            {kind === "status" ? (
              <label className="flex items-center gap-2 self-end text-sm font-semibold">
                <input type="checkbox" name="eh_padrao" />
                Padrão
              </label>
            ) : null}
            <button
              type="submit"
              className="min-h-10 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              Salvar
            </button>
          </form>
        </section>

        <section className="rounded-xl bg-white p-5 shadow">
          <h2 className="text-lg font-bold">Registros</h2>
          <div className="mt-4 space-y-3">
            {itens.map((item) => (
              <form
                key={item.id}
                action={salvarCatalogoChamado}
                className="grid gap-3 rounded-lg border border-gray-200 p-4 md:grid-cols-6"
              >
                <input type="hidden" name="kind" value={kind} />
                <input type="hidden" name="id" value={item.id} />
                {kind === "status" ? (
                  <CampoTexto name="codigo" label="Código" defaultValue={item.codigo ?? ""} />
                ) : null}
                <CampoTexto name="nome" label="Nome" defaultValue={item.nome} required />
                <CampoTexto name="descricao" label="Descrição" defaultValue={item.descricao ?? ""} />
                {kind === "status" ? (
                  <CampoTexto name="cor" label="Cor" defaultValue={item.cor ?? ""} />
                ) : null}
                <CampoTexto name="ordem" label="Ordem" defaultValue={String(item.ordem ?? 0)} />
                <label className="flex items-center gap-2 self-end text-sm font-semibold">
                  <input type="checkbox" name="ativo" defaultChecked={item.ativo} />
                  Ativo
                </label>
                {kind === "status" ? (
                  <label className="flex items-center gap-2 self-end text-sm font-semibold">
                    <input
                      type="checkbox"
                      name="eh_padrao"
                      defaultChecked={Boolean(item.eh_padrao)}
                    />
                    Padrão
                  </label>
                ) : null}
                <button
                  type="submit"
                  className="min-h-10 self-end rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                >
                  Atualizar
                </button>
              </form>
            ))}

            {itens.length === 0 ? (
              <p className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
                Nenhum registro cadastrado.
              </p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
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
