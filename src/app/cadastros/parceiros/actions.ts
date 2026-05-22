"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { podeGerenciarCatalogosChamado } from "@/lib/auth/permissions";
import {
  createSupabaseAdminClient,
  requirePerfilAutenticado,
} from "@/lib/supabase/server";
import {
  isCargoContato,
  isDepartamentoContato,
  DOCUMENTOS_ENTRADA,
  isOpcaoCrt,
  isSegmentoParceiro,
  isSituacaoParceiro,
  isStatusContrato,
  isStatusFilial,
  isTipoContato,
  isTipoParceiro,
  isTipoPessoa,
  UFS_BRASIL,
} from "./types";

const LISTAGEM_PARCEIROS_PATH = "/cadastros/parceiros";
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CONSULTA_PUBLICA_HEADERS = {
  accept: "application/json",
  "user-agent": "quarta-etapa-chamados/1.0 (+https://quarta-etapa.app)",
};

type ConsultaPublicaResultado<T> =
  | { ok: true; data: T; mensagem: string }
  | { ok: false; tipo: "invalido" | "nao_encontrado" | "indisponivel"; mensagem: string };

export type DadosCnpjPublico = {
  razao_social: string | null;
  nome_fantasia: string | null;
  cnpj: string | null;
  situacao_cadastral: string | null;
  cnae: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
};

export type DadosCepPublico = {
  cep: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  codigo_ibge: string | null;
  pais: string | null;
};

function normalizarTexto(valor: FormDataEntryValue | null) {
  return String(valor ?? "").trim().replace(/\s+/g, " ");
}

function textoOuNull(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor);
  return texto || null;
}

function apenasDigitos(valor: FormDataEntryValue | null) {
  return normalizarTexto(valor).replace(/\D/g, "");
}

function apenasDigitosTexto(valor: string | null | undefined) {
  return String(valor ?? "").replace(/\D/g, "");
}

function documentoOuNull(valor: FormDataEntryValue | null, tipoPessoa: string) {
  const digitos = apenasDigitos(valor);

  if (!digitos) {
    return { ok: true as const, value: null };
  }

  if (tipoPessoa === "fisica" && digitos.length !== 11) {
    return { ok: false as const, error: "Informe um CPF com 11 dígitos." };
  }

  if (tipoPessoa === "juridica" && digitos.length !== 14) {
    return { ok: false as const, error: "Informe um CNPJ com 14 dígitos." };
  }

  return { ok: true as const, value: digitos };
}

function emailOuNull(valor: FormDataEntryValue | null) {
  const texto = textoOuNull(valor)?.toLowerCase() ?? null;

  if (!texto) {
    return { ok: true as const, value: null };
  }

  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(texto)) {
    return { ok: true as const, value: texto };
  }

  return { ok: false as const, error: "Informe um e-mail válido." };
}

function ufOuNull(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor).toUpperCase();

  if (!texto) {
    return null;
  }

  return UFS_BRASIL.includes(texto as (typeof UFS_BRASIL)[number]) ? texto : null;
}

function cepOuNull(valor: FormDataEntryValue | null) {
  const digitos = apenasDigitos(valor);
  return digitos || null;
}

function telefoneOuNull(valor: FormDataEntryValue | null) {
  const digitos = apenasDigitos(valor);
  if (!digitos) {
    return null;
  }

  if ((digitos.length === 10 || digitos.length === 11) && !digitos.startsWith("55")) {
    return `55${digitos}`;
  }

  return digitos;
}

function normalizarWebsite(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor);

  if (!texto) {
    return { ok: true as const, value: null };
  }

  if (/^https?:\/\//i.test(texto)) {
    return { ok: true as const, value: texto };
  }

  if (/^[\w.-]+\.[a-z]{2,}(?:[/:?#].*)?$/i.test(texto)) {
    return { ok: true as const, value: `https://${texto}` };
  }

  return {
    ok: false as const,
    error: "Informe o website com http:// ou https://.",
  };
}

function dataOuNull(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor);
  return /^\d{4}-\d{2}-\d{2}$/.test(texto) ? texto : null;
}

function numeroOuNull(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor).replace(",", ".");
  if (!texto) {
    return null;
  }

  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : null;
}

function coordenadaOuNull(
  valor: FormDataEntryValue | null,
  limiteMinimo: number,
  limiteMaximo: number,
  label: string
) {
  const texto = normalizarTexto(valor).replace(",", ".");

  if (!texto) {
    return { ok: true as const, value: null };
  }

  const numero = Number(texto);

  if (!Number.isFinite(numero) || numero < limiteMinimo || numero > limiteMaximo) {
    return { ok: false as const, error: `${label} deve estar entre ${limiteMinimo} e ${limiteMaximo}.` };
  }

  return { ok: true as const, value: numero };
}

function inteiroOuNull(valor: FormDataEntryValue | null) {
  const numero = numeroOuNull(valor);
  return numero === null ? null : Math.trunc(numero);
}

function boolForm(formData: FormData, campo: string) {
  return formData.get(campo) === "on";
}

function uuidOuNull(valor: FormDataEntryValue | null) {
  const texto = normalizarTexto(valor);
  return UUID_REGEX.test(texto) ? texto : null;
}

