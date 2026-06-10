import { notFound } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { CONTRATOS_PAGE_VERSION } from "@/config/version";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  ContratosClient,
  type ContratoListItem,
  type ContratoParceiroOpcao,
} from "./ContratosClient";
import type { StatusContrato } from "../parceiros/types";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

async function getSearchParam(
  searchParams: PageProps["searchParams"],
  key: string
) {
  const params = searchParams ? await searchParams : {};
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

type ContratoRow = {
  id: string;
  parceiro_id: string;
  contrato: string;
  vigencia_inicio: string | null;
  vigencia_fim: string | null;
  sla: string | null;
  status: StatusContrato;
  observacoes: string | null;
};

type ParceiroRow = {
  id: string;
  razao_social: string;
  nome_fantasia: string;
  codigo_interno: string | null;
  ativo: boolean;
};

export default async function ContratosPage({ searchParams }: PageProps) {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    notFound();
  }

  const supabase = createSupabaseAdminClient();
  const [contratosResposta, parceirosResposta] = await Promise.all([
    supabase
      .from("parceiros_contratos")
      .select("id, parceiro_id, contrato, vigencia_inicio, vigencia_fim, sla, status, observacoes")
      .order("atualizado_em", { ascending: false }),
    supabase
      .from("parceiros")
      .select("id, razao_social, nome_fantasia, codigo_interno, ativo")
      .order("nome_fantasia"),
  ]);

  const parceirosBase = (parceirosResposta.data as ParceiroRow[] | null) ?? [];
  const parceirosPorId = new Map(
    parceirosBase.map((parceiro) => [
      parceiro.id,
      parceiro.nome_fantasia || parceiro.razao_social,
    ])
  );
  const parceiros: ContratoParceiroOpcao[] = parceirosBase.map((parceiro) => ({
    id: parceiro.id,
    nome: parceiro.nome_fantasia || parceiro.razao_social,
    codigo_interno: parceiro.codigo_interno,
    ativo: parceiro.ativo,
  }));
  const contratos: ContratoListItem[] =
    ((contratosResposta.data as ContratoRow[] | null) ?? []).map((contrato) => ({
      ...contrato,
      parceiro_nome: parceirosPorId.get(contrato.parceiro_id) ?? "Cliente não encontrado",
    }));
  const erro = await getSearchParam(searchParams, "erro");
  const salvo = await getSearchParam(searchParams, "salvo");
  const parceiroInicial = await getSearchParam(searchParams, "parceiro");

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <ContratosClient
        contratos={contratos}
        parceiros={parceiros}
        parceiroInicial={parceiroInicial}
        pageVersion={CONTRATOS_PAGE_VERSION}
        erro={erro}
        salvo={salvo}
      />
    </main>
  );
}
