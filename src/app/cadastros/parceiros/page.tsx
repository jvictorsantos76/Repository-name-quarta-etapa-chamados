import Link from "next/link";
import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { PARCEIROS_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import { ParceirosTable } from "./ParceirosTable";
import type { ParceiroResumo } from "./types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") ||
      message?.includes("Could not find the table") ||
      message?.includes("Could not find") ||
      message?.includes("column")
  );
}

function selecionarParceiros(incluirCalendarioFuncionamento = true) {
  return [
    "id",
    "tipo_parceiro",
    "tipo_pessoa",
    "razao_social",
    "nome_fantasia",
    "codigo_interno",
    "cnpj_cpf",
    "situacao",
    "segmento",
    "ativo",
    "cliente_legado_id",
    "organizacao_id",
    incluirCalendarioFuncionamento ? "calendario_funcionamento_id" : null,
    "criado_em",
    "atualizado_em",
  ]
    .filter(Boolean)
    .join(", ");
}

async function getSearchParam(
  searchParams: PageProps["searchParams"],
  key: string
) {
  const params = searchParams ? await searchParams : {};
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

export default async function ParceirosPage({ searchParams }: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  let parceirosResposta = await supabase
    .from("parceiros")
    .select(selecionarParceiros())
    .order("nome_fantasia");
  const calendarioFuncionamentoPendente = Boolean(
    parceirosResposta.error && isSchemaCacheError(parceirosResposta.error.message)
  );

  if (calendarioFuncionamentoPendente) {
    parceirosResposta = await supabase
      .from("parceiros")
      .select(selecionarParceiros(false))
      .order("nome_fantasia");
  }

  const [clientesResposta, filiaisResposta] = await Promise.all([
    supabase.from("clientes").select("id, nome_fantasia"),
    supabase.from("parceiros_filiais").select("id, parceiro_id"),
  ]);
  const { data, error } = parceirosResposta;
  const clientesPorId = new Map<string, string>();
  const filiaisPorParceiro = new Map<string, number>();

  if (!clientesResposta.error) {
    for (const cliente of
      (clientesResposta.data as { id: string; nome_fantasia: string }[] | null) ??
      []) {
      clientesPorId.set(cliente.id, cliente.nome_fantasia);
    }
  }

  if (!filiaisResposta.error) {
    for (const filial of
      (filiaisResposta.data as { id: string; parceiro_id: string }[] | null) ??
      []) {
      filiaisPorParceiro.set(
        filial.parceiro_id,
        (filiaisPorParceiro.get(filial.parceiro_id) ?? 0) + 1
      );
    }
  }

  const parceiros =
    error && isSchemaCacheError(error.message)
      ? []
      : ((data as ParceiroResumo[] | null) ?? []).map((parceiro) => ({
          ...parceiro,
          cliente_legado_nome: parceiro.cliente_legado_id
            ? clientesPorId.get(parceiro.cliente_legado_id) ?? null
            : null,
          filiais_count: filiaisPorParceiro.get(parceiro.id) ?? 0,
        }));
  const erro = await getSearchParam(searchParams, "erro");
  const salvo = await getSearchParam(searchParams, "salvo");

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
        <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <nav
              aria-label="Navegação de cadastros"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600"
            >
              <span>Cadastros</span>
              <span aria-hidden="true" className="text-gray-400">
                &gt;
              </span>
              <span className="text-gray-950">Clientes / Parceiros</span>
            </nav>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-gray-950 sm:text-2xl">
                Clientes / Parceiros
              </h1>
              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {PARCEIROS_PAGE_VERSION}
              </span>
            </div>
            <p className="mt-1 max-w-3xl text-sm text-gray-600">
              Cadastro mestre ERP operacional para clientes, fornecedores, fabricantes, terceirizados e transportadoras.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <span className="w-fit rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
              Total: {parceiros.length}
            </span>
            <Link
              href="/cadastros/parceiros/nova"
              className="inline-flex min-h-10 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              Novo parceiro
            </Link>
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-sky-100 bg-sky-50 p-3 text-sm text-sky-900">
          <strong className="font-semibold">Domínio:</strong> organizações seguem como agrupamento interno do sistema; parceiros concentram o cadastro mestre operacional usado por atendimento, SLA, contratos, filiais e faturamento.
        </div>

        {calendarioFuncionamentoPendente && !error ? (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-semibold text-amber-800">
            A migration de horários de funcionamento ainda não foi aplicada. A listagem foi carregada em modo de compatibilidade.
          </div>
        ) : null}

        {error && !isSchemaCacheError(error.message) ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            Não foi possível carregar os parceiros.
          </div>
        ) : null}

        {erro ? (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {erro}
          </div>
        ) : null}

        {salvo ? (
          <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
            Cadastro salvo com sucesso.
          </div>
        ) : null}

        <ParceirosTable parceiros={parceiros} />
      </section>
    </main>
  );
}