function montarDocumentosEntrada(formData: FormData) {
  const selecionados = formData
    .getAll("documentos_entrada")
    .map((valor) => normalizarTexto(valor))
    .filter(Boolean);
  const permitidos = new Set<string>(DOCUMENTOS_ENTRADA);
  const documentos: string[] = [];

  for (const documento of selecionados) {
    if (!permitidos.has(documento)) {
      return {
        ok: false as const,
        error: "Informe documentos de entrada válidos.",
      };
    }

    if (documento !== "Outro" && !documentos.includes(documento)) {
      documentos.push(documento);
    }
  }

  if (selecionados.includes("Outro")) {
    const descricaoOutro = textoOuNull(formData.get("documentos_entrada_outro"));
    documentos.push(descricaoOutro ? `Outro: ${descricaoOutro}` : "Outro");
  }

  return {
    ok: true as const,
    value: documentos.length > 0 ? documentos : null,
  };
}

function nomeOrganizacaoPorCadastro(formData: FormData) {
  return (
    normalizarTexto(formData.get("nome_fantasia")) ||
    normalizarTexto(formData.get("razao_social"))
  );
}

function textoExternoOuNull(valor: unknown) {
  if (typeof valor !== "string" && typeof valor !== "number") {
    return null;
  }

  const texto = String(valor).trim().replace(/\s+/g, " ");
  return texto || null;
}

function objetoExterno(valor: unknown): Record<string, unknown> {
  return valor && typeof valor === "object" && !Array.isArray(valor)
    ? (valor as Record<string, unknown>)
    : {};
}

function redirectComErro(path: string, erro: string): never {
  redirect(`${path}?erro=${encodeURIComponent(erro)}`);
}

function redirectComSucesso(path: string, salvo = "1"): never {
  redirect(`${path}?salvo=${encodeURIComponent(salvo)}`);
}

function detalhePath(parceiroId: string) {
  return `${LISTAGEM_PARCEIROS_PATH}/${parceiroId}`;
}

function mensagemErroParceiro(error?: {
  code?: string;
  message?: string;
  details?: string;
}) {
  const detalhe = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();

  if (error?.code === "23505") {
    return "Já existe um parceiro com este código ou documento.";
  }

  if (error?.code === "23514" && detalhe.includes("parceiros_website_check")) {
    return "Informe o website com http:// ou https://.";
  }

  if (error?.code === "23514") {
    return "Revise os campos do parceiro; algum valor não atende às regras do cadastro.";
  }

  if (error?.code === "42501") {
    return "Seu perfil não tem permissão para salvar parceiros.";
  }

  return "Não foi possível salvar o parceiro.";
}

function isSchemaColumnError(
  error: { code?: string; message?: string; details?: string } | null | undefined,
  column: string
) {
  const detalhe = `${error?.message ?? ""} ${error?.details ?? ""}`.toLowerCase();
  return (
    error?.code === "PGRST204" &&
    detalhe.includes(column.toLowerCase()) &&
    detalhe.includes("schema cache")
  );
}

async function salvarContatoComCompatibilidade(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  id: string,
  payload: Record<string, unknown>,
  criadoPor: string
) {
  let payloadAtual = { ...payload };
  let resposta = id
    ? await supabase.from("parceiros_contatos").update(payloadAtual).eq("id", id)
    : await supabase.from("parceiros_contatos").insert({
        ...payloadAtual,
        criado_por: criadoPor,
      });

  if (isSchemaColumnError(resposta.error, "tipo_contato")) {
    payloadAtual = { ...payloadAtual };
    delete payloadAtual.tipo_contato;
    resposta = id
      ? await supabase.from("parceiros_contatos").update(payloadAtual).eq("id", id)
      : await supabase.from("parceiros_contatos").insert({
          ...payloadAtual,
          criado_por: criadoPor,
        });
  }

  if (isSchemaColumnError(resposta.error, "observacoes")) {
    payloadAtual = { ...payloadAtual };
    delete payloadAtual.observacoes;
    resposta = id
      ? await supabase.from("parceiros_contatos").update(payloadAtual).eq("id", id)
      : await supabase.from("parceiros_contatos").insert({
          ...payloadAtual,
          criado_por: criadoPor,
        });
  }

  return resposta;
}

async function requireGestorParceiros() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar clientes/parceiros.");
  }

  return perfil;
}

