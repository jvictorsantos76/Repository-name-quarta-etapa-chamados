"use server";

import { revalidatePath } from "next/cache";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import type { PapelUsuario } from "@/lib/auth/types";

type ActionStatus = "success" | "validation_error" | "permission_error" | "error";

export type CatalogoItem = {
  id: string;
  nome: string;
  descricao: string | null;
};

export type BaseConhecimentoItem = {
  id: string;
  titulo: string;
  url: string | null;
  resumo: string | null;
};

export type ClienteItem = {
  id: string;
  nome_fantasia: string;
};

export type LojaItem = {
  id: string;
  cliente_id: string;
  nome_loja: string;
};

export type PerfilItem = {
  id: string;
  nome_completo: string;
  papel: string;
};

export type NovoChamadoDados = {
  tipos: CatalogoItem[];
  origens: CatalogoItem[];
  grupos: CatalogoItem[];
  bases: BaseConhecimentoItem[];
  clientes: ClienteItem[];
  lojas: LojaItem[];
  perfis: PerfilItem[];
};

export type MutationResult<T = undefined> = {
  status: ActionStatus;
  message: string;
  data?: T;
};

export type CriarChamadoInput = {
  titulo: string;
  tipo_chamado_id: string;
  origem_id: string;
  id_externo: string;
  organizacao_id: string;
  grupo_atendimento_id: string;
  base_conhecimento_ids: string[];
  loja_id: string;
  solicitante: string;
  impacto: "baixo" | "medio" | "alto";
  urgencia: "baixa" | "media" | "alta";
  prioridade: "baixa" | "media" | "alta" | "critica";
  categoria: string;
  ativo_tipo: string;
  ativo_descricao: string;
  marca: string;
  modelo: string;
  descricao: string;
  analista_responsavel_id: string;
  tecnico_responsavel_id: string;
};

const PAPEIS_CATALOGO: PapelUsuario[] = [
  "super_admin",
  "admin",
  "gestor",
  "analista",
];

function normalizarTexto(valor: string) {
  return valor.trim().replace(/\s+/g, " ");
}

function podeGerenciarCatalogo(papel: PapelUsuario) {
  return PAPEIS_CATALOGO.includes(papel);
}

function mensagemErroBanco(error: { code?: string; message: string }) {
  if (error.code === "23505") {
    return "Já existe um cadastro com este nome.";
  }

  if (error.code === "42501") {
    return "Permissão negada pelo banco de dados para esta operação.";
  }

  return "Não foi possível salvar. Tente novamente.";
}

function validarUuidLista(ids: string[]) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  return ids.every((id) => uuidRegex.test(id));
}

function validarUrlOpcional(url: string) {
  if (!url) {
    return true;
  }

  try {
    const urlObj = new URL(url);
    return urlObj.protocol === "http:" || urlObj.protocol === "https:";
  } catch {
    return false;
  }
}

export async function carregarDadosNovoChamado(): Promise<
  MutationResult<NovoChamadoDados>
> {
  await requirePerfilAutenticado();
  const supabase = await createSupabaseServerClient();

  const [
    tiposResposta,
    origensResposta,
    gruposResposta,
    basesResposta,
    clientesResposta,
    lojasResposta,
    perfisResposta,
  ] = await Promise.all([
    supabase
      .from("chamado_tipos")
      .select("id, nome, descricao")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("chamado_origens")
      .select("id, nome, descricao")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("grupos_atendimento")
      .select("id, nome, descricao")
      .eq("ativo", true)
      .order("nome"),
    supabase
      .from("bases_conhecimento")
      .select("id, titulo, url, resumo")
      .eq("ativo", true)
      .order("titulo"),
    supabase
      .from("clientes")
      .select("id, nome_fantasia")
      .eq("ativo", true)
      .order("nome_fantasia"),
    supabase
      .from("lojas")
      .select("id, cliente_id, nome_loja")
      .eq("ativo", true)
      .order("nome_loja"),
    supabase
      .from("perfis")
      .select("id, nome_completo, papel")
      .eq("ativo", true)
      .order("nome_completo"),
  ]);

  const erro =
    tiposResposta.error ??
    origensResposta.error ??
    gruposResposta.error ??
    basesResposta.error ??
    clientesResposta.error ??
    lojasResposta.error ??
    perfisResposta.error;

  if (erro) {
    return {
      status: "error",
      message: `Não foi possível carregar os dados do chamado: ${erro.message}`,
    };
  }

  const dados = {
    tipos: (tiposResposta.data as CatalogoItem[] | null) ?? [],
    origens: (origensResposta.data as CatalogoItem[] | null) ?? [],
    grupos: (gruposResposta.data as CatalogoItem[] | null) ?? [],
    bases: (basesResposta.data as BaseConhecimentoItem[] | null) ?? [],
    clientes: (clientesResposta.data as ClienteItem[] | null) ?? [],
    lojas: (lojasResposta.data as LojaItem[] | null) ?? [],
    perfis: (perfisResposta.data as PerfilItem[] | null) ?? [],
  };

  return {
    status: "success",
    message: "Dados carregados.",
    data: dados,
  };
}

