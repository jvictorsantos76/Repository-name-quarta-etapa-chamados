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
  return digitos || null;
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

function inteiroOuNull(valor: FormDataEntryValue | null) {
  const numero = numeroOuNull(valor);
  return numero === null ? null : Math.trunc(numero);
}

function boolForm(formData: FormData, campo: string) {
  return formData.get(campo) === "on";
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

async function requireGestorParceiros() {
  const perfil = await requirePerfilAutenticado();

  if (!podeGerenciarCatalogosChamado(perfil.papel)) {
    throw new Error("Perfil sem permissão para administrar clientes/parceiros.");
  }

  return perfil;
}

function montarPayloadParceiro(formData: FormData) {
  const tipoPessoa = normalizarTexto(formData.get("tipo_pessoa")) || "juridica";
  const tipoParceiro = normalizarTexto(formData.get("tipo_parceiro"));
  const situacao = normalizarTexto(formData.get("situacao"));
  const razaoSocial = normalizarTexto(formData.get("razao_social"));
  const nomeFantasia = normalizarTexto(formData.get("nome_fantasia"));
  const crt = normalizarTexto(formData.get("crt"));
  const segmento = normalizarTexto(formData.get("segmento"));

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

  if (!resultado.ok) {
    redirectComErro(origem, resultado.error);
  }

  const supabase = createSupabaseAdminClient();
  const payload = {
    ...resultado.payload,
    atualizado_por: perfil.id,
  };

  const parceiroResposta = id
    ? await supabase
        .from("parceiros")
        .update(payload)
        .eq("id", id)
        .select("id")
        .single()
    : await supabase
        .from("parceiros")
        .insert({
          ...payload,
          criado_por: perfil.id,
        })
        .select("id")
        .single();

  if (parceiroResposta.error || !parceiroResposta.data) {
    redirectComErro(origem, mensagemErroParceiro(parceiroResposta.error));
  }

  const parceiroId = String(parceiroResposta.data.id);
  const enderecoId = normalizarTexto(formData.get("endereco_id"));
  const contatoId = normalizarTexto(formData.get("contato_id"));

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
    latitude: numeroOuNull(formData.get("latitude")),
    longitude: numeroOuNull(formData.get("longitude")),
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
  if (nomeContato) {
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
      principal: true,
      contato_financeiro: false,
      contato_tecnico: false,
      contato_operacional: true,
      atualizado_por: perfil.id,
    };
    const respostaContato = contatoId
      ? await supabase
          .from("parceiros_contatos")
          .update(contatoPayload)
          .eq("id", contatoId)
      : await supabase.from("parceiros_contatos").insert({
          ...contatoPayload,
          criado_por: perfil.id,
        });

    if (respostaContato.error) {
      redirectComErro(detalhePath(parceiroId), "Parceiro salvo, mas o contato principal não foi gravado.");
    }
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
    principal: boolForm(formData, "principal"),
    contato_financeiro: boolForm(formData, "contato_financeiro"),
    contato_tecnico: boolForm(formData, "contato_tecnico"),
    contato_operacional: boolForm(formData, "contato_operacional"),
    ativo: boolForm(formData, "ativo"),
    atualizado_por: perfil.id,
  };

  const supabase = createSupabaseAdminClient();
  const resposta = id
    ? await supabase.from("parceiros_contatos").update(payload).eq("id", id)
    : await supabase.from("parceiros_contatos").insert({
        ...payload,
        criado_por: perfil.id,
      });

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