export async function consultarCnpjPublico(
  cnpj: string
): Promise<ConsultaPublicaResultado<DadosCnpjPublico>> {
  await requireGestorParceiros();

  const cnpjNormalizado = apenasDigitosTexto(cnpj);

  if (cnpjNormalizado.length !== 14) {
    return {
      ok: false,
      tipo: "invalido",
      mensagem: "Informe um CNPJ com 14 dígitos para consultar.",
    };
  }

  try {
    const resposta = await fetch(
      `https://brasilapi.com.br/api/cnpj/v1/${cnpjNormalizado}`,
      {
        cache: "no-store",
        headers: CONSULTA_PUBLICA_HEADERS,
      }
    );

    if (resposta.status === 404) {
      return {
        ok: false,
        tipo: "nao_encontrado",
        mensagem: "CNPJ não encontrado na fonte pública.",
      };
    }

    if (!resposta.ok) {
      return {
        ok: false,
        tipo: "indisponivel",
        mensagem: "Não foi possível consultar agora. Preencha manualmente.",
      };
    }

    const dados = objetoExterno(await resposta.json());
    const cnaeFiscal = textoExternoOuNull(dados.cnae_fiscal);
    const cnaeDescricao = textoExternoOuNull(dados.cnae_fiscal_descricao);
    const cnae = [cnaeFiscal, cnaeDescricao].filter(Boolean).join(" - ") || null;

    return {
      ok: true,
      mensagem: "CNPJ consultado com sucesso. Confira os dados antes de salvar.",
      data: {
        razao_social: textoExternoOuNull(dados.razao_social),
        nome_fantasia: textoExternoOuNull(dados.nome_fantasia),
        cnpj: cnpjNormalizado,
        situacao_cadastral: textoExternoOuNull(dados.descricao_situacao_cadastral),
        cnae,
        cep: textoExternoOuNull(dados.cep),
        endereco: textoExternoOuNull(dados.logradouro),
        numero: textoExternoOuNull(dados.numero),
        complemento: textoExternoOuNull(dados.complemento),
        bairro: textoExternoOuNull(dados.bairro),
        cidade: textoExternoOuNull(dados.municipio),
        estado: textoExternoOuNull(dados.uf)?.toUpperCase() ?? null,
        pais: textoExternoOuNull(dados.pais) ?? "Brasil",
      },
    };
  } catch {
    return {
      ok: false,
      tipo: "indisponivel",
      mensagem: "Não foi possível consultar agora. Preencha manualmente.",
    };
  }
}

