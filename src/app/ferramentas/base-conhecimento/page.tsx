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
import {
  BaseConhecimentoClient,
  type BaseConhecimentoAnexo,
  type BaseConhecimentoArtigo,
  type BaseConhecimentoCategoria,
  type BaseConhecimentoOrganizacao,
  type BaseConhecimentoStatus,
  type BaseConhecimentoTag,
  type BaseConhecimentoTipo,
  type BaseConhecimentoUsuario,
} from "./BaseConhecimentoClient";

type ArtigoTagRow = {
  artigo_id: string;
  tag_id: string;
};

type ArtigoOrganizacaoRow = {
  artigo_id: string;
  organizacao_id: string;
};

type ArtigoUsuarioRow = {
  artigo_id: string;
  usuario_id: string;
};

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") ||
      message?.includes("Could not find") ||
      message?.includes("does not exist")
  );
}

export default async function BaseConhecimentoPage() {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeConsultarBaseConhecimento(perfilAtual.papel)) {
    notFound();
  }

  const podeEditar = podeGerenciarCatalogosChamado(perfilAtual.papel);
  const supabase = await createSupabaseServerClient();

  const [
    artigosResposta,
    categoriasResposta,
    tagsResposta,
    statusResposta,
    tiposResposta,
    organizacoesResposta,
    artigoTagsResposta,
    artigoOrganizacoesResposta,
    usuariosResposta,
    artigoUsuariosResposta,
    anexosResposta,
  ] = await Promise.all([
      supabase
        .from("bases_conhecimento")
        .select(
          [
            "id",
            "titulo",
            "slug",
            "tipo",
            "status",
            "confidencialidade",
            "publico_alvo",
            "categoria_id",
            "resumo",
            "conteudo",
            "url",
            "ordem",
            "ativo",
            "atualizado_em",
            "publicado_em",
            "revisado_em",
            "proxima_revisao_em",
          ].join(", ")
        )
        .order("ordem")
        .order("titulo"),
      supabase
        .from("base_conhecimento_categorias")
        .select("id, nome, slug, cor, ativo")
        .order("ordem")
        .order("nome"),
      supabase
        .from("base_conhecimento_tags")
        .select("id, nome, slug, cor, ativo")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("base_conhecimento_status")
        .select("id, codigo, nome, descricao, cor, ordem, ativo, eh_padrao, publica_artigo, arquiva_artigo")
        .eq("ativo", true)
        .order("ordem")
        .order("nome"),
      supabase
        .from("base_conhecimento_tipos")
        .select("id, codigo, nome, descricao, ordem, ativo, eh_padrao")
        .eq("ativo", true)
        .order("ordem")
        .order("nome"),
      supabase
        .from("organizacoes")
        .select("id, nome, tipo_organizacao, ativo")
        .eq("ativo", true)
        .order("nome"),
      supabase
        .from("base_conhecimento_artigo_tags")
        .select("artigo_id, tag_id")
        .eq("ativo", true),
      supabase
        .from("base_conhecimento_organizacoes")
        .select("artigo_id, organizacao_id")
        .eq("ativo", true),
      podeEditar
        ? supabase
            .from("perfis")
            .select("id, nome_completo, email, papel")
            .eq("ativo", true)
            .in("papel", ["super_admin", "admin", "analista", "tecnico_quarta", "tecnico_terceirizado"])
            .order("nome_completo")
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("base_conhecimento_usuarios")
        .select("artigo_id, usuario_id")
        .eq("ativo", true),
      supabase
        .from("base_conhecimento_anexos")
        .select("id, artigo_id, nome_arquivo, tipo_mime, tamanho_bytes, criado_em")
        .eq("ativo", true)
        .order("criado_em", { ascending: false }),
    ]);

  const respostas = [
    artigosResposta,
    categoriasResposta,
    tagsResposta,
    statusResposta,
    tiposResposta,
    organizacoesResposta,
    artigoTagsResposta,
    artigoOrganizacoesResposta,
    usuariosResposta,
    artigoUsuariosResposta,
    anexosResposta,
  ];
  const erro = respostas.find((resposta) => resposta.error)?.error;
  const migrationPendente = isSchemaCacheError(erro?.message);
  const erroCarregamento =
    erro && !migrationPendente
      ? "Não foi possível carregar a Base de Conhecimento."
      : migrationPendente
        ? "A estrutura editorial da Base de Conhecimento ainda não foi aplicada no banco."
        : null;

  const categorias = migrationPendente
    ? []
    : ((categoriasResposta.data as BaseConhecimentoCategoria[] | null) ?? []);
  const tags = migrationPendente
    ? []
    : ((tagsResposta.data as BaseConhecimentoTag[] | null) ?? []);
  const statusOptions = migrationPendente
    ? []
    : ((statusResposta.data as BaseConhecimentoStatus[] | null) ?? []);
  const tipoOptions = migrationPendente
    ? []
    : ((tiposResposta.data as BaseConhecimentoTipo[] | null) ?? []);
  const organizacoes = migrationPendente
    ? []
    : ((organizacoesResposta.data as BaseConhecimentoOrganizacao[] | null) ?? []);
  const usuarios = migrationPendente
    ? []
    : ((usuariosResposta.data as BaseConhecimentoUsuario[] | null) ?? []);
  const artigoTags = migrationPendente
    ? []
    : ((artigoTagsResposta.data as ArtigoTagRow[] | null) ?? []);
  const artigoOrganizacoes = migrationPendente
    ? []
    : ((artigoOrganizacoesResposta.data as ArtigoOrganizacaoRow[] | null) ?? []);
  const artigoUsuarios = migrationPendente
    ? []
    : ((artigoUsuariosResposta.data as ArtigoUsuarioRow[] | null) ?? []);
  const anexos = migrationPendente
    ? []
    : ((anexosResposta.data as BaseConhecimentoAnexo[] | null) ?? []);
  const tagsPorId = new Map(tags.map((tag) => [tag.id, tag]));
  const tagsPorArtigo = new Map<string, BaseConhecimentoTag[]>();
  const organizacoesPorArtigo = new Map<string, string[]>();
  const usuariosPorArtigo = new Map<string, string[]>();
  const anexosPorArtigo = new Map<string, BaseConhecimentoAnexo[]>();

  artigoTags.forEach((vinculo) => {
    const tag = tagsPorId.get(vinculo.tag_id);
    if (!tag) {
      return;
    }

    const lista = tagsPorArtigo.get(vinculo.artigo_id) ?? [];
    lista.push(tag);
    tagsPorArtigo.set(vinculo.artigo_id, lista);
  });

  artigoOrganizacoes.forEach((vinculo) => {
    const lista = organizacoesPorArtigo.get(vinculo.artigo_id) ?? [];
    lista.push(vinculo.organizacao_id);
    organizacoesPorArtigo.set(vinculo.artigo_id, lista);
  });

  artigoUsuarios.forEach((vinculo) => {
    const lista = usuariosPorArtigo.get(vinculo.artigo_id) ?? [];
    lista.push(vinculo.usuario_id);
    usuariosPorArtigo.set(vinculo.artigo_id, lista);
  });

  anexos.forEach((anexo) => {
    const lista = anexosPorArtigo.get(anexo.artigo_id) ?? [];
    lista.push(anexo);
    anexosPorArtigo.set(anexo.artigo_id, lista);
  });

  const artigosBase = migrationPendente
    ? []
    : ((artigosResposta.data as Omit<BaseConhecimentoArtigo, "tags" | "anexos" | "organizacao_ids" | "usuario_ids">[] | null) ??
        []);
  const artigos = artigosBase.map((artigo) => ({
    ...artigo,
    tags: tagsPorArtigo.get(artigo.id) ?? [],
    anexos: anexosPorArtigo.get(artigo.id) ?? [],
    organizacao_ids: organizacoesPorArtigo.get(artigo.id) ?? [],
    usuario_ids: usuariosPorArtigo.get(artigo.id) ?? [],
  }));

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-7xl px-6 pb-10 md:px-8">
        <div className="mb-6">
          <Link href="/chamados/novo" className="text-sm font-semibold text-blue-600">
            Voltar para novo chamado
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-950">
            Base de Conhecimento
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Gestão de artigos técnicos, procedimentos, checklists, anexos e soluções
            recorrentes para apoiar triagem e atendimento de chamados.
          </p>
        </div>

        <BaseConhecimentoClient
          artigos={artigos}
          categorias={categorias}
          tags={tags}
          statusOptions={statusOptions}
          tipoOptions={tipoOptions}
          organizacoes={organizacoes}
          usuarios={usuarios}
          podeEditar={podeEditar}
          erroCarregamento={erroCarregamento}
        />
      </section>
    </main>
  );
}