async function criarCatalogoSimples(
  tabela: "chamado_tipos" | "chamado_origens" | "grupos_atendimento",
  nome: string,
  descricao: string
): Promise<MutationResult<CatalogoItem>> {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogo(perfilAtual.papel)) {
    return {
      status: "permission_error",
      message: "Seu perfil não pode cadastrar itens auxiliares do chamado.",
    };
  }

  const nomeNormalizado = normalizarTexto(nome);

  if (!nomeNormalizado) {
    return {
      status: "validation_error",
      message: "Informe um nome para salvar o cadastro.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from(tabela)
    .insert({
      nome: nomeNormalizado,
      descricao: normalizarTexto(descricao) || null,
      criado_por: perfilAtual.id,
    })
    .select("id, nome, descricao")
    .single();

  if (error) {
    return {
      status: error.code === "42501" ? "permission_error" : "error",
      message: mensagemErroBanco(error),
    };
  }

  revalidatePath("/chamados/novo");

  return {
    status: "success",
    message: "Cadastro criado.",
    data: data as CatalogoItem,
  };
}

export async function criarTipoChamado(nome: string, descricao: string) {
  return criarCatalogoSimples("chamado_tipos", nome, descricao);
}

export async function criarOrigemChamado(nome: string, descricao: string) {
  return criarCatalogoSimples("chamado_origens", nome, descricao);
}

export async function criarGrupoAtendimento(nome: string, descricao: string) {
  return criarCatalogoSimples("grupos_atendimento", nome, descricao);
}

export async function criarOrganizacao(nome: string): Promise<MutationResult<ClienteItem>> {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogo(perfilAtual.papel)) {
    return {
      status: "permission_error",
      message: "Seu perfil não pode cadastrar organizações na abertura.",
    };
  }

  const nomeNormalizado = normalizarTexto(nome);

  if (!nomeNormalizado) {
    return {
      status: "validation_error",
      message: "Informe o nome da organização.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("clientes")
    .insert({
      nome_fantasia: nomeNormalizado,
      razao_social: nomeNormalizado,
      ativo: true,
    })
    .select("id, nome_fantasia")
    .single();

  if (error) {
    return {
      status: error.code === "42501" ? "permission_error" : "error",
      message: mensagemErroBanco(error),
    };
  }

  revalidatePath("/chamados/novo");

  return {
    status: "success",
    message: "Organização criada.",
    data: data as ClienteItem,
  };
}

export async function criarBaseConhecimento(campos: {
  titulo: string;
  url: string;
  resumo: string;
}): Promise<MutationResult<BaseConhecimentoItem>> {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogo(perfilAtual.papel)) {
    return {
      status: "permission_error",
      message: "Seu perfil não pode cadastrar bases de conhecimento.",
    };
  }

  const titulo = normalizarTexto(campos.titulo);
  const url = campos.url.trim();

  if (!titulo) {
    return {
      status: "validation_error",
      message: "Informe o título da base de conhecimento.",
    };
  }

  if (!validarUrlOpcional(url)) {
    return {
      status: "validation_error",
      message: "Informe uma URL válida começando com http:// ou https://.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("bases_conhecimento")
    .insert({
      titulo,
      url: url || null,
      resumo: normalizarTexto(campos.resumo) || null,
      criado_por: perfilAtual.id,
    })
    .select("id, titulo, url, resumo")
    .single();

  if (error) {
    return {
      status: error.code === "42501" ? "permission_error" : "error",
      message: mensagemErroBanco(error),
    };
  }

  revalidatePath("/chamados/novo");

  return {
    status: "success",
    message: "Base de conhecimento criada.",
    data: data as BaseConhecimentoItem,
  };
}

export async function criarChamadoIdentificacao(
  input: CriarChamadoInput
): Promise<MutationResult<{ id: string; numero: number }>> {
  const perfilAtual = await requirePerfilAutenticado();

  const titulo = normalizarTexto(input.titulo);
  const solicitante = normalizarTexto(input.solicitante);
  const descricao = input.descricao.trim();
  const idsObrigatorios = [
    input.tipo_chamado_id,
    input.origem_id,
    input.organizacao_id,
    input.grupo_atendimento_id,
    input.loja_id,
  ];

  if (!titulo) {
    return {
      status: "validation_error",
      message: "Informe o Título / Assunto do chamado.",
    };
  }

  if (!idsObrigatorios.every(Boolean)) {
    return {
      status: "validation_error",
      message:
        "Selecione tipo, origem, organização, loja/unidade e grupo de atendimento.",
    };
  }

  if (!solicitante || !input.categoria || !input.ativo_tipo || !descricao) {
    return {
      status: "validation_error",
      message:
        "Preencha solicitante, categoria, ativo e descrição antes de abrir o chamado.",
    };
  }

  if (!validarUuidLista([...idsObrigatorios, ...input.base_conhecimento_ids])) {
    return {
      status: "validation_error",
      message: "Um dos cadastros selecionados é inválido. Recarregue a tela.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const [tipoResposta, origemResposta] = await Promise.all([
    supabase
      .from("chamado_tipos")
      .select("nome")
      .eq("id", input.tipo_chamado_id)
      .eq("ativo", true)
      .maybeSingle(),
    supabase
      .from("chamado_origens")
      .select("nome")
      .eq("id", input.origem_id)
      .eq("ativo", true)
      .maybeSingle(),
  ]);

  if (tipoResposta.error || origemResposta.error) {
    return {
      status: "error",
      message: "Não foi possível validar tipo e origem do chamado.",
    };
  }

  if (!tipoResposta.data || !origemResposta.data) {
    return {
      status: "validation_error",
      message: "Tipo ou origem selecionados não estão mais ativos.",
    };
  }

  const descricaoProblema = [
    `Solicitante: ${solicitante}`,
    `Tipo do chamado: ${tipoResposta.data.nome}`,
    `Origem: ${origemResposta.data.nome}`,
    `ID externo: ${normalizarTexto(input.id_externo) || "Não informado"}`,
    `Impacto: ${input.impacto}`,
    `Urgência: ${input.urgencia}`,
    `Categoria: ${input.categoria}`,
    `Ativo: ${input.ativo_tipo}`,
    `Complemento do ativo: ${normalizarTexto(input.ativo_descricao) || "Não informado"}`,
    `Marca: ${normalizarTexto(input.marca) || "Não informada"}`,
    `Modelo: ${normalizarTexto(input.modelo) || "Não informado"}`,
    `Usuário: ${perfilAtual.nome_completo}`,
    `Papel: ${perfilAtual.papel}`,
    "",
    descricao,
  ].join("\n");

  const { data: chamadoCriado, error: erroChamado } = await supabase
    .from("chamados")
    .insert({
      cliente_id: input.organizacao_id,
      organizacao_id: input.organizacao_id,
      loja_id: input.loja_id,
      operador_id: perfilAtual.id,
      tecnico_id: input.tecnico_responsavel_id || null,
      analista_responsavel_id: input.analista_responsavel_id || null,
      tecnico_responsavel_id: input.tecnico_responsavel_id || null,
      tipo_chamado_id: input.tipo_chamado_id,
      origem_id: input.origem_id,
      grupo_atendimento_id: input.grupo_atendimento_id,
      id_externo: normalizarTexto(input.id_externo) || null,
      tipo_chamado: tipoResposta.data.nome,
      origem: origemResposta.data.nome,
      impacto: input.impacto,
      urgencia: input.urgencia,
      ativo_afetado: input.ativo_tipo,
      categoria: input.categoria,
      ativo_tipo: input.ativo_tipo,
      ativo_descricao: normalizarTexto(input.ativo_descricao) || null,
      marca: normalizarTexto(input.marca) || null,
      modelo: normalizarTexto(input.modelo) || null,
      titulo,
      descricao_problema: descricaoProblema,
      status: "pendente_agendamento",
      prioridade: input.prioridade,
    })
    .select("id, numero")
    .single();

  if (erroChamado || !chamadoCriado) {
    return {
      status: erroChamado?.code === "42501" ? "permission_error" : "error",
      message: erroChamado
        ? mensagemErroBanco(erroChamado)
        : "Não foi possível criar o chamado.",
    };
  }

  if (input.base_conhecimento_ids.length > 0) {
    const basesRelacionadas = input.base_conhecimento_ids.map((baseId) => ({
      chamado_id: chamadoCriado.id,
      base_conhecimento_id: baseId,
    }));

    const { error: erroBases } = await supabase
      .from("chamados_bases_conhecimento")
      .insert(basesRelacionadas);

    if (erroBases) {
      return {
        status: erroBases.code === "42501" ? "permission_error" : "error",
        message:
          "Chamado criado, mas não foi possível vincular as bases de conhecimento.",
        data: chamadoCriado as { id: string; numero: number },
      };
    }
  }

  const { error: erroHistorico } = await supabase
    .from("historico_status")
    .insert({
      chamado_id: chamadoCriado.id,
      usuario_id: perfilAtual.id,
      status_anterior: null,
      status_novo: "pendente_agendamento",
      observacao: "Chamado aberto pelo sistema.",
    });

  if (erroHistorico) {
    return {
      status: erroHistorico.code === "42501" ? "permission_error" : "error",
      message:
        "Chamado criado, mas não foi possível registrar o histórico inicial.",
      data: chamadoCriado as { id: string; numero: number },
    };
  }

  revalidatePath("/");
  revalidatePath("/chamados/novo");

  return {
    status: "success",
    message: "Chamado criado.",
    data: chamadoCriado as { id: string; numero: number },
  };
}