export async function consultarCepPublico(
  cep: string
): Promise<ConsultaPublicaResultado<DadosCepPublico>> {
  await requireGestorParceiros();

  const cepNormalizado = apenasDigitosTexto(cep);

  if (cepNormalizado.length !== 8) {
    return {
      ok: false,
      tipo: "invalido",
      mensagem: "Informe um CEP com 8 dígitos para consultar.",
    };
  }

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cepNormalizado}/json/`, {
      cache: "no-store",
      headers: CONSULTA_PUBLICA_HEADERS,
    });

    if (!resposta.ok) {
      return {
        ok: false,
        tipo: "indisponivel",
        mensagem: "Não foi possível consultar agora. Preencha manualmente.",
      };
    }

    const dados = objetoExterno(await resposta.json());

    if (dados.erro === true) {
      return {
        ok: false,
        tipo: "nao_encontrado",
        mensagem: "CEP não encontrado. Preencha o endereço manualmente.",
      };
    }

    return {
      ok: true,
      mensagem: "CEP encontrado. Endereço preenchido automaticamente.",
      data: {
        cep: cepNormalizado,
        endereco: textoExternoOuNull(dados.logradouro),
        bairro: textoExternoOuNull(dados.bairro),
        cidade: textoExternoOuNull(dados.localidade),
        estado: textoExternoOuNull(dados.uf)?.toUpperCase() ?? null,
        codigo_ibge: textoExternoOuNull(dados.ibge),
        pais: "Brasil",
      },
    };
  } catch {
    return {
      ok: false,
      tipo: "indisponivel",
      mensagem: "Não foi possível consultar agora. Preencha manualmente.",
    };
  }
}

function montarPayloadParceiro(formData: FormData) {
  const tipoPessoa = normalizarTexto(formData.get("tipo_pessoa")) || "juridica";
  const tipoParceiro = normalizarTexto(formData.get("tipo_parceiro"));
  const situacao = normalizarTexto(formData.get("situacao"));
  const razaoSocial = normalizarTexto(formData.get("razao_social"));
  const nomeFantasia = normalizarTexto(formData.get("nome_fantasia"));
  const crt = normalizarTexto(formData.get("crt"));
  const segmento = normalizarTexto(formData.get("segmento"));
  const latitude = coordenadaOuNull(formData.get("latitude"), -90, 90, "Latitude");
  const longitude = coordenadaOuNull(formData.get("longitude"), -180, 180, "Longitude");
  const documentosEntrada = montarDocumentosEntrada(formData);

  if (!isTipoPessoa(tipoPessoa)) {
    return { ok: false as const, error: "Informe um tipo de pessoa válido." };
  }

  if (!isTipoParceiro(tipoParceiro)) {
    return { ok: false as const, error: "Informe um perfil operacional válido." };
  }

  if (!isSituacaoParceiro(situacao)) {
    return { ok: false as const, error: "Informe uma situação válida." };
  }

  if (!razaoSocial || !nomeFantasia) {
    return {
      ok: false as const,
      error:
        tipoPessoa === "fisica"
          ? "Informe nome completo e nome de exibição."
          : "Informe razão social e nome fantasia.",
    };
  }

  const documento = documentoOuNull(formData.get("cnpj_cpf"), tipoPessoa);

  if (!documento.ok) {
    return documento;
  }

  const website = normalizarWebsite(formData.get("website"));

  if (!website.ok) {
    return website;
  }

  if (crt && !isOpcaoCrt(crt)) {
    return { ok: false as const, error: "Informe um CRT válido." };
  }

  if (segmento && !isSegmentoParceiro(segmento)) {
    return { ok: false as const, error: "Informe um segmento válido." };
  }

  if (!latitude.ok) {
    return latitude;
  }

  if (!longitude.ok) {
    return longitude;
  }

  if (!documentosEntrada.ok) {
    return documentosEntrada;
  }

  return {
    ok: true as const,
    payload: {
      tipo_pessoa: tipoPessoa,
      tipo_parceiro: tipoParceiro,
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      codigo_interno: textoOuNull(formData.get("codigo_interno")),
      cnpj_cpf: documento.value,
      inscricao_estadual: textoOuNull(formData.get("inscricao_estadual")),
      inscricao_municipal: textoOuNull(formData.get("inscricao_municipal")),
      crt: crt || null,
      situacao,
      cliente_desde: dataOuNull(formData.get("cliente_desde")),
      segmento: segmento || null,
      cnae: textoOuNull(formData.get("cnae")),
      suframa: textoOuNull(formData.get("suframa")),
      website: website.value,
      organizacao_id: uuidOuNull(formData.get("organizacao_id")),
      latitude: latitude.value,
      longitude: longitude.value,
      origem_geolocalizacao: textoOuNull(formData.get("origem_geolocalizacao")),
      link_maps: textoOuNull(formData.get("link_maps")),
      localizacao_referencia: textoOuNull(formData.get("localizacao_referencia")),
      observacoes_acesso: textoOuNull(formData.get("observacoes_acesso")),
      ponto_referencia: textoOuNull(formData.get("ponto_referencia")),
      estacionamento_privativo: boolForm(formData, "estacionamento_privativo"),
      estacionamento_terceiros: boolForm(formData, "estacionamento_terceiros"),
      estacionamento_terceiros_nome: boolForm(formData, "estacionamento_terceiros")
        ? textoOuNull(formData.get("estacionamento_terceiros_nome"))
        : null,
      estacionamento_terceiros_endereco: boolForm(formData, "estacionamento_terceiros")
        ? textoOuNull(formData.get("estacionamento_terceiros_endereco"))
        : null,
      estacionamento_terceiros_valores: boolForm(formData, "estacionamento_terceiros")
        ? textoOuNull(formData.get("estacionamento_terceiros_valores"))
        : null,
      responsavel_local_nome: textoOuNull(formData.get("responsavel_local_nome")),
      responsavel_local_contato_id: uuidOuNull(formData.get("responsavel_local_contato_id")),
      responsavel_local_telefone: telefoneOuNull(formData.get("responsavel_local_telefone")),
      responsavel_local_whatsapp: boolForm(formData, "responsavel_local_whatsapp"),
      necessita_autorizacao_previa: boolForm(formData, "necessita_autorizacao_previa"),
      possui_portaria_recepcao: boolForm(formData, "possui_portaria_recepcao"),
      possui_doca_carga_descarga: boolForm(formData, "possui_doca_carga_descarga"),
      identificacao_doca: boolForm(formData, "possui_doca_carga_descarga")
        ? textoOuNull(formData.get("identificacao_doca"))
        : null,
      documentos_entrada: documentosEntrada.value,
      horario_funcionamento: textoOuNull(formData.get("horario_funcionamento")),
      horario_atendimento_tecnico: textoOuNull(formData.get("horario_atendimento_tecnico")),
      horario_coleta_entrega: textoOuNull(formData.get("horario_coleta_entrega")),
      atendimento_sabado: boolForm(formData, "atendimento_sabado"),
      atendimento_domingo: boolForm(formData, "atendimento_domingo"),
      atendimento_feriado: boolForm(formData, "atendimento_feriado"),
      necessita_agendamento: boolForm(formData, "necessita_agendamento"),
      prazo_minimo_agendamento: textoOuNull(formData.get("prazo_minimo_agendamento")),
      observacoes_operacionais: textoOuNull(formData.get("observacoes_operacionais")),
      ativo: situacao === "ativo",
    },
  };
}

async function registrarHistorico(
  parceiroId: string,
  tipoEvento: string,
  descricao: string,
  usuarioId: string,
  dados?: Record<string, unknown>
) {
  const supabase = createSupabaseAdminClient();
  await supabase.from("parceiros_historico").insert({
    parceiro_id: parceiroId,
    usuario_id: usuarioId,
    tipo_evento: tipoEvento,
    descricao,
    dados: dados ?? null,
  });
}

export async function salvarParceiroGeral(formData: FormData) {
  const perfil = await requireGestorParceiros();
  const id = normalizarTexto(formData.get("id"));
  const origem = id ? detalhePath(id) : `${LISTAGEM_PARCEIROS_PATH}/nova`;
  const resultado = montarPayloadParceiro(formData);
  let organizacaoId = uuidOuNull(formData.get("organizacao_id"));
  const organizacaoAlterada = formData.get("organizacao_id_alterado") === "1";
  const criarOrganizacaoVinculada =
    !organizacaoId && formData.get("criar_organizacao_vinculada") === "on";

  if (!resultado.ok) {
    redirectComErro(origem, resultado.error);
  }

  if (!normalizarTexto(formData.get("contato_nome"))) {
    redirectComErro(origem, "Informe o nome do contato principal.");
  }

  const supabase = createSupabaseAdminClient();
  const responsavelContatoId = uuidOuNull(formData.get("responsavel_local_contato_id"));

  if (responsavelContatoId) {
    if (!id) {
      redirectComErro(origem, "Selecione um contato vinculado somente após salvar o cliente.");
    }

    const { data: responsavelContato, error: erroResponsavelContato } = await supabase
      .from("parceiros_contatos")
      .select("id")
      .eq("id", responsavelContatoId)
      .eq("parceiro_id", id)
      .maybeSingle();

    if (erroResponsavelContato || !responsavelContato?.id) {
      redirectComErro(origem, "Selecione um responsável no local vinculado a este cliente.");
    }
  }

  if (criarOrganizacaoVinculada) {
    const nomeOrganizacao = nomeOrganizacaoPorCadastro(formData);

    if (!nomeOrganizacao) {
      redirectComErro(origem, "Informe razão social ou nome fantasia para criar a organização.");
    }

    const { data: organizacaoExistente, error: erroOrganizacaoExistente } = await supabase
      .from("organizacoes")
      .select("id")
      .ilike("nome", nomeOrganizacao)
      .limit(1)
      .maybeSingle();

    if (erroOrganizacaoExistente) {
      redirectComErro(origem, "Não foi possível verificar se a organização já existe.");
    }

    if (organizacaoExistente?.id) {
      organizacaoId = String(organizacaoExistente.id);
    } else {
      const { data: organizacaoCriada, error: erroOrganizacaoCriada } = await supabase
        .from("organizacoes")
        .insert({
          nome: nomeOrganizacao,
          codigo_interno: null,
          tipo_organizacao:
            resultado.payload.tipo_parceiro === "cliente" ? "cliente" : "parceiro",
          possui_filiais: false,
          ativo: true,
          observacoes:
            "Organização criada automaticamente a partir do cadastro de cliente/parceiro.",
          criado_por: perfil.id,
          atualizado_por: perfil.id,
        })
        .select("id")
        .single();

      if (erroOrganizacaoCriada || !organizacaoCriada?.id) {
        redirectComErro(origem, "Não foi possível criar a organização vinculada.");
      }

      organizacaoId = String(organizacaoCriada.id);
    }

    resultado.payload.organizacao_id = organizacaoId;
  }

  const payload = {
    ...resultado.payload,
    atualizado_por: perfil.id,
  };

  let parceiroResposta = id
    ? await supabase
        .from("parceiros")
        .update(payload)
        .eq("id", id)
        .select("id, cliente_legado_id, organizacao_id")
        .single()
    : await supabase
        .from("parceiros")
        .insert({
          ...payload,
          criado_por: perfil.id,
        })
        .select("id, cliente_legado_id, organizacao_id")
        .single();

  if (isSchemaColumnError(parceiroResposta.error, "tipo_pessoa")) {
    const payloadCompat = { ...payload };
    delete (payloadCompat as Partial<typeof payload>).tipo_pessoa;
    parceiroResposta = id
      ? await supabase
          .from("parceiros")
          .update(payloadCompat)
          .eq("id", id)
          .select("id, cliente_legado_id, organizacao_id")
          .single()
      : await supabase
          .from("parceiros")
          .insert({
            ...payloadCompat,
            criado_por: perfil.id,
          })
          .select("id, cliente_legado_id, organizacao_id")
          .single();
  }

  if (parceiroResposta.error || !parceiroResposta.data) {
    redirectComErro(origem, mensagemErroParceiro(parceiroResposta.error));
  }

  const parceiroId = String(parceiroResposta.data.id);
  const clienteLegadoId =
    "cliente_legado_id" in parceiroResposta.data
      ? String(parceiroResposta.data.cliente_legado_id ?? "")
      : "";
  const enderecoId = normalizarTexto(formData.get("endereco_id"));
  const contatoId = normalizarTexto(formData.get("contato_id"));

  if ((organizacaoAlterada || criarOrganizacaoVinculada) && clienteLegadoId) {
    const { data: clienteLegado, error: erroClienteLegado } = await supabase
      .from("clientes")
      .select("organizacao_id")
      .eq("id", clienteLegadoId)
      .maybeSingle();

    if (erroClienteLegado) {
      redirectComErro(
        detalhePath(parceiroId),
        "Parceiro salvo, mas não foi possível verificar o vínculo do cliente legado."
      );
    }

    const organizacaoClienteAtual =
      (clienteLegado as { organizacao_id: string | null } | null)?.organizacao_id ?? null;

    if (organizacaoClienteAtual !== organizacaoId) {
      const { error: erroSincronizacao } = await supabase
        .from("clientes")
        .update({ organizacao_id: organizacaoId })
        .eq("id", clienteLegadoId);

      if (erroSincronizacao) {
        redirectComErro(
          detalhePath(parceiroId),
          "Parceiro salvo, mas o vínculo do cliente legado não foi sincronizado."
        );
      }
    }
  }

  const enderecoPayload = {
    parceiro_id: parceiroId,
    tipo_endereco: "principal",
    principal: true,
    cep: cepOuNull(formData.get("cep")),
    endereco: textoOuNull(formData.get("endereco")),
    numero: textoOuNull(formData.get("numero")),
    complemento: textoOuNull(formData.get("complemento")),
    bairro: textoOuNull(formData.get("bairro")),
    cidade: textoOuNull(formData.get("cidade")),
    estado: ufOuNull(formData.get("estado")),
    pais: textoOuNull(formData.get("pais")) ?? "Brasil",
    atualizado_por: perfil.id,
  };

  const temEndereco = Object.values(enderecoPayload).some(
    (valor) => typeof valor === "string" && valor.trim() !== ""
  );

  if (temEndereco) {
    const respostaEndereco = enderecoId
      ? await supabase
          .from("parceiros_enderecos")
          .update(enderecoPayload)
          .eq("id", enderecoId)
      : await supabase.from("parceiros_enderecos").insert({
          ...enderecoPayload,
          criado_por: perfil.id,
        });

    if (respostaEndereco.error) {
      redirectComErro(detalhePath(parceiroId), "Parceiro salvo, mas o endereço não foi gravado.");
    }
  }

  const nomeContato = normalizarTexto(formData.get("contato_nome"));
  const contatoEmail = emailOuNull(formData.get("contato_email"));
  const contatoTipo = normalizarTexto(formData.get("contato_tipo"));
  const contatoDepartamento = normalizarTexto(formData.get("contato_departamento"));
  const contatoCargo = normalizarTexto(formData.get("contato_cargo"));
  const contatoCelular = telefoneOuNull(formData.get("contato_celular"));
  const contatoWhatsapp = boolForm(formData, "contato_celular_whatsapp")
    ? contatoCelular
    : telefoneOuNull(formData.get("contato_whatsapp"));

  if (!contatoEmail.ok) {
    redirectComErro(detalhePath(parceiroId), contatoEmail.error);
  }

  if (contatoTipo && !isTipoContato(contatoTipo)) {
    redirectComErro(detalhePath(parceiroId), "Informe um tipo de contato válido.");
  }

  if (contatoDepartamento && !isDepartamentoContato(contatoDepartamento)) {
    redirectComErro(detalhePath(parceiroId), "Informe um departamento válido.");
  }

  if (contatoCargo && !isCargoContato(contatoCargo)) {
    redirectComErro(detalhePath(parceiroId), "Informe um cargo válido.");
  }

  const contatoPayload = {
    parceiro_id: parceiroId,
    nome: nomeContato,
    tipo_contato: contatoTipo || null,
    cargo: contatoCargo || null,
    telefone: telefoneOuNull(formData.get("contato_telefone")),
    celular: contatoCelular,
    whatsapp: contatoWhatsapp,
    email: contatoEmail.value,
    departamento: contatoDepartamento || null,
    observacoes: textoOuNull(formData.get("contato_observacoes")),
    principal: true,
    contato_financeiro: false,
    contato_tecnico: false,
    contato_operacional: true,
    atualizado_por: perfil.id,
  };
  const respostaContato = await salvarContatoComCompatibilidade(
    supabase,
    contatoId,
    contatoPayload,
    perfil.id
  );

  if (respostaContato.error) {
    redirectComErro(detalhePath(parceiroId), "Parceiro salvo, mas o contato principal não foi gravado.");
  }

  await registrarHistorico(
    parceiroId,
    id ? "parceiro_atualizado" : "parceiro_criado",
    id ? "Dados gerais do parceiro atualizados." : "Parceiro cadastrado.",
    perfil.id
  );

  revalidatePath(LISTAGEM_PARCEIROS_PATH);
  revalidatePath(detalhePath(parceiroId));
  redirectComSucesso(detalhePath(parceiroId));
}

export async function alterarStatusParceiro(id: string, ativo: boolean) {
  const perfil = await requireGestorParceiros();
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("parceiros")
    .update({
      ativo,
      situacao: ativo ? "ativo" : "inativo",
      atualizado_por: perfil.id,
    })
    .eq("id", id);

  if (error) {
    redirectComErro(LISTAGEM_PARCEIROS_PATH, "Não foi possível alterar o status do parceiro.");
  }

  await registrarHistorico(
    id,
    ativo ? "parceiro_ativado" : "parceiro_inativado",
    ativo ? "Parceiro ativado." : "Parceiro inativado.",
    perfil.id
  );

  revalidatePath(LISTAGEM_PARCEIROS_PATH);
  revalidatePath(detalhePath(id));
}

export async function salvarParceiroFilial(formData: FormData) {
  const perfil = await requireGestorParceiros();
  const parceiroId = normalizarTexto(formData.get("parceiro_id"));
  const id = normalizarTexto(formData.get("filial_id"));
  const status = normalizarTexto(formData.get("status"));
  const nomeFilial = normalizarTexto(formData.get("nome_filial"));

  if (!parceiroId || !nomeFilial || !isStatusFilial(status)) {
    redirectComErro(detalhePath(parceiroId), "Informe nome e status da filial.");
  }

  const payload = {
    parceiro_id: parceiroId,
    nome_filial: nomeFilial,
    codigo_interno: textoOuNull(formData.get("codigo_interno")),
    cep: cepOuNull(formData.get("cep")),
    endereco: textoOuNull(formData.get("endereco")),
    numero: textoOuNull(formData.get("numero")),
    complemento: textoOuNull(formData.get("complemento")),
    bairro: textoOuNull(formData.get("bairro")),
    cidade: textoOuNull(formData.get("cidade")),
    estado: ufOuNull(formData.get("estado")),
    pais: textoOuNull(formData.get("pais")) ?? "Brasil",
    contato_nome: textoOuNull(formData.get("contato_nome")),
    contato_telefone: telefoneOuNull(formData.get("contato_telefone")),
    contato_email: textoOuNull(formData.get("contato_email")),
    sla_padrao: textoOuNull(formData.get("sla_padrao")),
    horario_atendimento: textoOuNull(formData.get("horario_atendimento")),
    observacoes_operacionais: textoOuNull(formData.get("observacoes_operacionais")),
    status,
    ativo: status === "ativa",
    atualizado_por: perfil.id,
  };

  const supabase = createSupabaseAdminClient();
  const resposta = id
    ? await supabase.from("parceiros_filiais").update(payload).eq("id", id)
    : await supabase.from("parceiros_filiais").insert({
        ...payload,
        criado_por: perfil.id,
      });

  if (resposta.error) {
    redirectComErro(detalhePath(parceiroId), "Não foi possível salvar a filial.");
  }

  await registrarHistorico(
    parceiroId,
    id ? "filial_atualizada" : "filial_criada",
    id ? "Filial atualizada." : "Filial criada.",
    perfil.id
  );

  revalidatePath(detalhePath(parceiroId));
  redirectComSucesso(detalhePath(parceiroId), "filial");
}

export async function salvarParceiroContato(formData: FormData) {
  const perfil = await requireGestorParceiros();
  const parceiroId = normalizarTexto(formData.get("parceiro_id"));
  const id = normalizarTexto(formData.get("contato_id"));
  const nome = normalizarTexto(formData.get("nome"));
  const tipoContato = normalizarTexto(formData.get("tipo_contato"));
  const departamento = normalizarTexto(formData.get("departamento"));
  const cargo = normalizarTexto(formData.get("cargo"));
  const email = emailOuNull(formData.get("email"));
  const celular = telefoneOuNull(formData.get("celular"));
  const whatsapp = boolForm(formData, "celular_whatsapp")
    ? celular
    : telefoneOuNull(formData.get("whatsapp"));

  if (!parceiroId || !nome) {
    redirectComErro(detalhePath(parceiroId), "Informe o nome do contato.");
  }

  if (tipoContato && !isTipoContato(tipoContato)) {
    redirectComErro(detalhePath(parceiroId), "Informe um tipo de contato válido.");
  }

  if (departamento && !isDepartamentoContato(departamento)) {
    redirectComErro(detalhePath(parceiroId), "Informe um departamento válido.");
  }

  if (cargo && !isCargoContato(cargo)) {
    redirectComErro(detalhePath(parceiroId), "Informe um cargo válido.");
  }

  if (!email.ok) {
    redirectComErro(detalhePath(parceiroId), email.error);
  }

  const payload = {
    parceiro_id: parceiroId,
    nome,
    tipo_contato: tipoContato || null,
    cargo: cargo || null,
    telefone: telefoneOuNull(formData.get("telefone")),
    celular,
    whatsapp,
    email: email.value,
    departamento: departamento || null,
    observacoes: textoOuNull(formData.get("observacoes")),
    principal: boolForm(formData, "principal"),
    contato_financeiro: boolForm(formData, "contato_financeiro"),
    contato_tecnico: boolForm(formData, "contato_tecnico"),
    contato_operacional: boolForm(formData, "contato_operacional"),
    ativo: boolForm(formData, "ativo"),
    atualizado_por: perfil.id,
  };

  const supabase = createSupabaseAdminClient();
  const resposta = await salvarContatoComCompatibilidade(supabase, id, payload, perfil.id);

  if (resposta.error) {
    redirectComErro(detalhePath(parceiroId), "Não foi possível salvar o contato.");
  }

  await registrarHistorico(
    parceiroId,
    id ? "contato_atualizado" : "contato_criado",
    id ? "Contato atualizado." : "Contato criado.",
    perfil.id
  );

  revalidatePath(detalhePath(parceiroId));
  redirectComSucesso(detalhePath(parceiroId), "contato");
}

export async function salvarParceiroFinanceiro(formData: FormData) {
  const perfil = await requireGestorParceiros();
  const parceiroId = normalizarTexto(formData.get("parceiro_id"));

  if (!parceiroId) {
    redirectComErro(LISTAGEM_PARCEIROS_PATH, "Parceiro inválido.");
  }

  const payload = {
    parceiro_id: parceiroId,
    condicao_pagamento: textoOuNull(formData.get("condicao_pagamento")),
    limite_credito: numeroOuNull(formData.get("limite_credito")),
    categoria_financeira: textoOuNull(formData.get("categoria_financeira")),
    centro_custo: textoOuNull(formData.get("centro_custo")),
    vendedor: textoOuNull(formData.get("vendedor")),
    comissao: numeroOuNull(formData.get("comissao")),
    forma_pagamento_padrao: textoOuNull(formData.get("forma_pagamento_padrao")),
    responsavel_financeiro: textoOuNull(formData.get("responsavel_financeiro")),
    email_nf: textoOuNull(formData.get("email_nf")),
    dia_faturamento: inteiroOuNull(formData.get("dia_faturamento")),
    retencao: textoOuNull(formData.get("retencao")),
    natureza_operacao: textoOuNull(formData.get("natureza_operacao")),
    observacoes_financeiras: textoOuNull(formData.get("observacoes_financeiras")),
    atualizado_por: perfil.id,
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("parceiros_financeiro")
    .upsert({ ...payload, criado_por: perfil.id }, { onConflict: "parceiro_id" });

  if (error) {
    redirectComErro(detalhePath(parceiroId), "Não foi possível salvar dados financeiros.");
  }

  await registrarHistorico(
    parceiroId,
    "financeiro_atualizado",
    "Dados financeiros atualizados.",
    perfil.id
  );

  revalidatePath(detalhePath(parceiroId));
  redirectComSucesso(detalhePath(parceiroId), "financeiro");
}

export async function salvarParceiroOperacional(formData: FormData) {
  const perfil = await requireGestorParceiros();
  const parceiroId = normalizarTexto(formData.get("parceiro_id"));

  if (!parceiroId) {
    redirectComErro(LISTAGEM_PARCEIROS_PATH, "Parceiro inválido.");
  }

  const payload = {
    parceiro_id: parceiroId,
    sla_padrao: textoOuNull(formData.get("sla_padrao")),
    atendimento_remoto: boolForm(formData, "atendimento_remoto"),
    atendimento_presencial: boolForm(formData, "atendimento_presencial"),
    cobranca_km: boolForm(formData, "cobranca_km"),
    valor_km: numeroOuNull(formData.get("valor_km")),
    horario_atendimento: textoOuNull(formData.get("horario_atendimento")),
    cobertura: textoOuNull(formData.get("cobertura")),
    criticidade: textoOuNull(formData.get("criticidade")),
    necessita_agendamento: boolForm(formData, "necessita_agendamento"),
    necessita_autorizacao: boolForm(formData, "necessita_autorizacao"),
    exige_cracha: boolForm(formData, "exige_cracha"),
    exige_foto: boolForm(formData, "exige_foto"),
    restricao_horario: textoOuNull(formData.get("restricao_horario")),
    contato_escalonamento: textoOuNull(formData.get("contato_escalonamento")),
    grupo_tecnico_padrao: textoOuNull(formData.get("grupo_tecnico_padrao")),
    observacoes_operacionais: textoOuNull(formData.get("observacoes_operacionais")),
    atualizado_por: perfil.id,
  };

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("parceiros_operacional")
    .upsert({ ...payload, criado_por: perfil.id }, { onConflict: "parceiro_id" });

  if (error) {
    redirectComErro(detalhePath(parceiroId), "Não foi possível salvar regras operacionais.");
  }

  await registrarHistorico(
    parceiroId,
    "operacional_atualizado",
    "Regras operacionais e SLA atualizados.",
    perfil.id
  );

  revalidatePath(detalhePath(parceiroId));
  redirectComSucesso(detalhePath(parceiroId), "operacional");
}

export async function salvarParceiroContrato(formData: FormData) {
  const perfil = await requireGestorParceiros();
  const parceiroId = normalizarTexto(formData.get("parceiro_id"));
  const id = normalizarTexto(formData.get("contrato_id"));
  const contrato = normalizarTexto(formData.get("contrato"));
  const status = normalizarTexto(formData.get("status"));

  if (!parceiroId || !contrato || !isStatusContrato(status)) {
    redirectComErro(detalhePath(parceiroId), "Informe contrato e status.");
  }

  const payload = {
    parceiro_id: parceiroId,
    contrato,
    vigencia_inicio: dataOuNull(formData.get("vigencia_inicio")),
    vigencia_fim: dataOuNull(formData.get("vigencia_fim")),
    sla: textoOuNull(formData.get("sla")),
    status,
    observacoes: textoOuNull(formData.get("observacoes")),
    atualizado_por: perfil.id,
  };

  const supabase = createSupabaseAdminClient();
  const resposta = id
    ? await supabase.from("parceiros_contratos").update(payload).eq("id", id)
    : await supabase.from("parceiros_contratos").insert({
        ...payload,
        criado_por: perfil.id,
      });

  if (resposta.error) {
    redirectComErro(detalhePath(parceiroId), "Não foi possível salvar o contrato.");
  }

  await registrarHistorico(
    parceiroId,
    id ? "contrato_atualizado" : "contrato_criado",
    id ? "Contrato atualizado." : "Contrato criado.",
    perfil.id
  );

  revalidatePath(detalhePath(parceiroId));
  redirectComSucesso(detalhePath(parceiroId), "contrato");
}

export async function registrarParceiroAnexo(formData: FormData) {
  const perfil = await requireGestorParceiros();
  const parceiroId = normalizarTexto(formData.get("parceiro_id"));
  const nomeOriginal = normalizarTexto(formData.get("nome_original"));
  const pathStorage = normalizarTexto(formData.get("path_storage"));

  if (!parceiroId || !nomeOriginal || !pathStorage.startsWith(`parceiros/${parceiroId}/`)) {
    redirectComErro(detalhePath(parceiroId), "Envie um anexo válido antes de registrar.");
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("parceiros_anexos").insert({
    parceiro_id: parceiroId,
    nome_original: nomeOriginal,
    path_storage: pathStorage,
    mime_type: textoOuNull(formData.get("mime_type")),
    tamanho_bytes: inteiroOuNull(formData.get("tamanho_bytes")),
    usuario_id: perfil.id,
    observacao: textoOuNull(formData.get("observacao")),
  });

  if (error) {
    redirectComErro(detalhePath(parceiroId), "Não foi possível registrar o anexo.");
  }

  await registrarHistorico(
    parceiroId,
    "anexo_registrado",
    `Anexo registrado: ${nomeOriginal}.`,
    perfil.id,
    { path_storage: pathStorage }
  );

  revalidatePath(detalhePath(parceiroId));
  redirectComSucesso(detalhePath(parceiroId), "anexo");
}
