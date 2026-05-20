"use server";

import { revalidatePath } from "next/cache";
import {
  isClienteOuParceiro,
  podeConsultarBaseConhecimento,
  podeGerenciarCatalogosChamado,
} from "@/lib/auth/permissions";
import {
  createSupabaseServerClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";

type ActionStatus = "success" | "validation_error" | "permission_error" | "error";

export type CatalogoItem = {
  id: string;
  nome: string;
  descricao: string | null;
};

export type ChamadoStatusItem = CatalogoItem & {
  codigo: string;
  cor: string | null;
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
  organizacao_id: string | null;
  organizacao?: {
    nome: string;
  } | null;
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
  statusPadrao: ChamadoStatusItem | null;
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
  cliente_id: string;
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

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find the table")
  );
}

function normalizarTexto(valor: string) {
  return valor.trim().replace(/\s+/g, " ");
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

function normalizarStatusInicial(codigo: string | null | undefined) {
  if (codigo === "pendente_de_agendamento") {
    return "pendente_agendamento";
  }

  const codigosPermitidos = new Set([
    "pendente_agendamento",
    "orcamento",
    "agendado",
    "analisado",
    "em_atendimento",
    "pendente_peca",
    "resolvido",
    "faturado",
    "arquivado",
  ]);

  return codigo && codigosPermitidos.has(codigo)
    ? codigo
    : "pendente_agendamento";
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
  const perfilAtual = await requirePerfilAutenticado();
  const supabase = await createSupabaseServerClient();
  const usuarioClienteOuParceiro = isClienteOuParceiro(perfilAtual.papel);
  const podeVerBase = podeConsultarBaseConhecimento(perfilAtual.papel);

  const [
    statusResposta,
    tiposResposta,
    origensResposta,
    gruposResposta,
    basesResposta,
    clientesResposta,
    lojasResposta,
    perfisResposta,
  ] = await Promise.all([
    supabase
      .from("chamado_status")
      .select("id, codigo, nome, descricao, cor")
      .eq("ativo", true)
      .or("eh_padrao.eq.true,codigo.eq.pendente_agendamento")
      .order("eh_padrao", { ascending: false })
      .order("ordem")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("chamado_tipos")
      .select("id, nome, descricao")
      .eq("ativo", true)
      .order("ordem")
      .order("nome"),
    supabase
      .from("chamado_origens")
      .select("id, nome, descricao")
      .eq("ativo", true)
      .order("ordem")
      .order("nome"),
    supabase
      .from("grupos_atendimento")
      .select("id, nome, descricao")
      .eq("ativo", true)
      .order("ordem")
      .order("nome"),
    podeVerBase
      ? supabase
          .from("bases_conhecimento")
          .select("id, titulo, url, resumo")
          .eq("ativo", true)
          .order("ordem")
          .order("titulo")
      : Promise.resolve({ data: [], error: null }),
    usuarioClienteOuParceiro && perfilAtual.cliente_id
      ? supabase
          .from("clientes")
          .select("id, nome_fantasia, organizacao_id, organizacao:organizacoes!clientes_organizacao_id_fkey(nome)")
          .eq("id", perfilAtual.cliente_id)
          .eq("ativo", true)
          .order("nome_fantasia")
      : supabase
          .from("clientes")
          .select("id, nome_fantasia, organizacao_id, organizacao:organizacoes!clientes_organizacao_id_fkey(nome)")
          .eq("ativo", true)
          .order("nome_fantasia"),
    usuarioClienteOuParceiro && perfilAtual.loja_id
      ? supabase
          .from("lojas")
          .select("id, cliente_id, nome_loja")
          .eq("id", perfilAtual.loja_id)
          .eq("ativo", true)
          .order("nome_loja")
      : supabase
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

  const erros = [
    statusResposta.error,
    tiposResposta.error,
    origensResposta.error,
    gruposResposta.error,
    basesResposta.error,
    clientesResposta.error,
    lojasResposta.error,
    perfisResposta.error,
  ].filter(Boolean);
  const erro = erros.find((item) => !isSchemaCacheError(item?.message)) ?? null;

  if (erro) {
    return {
      status: "error",
      message: `Não foi possível carregar os dados do chamado: ${erro.message}`,
    };
  }

  const statusPadraoResposta = isSchemaCacheError(statusResposta.error?.message)
    ? null
    : (statusResposta.data as ChamadoStatusItem | null);
  const dados = {
    statusPadrao: statusPadraoResposta
      ? {
          ...statusPadraoResposta,
          codigo: normalizarStatusInicial(statusPadraoResposta.codigo),
        }
      : {
          id: "fallback-status-pendente-agendamento",
          codigo: "pendente_agendamento",
          nome: "Pendente de agendamento",
          descricao: null,
          cor: null,
        },
    tipos: isSchemaCacheError(tiposResposta.error?.message)
      ? []
      : (tiposResposta.data as CatalogoItem[] | null) ?? [],
    origens: isSchemaCacheError(origensResposta.error?.message)
      ? []
      : (origensResposta.data as CatalogoItem[] | null) ?? [],
    grupos: isSchemaCacheError(gruposResposta.error?.message)
      ? []
      : (gruposResposta.data as CatalogoItem[] | null) ?? [],
    bases: isSchemaCacheError(basesResposta.error?.message)
      ? []
      : (basesResposta.data as BaseConhecimentoItem[] | null) ?? [],
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

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
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

export async function criarStatusChamado(campos: {
  nome: string;
  descricao: string;
  cor: string;
}): Promise<MutationResult<CatalogoItem>> {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    return {
      status: "permission_error",
      message: "Seu perfil não pode cadastrar status de chamados.",
    };
  }

  const nome = normalizarTexto(campos.nome);

  if (!nome) {
    return {
      status: "validation_error",
      message: "Informe o nome do status.",
    };
  }

  const codigo = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("chamado_status")
    .insert({
      codigo,
      nome,
      descricao: normalizarTexto(campos.descricao) || null,
      cor: normalizarTexto(campos.cor) || null,
      criado_por: perfilAtual.id,
      atualizado_por: perfilAtual.id,
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
  revalidatePath("/configurar/status-chamados");

  return {
    status: "success",
    message: "Status criado.",
    data: data as CatalogoItem,
  };
}

export async function criarOrigemChamado(nome: string, descricao: string) {
  return criarCatalogoSimples("chamado_origens", nome, descricao);
}

export async function criarGrupoAtendimento(nome: string, descricao: string) {
  return criarCatalogoSimples("grupos_atendimento", nome, descricao);
}

export async function criarClienteChamado(nome: string): Promise<MutationResult<ClienteItem>> {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    return {
      status: "permission_error",
      message: "Seu perfil não pode cadastrar clientes na abertura.",
    };
  }

  const nomeNormalizado = normalizarTexto(nome);

  if (!nomeNormalizado) {
    return {
      status: "validation_error",
      message: "Informe o nome do cliente.",
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
    .select("id, nome_fantasia, organizacao_id")
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
    message: "Cliente criado.",
    data: data as ClienteItem,
  };
}

export async function criarFilialOrganizacao(
  clienteId: string,
  nome: string
): Promise<MutationResult<LojaItem>> {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    return {
      status: "permission_error",
      message: "Seu perfil não pode cadastrar filiais na abertura.",
    };
  }

  if (!validarUuidLista([clienteId])) {
    return {
      status: "validation_error",
      message: "Selecione um cliente válido antes de criar a filial.",
    };
  }

  const nomeNormalizado = normalizarTexto(nome);

  if (!nomeNormalizado) {
    return {
      status: "validation_error",
      message: "Informe o nome da filial.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data: cliente, error: erroCliente } = await supabase
    .from("clientes")
    .select("id")
    .eq("id", clienteId)
    .eq("ativo", true)
    .maybeSingle();

  if (erroCliente) {
    return {
      status: erroCliente.code === "42501" ? "permission_error" : "error",
      message: mensagemErroBanco(erroCliente),
    };
  }

  if (!cliente) {
    return {
      status: "validation_error",
      message: "Cliente selecionado não está ativo ou não foi encontrado.",
    };
  }

  const { data, error } = await supabase
    .from("lojas")
    .insert({
      cliente_id: clienteId,
      nome_loja: nomeNormalizado,
      ativo: true,
    })
    .select("id, cliente_id, nome_loja")
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
    message: "Filial criada.",
    data: data as LojaItem,
  };
}

export async function criarBaseConhecimento(campos: {
  titulo: string;
  url: string;
  resumo: string;
}): Promise<MutationResult<BaseConhecimentoItem>> {
  const perfilAtual = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfilAtual.papel)) {
    return {
      status: "permission_error",
      message: "Seu perfil não pode cadastrar artigos da base de conhecimento.",
    };
  }

  const titulo = normalizarTexto(campos.titulo);
  const url = campos.url.trim();

  if (!titulo) {
    return {
      status: "validation_error",
      message: "Informe o título do artigo.",
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
    message: "Artigo criado.",
    data: data as BaseConhecimentoItem,
  };
}

export async function criarChamadoIdentificacao(
  input: CriarChamadoInput
): Promise<MutationResult<{ id: string; numero: number }>> {
  const perfilAtual = await requirePerfilAutenticado();
  const usuarioClienteOuParceiro = isClienteOuParceiro(perfilAtual.papel);

  const titulo = normalizarTexto(input.titulo);
  const solicitante = normalizarTexto(input.solicitante);
  const descricao = input.descricao.trim();
  const clienteIdEfetivo = usuarioClienteOuParceiro
    ? perfilAtual.cliente_id ?? input.cliente_id
    : input.cliente_id;
  const lojaIdEfetiva = usuarioClienteOuParceiro
    ? perfilAtual.loja_id ?? ""
    : input.loja_id;
  const basesSelecionadas = podeConsultarBaseConhecimento(perfilAtual.papel)
    ? input.base_conhecimento_ids
    : [];
  const idsObrigatorios = [
    input.tipo_chamado_id,
    input.origem_id,
    clienteIdEfetivo,
    input.grupo_atendimento_id,
    lojaIdEfetiva,
  ];

  if (usuarioClienteOuParceiro && !perfilAtual.loja_id) {
    return {
      status: "permission_error",
      message:
        "Seu perfil não possui loja vinculada. Solicite a correção do cadastro antes de abrir chamados.",
    };
  }

  if (!titulo) {
    return {
      status: "validation_error",
      message: "Informe o Assunto do chamado.",
    };
  }

  if (!idsObrigatorios.every(Boolean)) {
    return {
      status: "validation_error",
      message:
        "Selecione tipo, origem, cliente, filial e grupo de atendimento.",
    };
  }

  if (!solicitante || !input.categoria || !input.ativo_tipo || !descricao) {
    return {
      status: "validation_error",
      message:
        "Preencha solicitante, categoria, ativo e problema relatado antes de abrir o chamado.",
    };
  }

  if (!validarUuidLista([...idsObrigatorios, ...basesSelecionadas])) {
    return {
      status: "validation_error",
      message: "Um dos cadastros selecionados é inválido. Recarregue a tela.",
    };
  }

  const supabase = await createSupabaseServerClient();
  const [
    tipoResposta,
    origemResposta,
    grupoResposta,
    clienteResposta,
    lojaResposta,
    statusResposta,
  ] =
    await Promise.all([
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
    supabase
      .from("grupos_atendimento")
      .select("nome")
      .eq("id", input.grupo_atendimento_id)
      .eq("ativo", true)
      .maybeSingle(),
    supabase
      .from("clientes")
      .select("id, organizacao_id")
      .eq("id", clienteIdEfetivo)
      .eq("ativo", true)
      .maybeSingle(),
    supabase
      .from("lojas")
      .select("id, cliente_id")
      .eq("id", lojaIdEfetiva)
      .eq("ativo", true)
      .maybeSingle(),
    supabase
      .from("chamado_status")
      .select("codigo, nome")
      .eq("ativo", true)
      .or("eh_padrao.eq.true,codigo.eq.pendente_agendamento")
      .order("eh_padrao", { ascending: false })
      .order("ordem")
      .limit(1)
      .maybeSingle(),
  ]);

  const erroValidacao = [
    tipoResposta.error,
    origemResposta.error,
    grupoResposta.error,
    clienteResposta.error,
    lojaResposta.error,
    statusResposta.error,
  ].find((item) => item && !isSchemaCacheError(item.message));

  if (erroValidacao) {
    return {
      status: "error",
      message: "Não foi possível validar os cadastros do chamado.",
    };
  }

  if (!tipoResposta.data || !origemResposta.data || !grupoResposta.data) {
    return {
      status: "validation_error",
      message:
        "Tipo, origem ou grupo selecionado não está mais ativo. Recarregue a tela.",
    };
  }

  if (!clienteResposta.data) {
    return {
      status: "validation_error",
      message: "Cliente selecionado não está mais ativo. Recarregue a tela.",
    };
  }

  if (!lojaResposta.data || lojaResposta.data.cliente_id !== clienteIdEfetivo) {
    return {
      status: "validation_error",
      message: "A filial selecionada não pertence ao cliente vinculado.",
    };
  }

  if (basesSelecionadas.length > 0) {
    const { data: basesAtivas, error: erroBasesAtivas } = await supabase
      .from("bases_conhecimento")
      .select("id")
      .in("id", basesSelecionadas)
      .eq("ativo", true);

    if (erroBasesAtivas) {
      return {
        status:
          erroBasesAtivas.code === "42501" ? "permission_error" : "error",
        message: "Não foi possível validar os artigos selecionados.",
      };
    }

    if ((basesAtivas ?? []).length !== basesSelecionadas.length) {
      return {
        status: "validation_error",
        message:
          "Um dos artigos selecionados não está mais ativo. Recarregue a tela.",
      };
    }
  }

  const statusInicial = isSchemaCacheError(statusResposta.error?.message)
    ? "pendente_agendamento"
    : normalizarStatusInicial(statusResposta.data?.codigo);

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
      cliente_id: clienteIdEfetivo,
      organizacao_id:
        (clienteResposta.data as { organizacao_id: string | null }).organizacao_id ??
        null,
      loja_id: lojaIdEfetiva,
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
      status: statusInicial,
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

  const [parceiroResposta, parceiroFilialResposta] = await Promise.all([
    supabase
      .from("parceiros")
      .select("id")
      .eq("cliente_legado_id", clienteIdEfetivo)
      .maybeSingle(),
    supabase
      .from("parceiros_filiais")
      .select("id")
      .eq("loja_legado_id", lojaIdEfetiva)
      .maybeSingle(),
  ]);
  const parceiroId =
    parceiroResposta.error && isSchemaCacheError(parceiroResposta.error.message)
      ? null
      : ((parceiroResposta.data as { id: string } | null)?.id ?? null);
  const parceiroFilialId =
    parceiroFilialResposta.error &&
    isSchemaCacheError(parceiroFilialResposta.error.message)
      ? null
      : ((parceiroFilialResposta.data as { id: string } | null)?.id ?? null);

  if (parceiroId || parceiroFilialId) {
    await supabase
      .from("chamados")
      .update({
        parceiro_id: parceiroId,
        parceiro_filial_id: parceiroFilialId,
      })
      .eq("id", chamadoCriado.id);
  }

  if (basesSelecionadas.length > 0) {
    const basesRelacionadas = basesSelecionadas.map((baseId) => ({
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
      status_novo: statusInicial,
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
