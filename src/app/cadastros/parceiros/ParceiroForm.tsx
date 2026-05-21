"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  consultarCepPublico,
  consultarCnpjPublico,
  registrarParceiroAnexo,
  salvarParceiroContato,
  salvarParceiroContrato,
  salvarParceiroFilial,
  salvarParceiroFinanceiro,
  salvarParceiroGeral,
  salvarParceiroOperacional,
} from "./actions";
import {
  CARGOS_CONTATO,
  DEPARTAMENTOS_CONTATO,
  LABEL_CARGO_CONTATO,
  LABEL_CRT,
  LABEL_DEPARTAMENTO_CONTATO,
  LABEL_SEGMENTO_PARCEIRO,
  LABEL_STATUS_CONTRATO,
  LABEL_STATUS_FILIAL,
  LABEL_SITUACAO_PARCEIRO,
  LABEL_TIPO_CONTATO,
  LABEL_TIPO_PARCEIRO,
  LABEL_TIPO_PESSOA,
  OPCOES_CRT,
  SEGMENTOS_PARCEIRO,
  SITUACOES_PARCEIRO,
  STATUS_CONTRATO,
  STATUS_FILIAL,
  TIPOS_CONTATO,
  TIPOS_PARCEIRO,
  TIPOS_PESSOA,
  UFS_BRASIL,
  type OrganizacaoParceiroOpcao,
  type ParceiroDetalhe,
  type TipoPessoa,
} from "./types";

type Props = {
  parceiro?: ParceiroDetalhe | null;
  organizacoes?: OrganizacaoParceiroOpcao[];
  erro?: string | null;
};

type Aba =
  | "geral"
  | "filiais"
  | "contatos"
  | "financeiro"
  | "contratos"
  | "operacao"
  | "anexos"
  | "historico";

type Densidade = "confortavel" | "compacto";
type CampoGeral =
  | "razao_social"
  | "nome_fantasia"
  | "cnpj_cpf"
  | "cnae"
  | "cep"
  | "endereco"
  | "numero"
  | "complemento"
  | "bairro"
  | "cidade"
  | "estado"
  | "pais";
type CamposGeral = Record<CampoGeral, string>;
type SubstituicaoPendente = {
  origem: "cnpj" | "cep";
  campos: Partial<CamposGeral>;
  mensagem: string;
};

const ABAS: { id: Aba; label: string }[] = [
  { id: "geral", label: "Geral" },
  { id: "filiais", label: "Filiais" },
  { id: "contatos", label: "Contatos" },
  { id: "financeiro", label: "Financeiro" },
  { id: "contratos", label: "Contratos e SLA" },
  { id: "operacao", label: "Operação" },
  { id: "anexos", label: "Anexos" },
  { id: "historico", label: "Histórico" },
];

const PARCEIROS_BUCKET = "parceiros-anexos";

function normalizarNomeArquivo(nomeArquivo: string) {
  return nomeArquivo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function classes(densidade: Densidade) {
  return {
    input: `mt-1 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 ${
      densidade === "compacto" ? "min-h-8 py-1" : "min-h-9 py-2"
    }`,
    grid: densidade === "compacto" ? "grid gap-3 md:grid-cols-3" : "grid gap-4 md:grid-cols-2",
    sectionPadding: densidade === "compacto" ? "p-3" : "p-4",
  };
}

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const toggleClass =
  "flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold uppercase tracking-wide text-gray-700";

function somenteDigitos(valor: string) {
  return valor.replace(/\D/g, "");
}

function mascararCnpj(valor: string) {
  return somenteDigitos(valor)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function mascararCpf(valor: string) {
  return somenteDigitos(valor)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})(\d)/, "$1-$2");
}

function mascararDocumento(valor: string | null | undefined, tipoPessoa: TipoPessoa) {
  return tipoPessoa === "fisica"
    ? mascararCpf(valor ?? "")
    : mascararCnpj(valor ?? "");
}

function mascararCep(valor: string) {
  return somenteDigitos(valor).slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
}

function mascararTelefone(valor: string) {
  const digitos = normalizarTelefoneInternacional(valor, 12);
  return formatarTelefoneInternacional(digitos, false);
}

function mascararCelular(valor: string) {
  const digitos = normalizarTelefoneInternacional(valor, 13);
  return formatarTelefoneInternacional(digitos, true);
}

function normalizarTelefoneInternacional(valor: string, maxLength: number) {
  const digitos = somenteDigitos(valor);

  if (!digitos) {
    return "";
  }

  const comPais = digitos.length <= maxLength - 2 && !digitos.startsWith("55")
    ? `55${digitos}`
    : digitos;

  return comPais.slice(0, maxLength);
}

function formatarTelefoneInternacional(digitos: string, celular: boolean) {
  if (!digitos) {
    return "";
  }

  const pais = digitos.slice(0, 2);
  const ddd = digitos.slice(2, 4);
  const numero = digitos.slice(4);
  const prefixo = `+${pais}${ddd ? ` (${ddd})` : ""}`;
  const corte = celular ? 5 : 4;

  if (!numero) {
    return prefixo;
  }

  return `${prefixo} ${numero.slice(0, corte)}${
    numero.length > corte ? `-${numero.slice(corte)}` : ""
  }`;
}

function inferirTipoPessoa(parceiro?: ParceiroDetalhe | null): TipoPessoa {
  if (parceiro?.tipo_pessoa) {
    return parceiro.tipo_pessoa;
  }

  return somenteDigitos(parceiro?.cnpj_cpf ?? "").length === 11 ? "fisica" : "juridica";
}

function normalizarSelect(valor: string | null | undefined, permitidos: readonly string[]) {
  return valor && permitidos.includes(valor) ? valor : "";
}

function enderecoGoogleMaps({
  endereco,
  numero,
  bairro,
  cidade,
  estado,
  pais,
  latitude,
  longitude,
}: {
  endereco?: string | null;
  numero?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
}) {
  const lat = String(latitude ?? "").trim();
  const lng = String(longitude ?? "").trim();

  if (lat && lng) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${lat},${lng}`
    )}`;
  }

  const partes = [
    endereco,
    numero,
    bairro,
    cidade,
    estado,
    pais,
  ].filter(Boolean);

  return partes.length >= 3
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(partes.join(", "))}`
    : null;
}

function emailValido(email: string | null | undefined) {
  const valor = String(email ?? "").trim();
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor) ? valor : null;
}

function whatsappUrl(valor: string | null | undefined) {
  const digitos = somenteDigitos(String(valor ?? ""));
  const normalizado =
    (digitos.length === 10 || digitos.length === 11) && !digitos.startsWith("55")
      ? `55${digitos}`
      : digitos;

  return normalizado.length >= 12 ? `https://wa.me/${normalizado}` : null;
}

function resumoObservacao(valor: string | null | undefined) {
  const texto = String(valor ?? "").trim().replace(/\s+/g, " ");

  if (!texto) {
    return "-";
  }

  return texto.length > 56 ? `${texto.slice(0, 56)}...` : texto;
}

function AcoesContato({
  email,
  telefone,
}: {
  email?: string | null;
  telefone?: string | null;
}) {
  const emailLink = emailValido(email);
  const whatsappLink = whatsappUrl(telefone);

  if (!emailLink && !whatsappLink) {
    return null;
  }

  return (
    <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold normal-case tracking-normal">
      {emailLink ? (
        <a className="text-blue-700 underline-offset-2 hover:underline" href={`mailto:${emailLink}`}>
          Enviar e-mail
        </a>
      ) : null}
      {whatsappLink ? (
        <a
          className="text-emerald-700 underline-offset-2 hover:underline"
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
        >
          Abrir WhatsApp
        </a>
      ) : null}
    </div>
  );
}

function CampoTexto({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
  densidade,
  inputMode,
  maxLength,
  onInput,
  value,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  densidade: Densidade;
  inputMode?: "text" | "search" | "email" | "tel" | "url" | "numeric" | "decimal";
  maxLength?: number;
  onInput?: (event: FormEvent<HTMLInputElement>) => void;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      {required ? <span aria-hidden="true" className="ml-1 text-red-500">*</span> : null}
      <input
        name={name}
        type={type}
        defaultValue={value === undefined ? defaultValue ?? "" : undefined}
        value={value}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        onInput={onInput}
        onChange={onChange}
        className={classes(densidade).input}
      />
    </label>
  );
}

function CampoSelect({
  name,
  label,
  defaultValue,
  value,
  children,
  densidade,
  onChange,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  value?: string;
  children: ReactNode;
  densidade: Densidade;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        name={name}
        defaultValue={value === undefined ? defaultValue ?? "" : undefined}
        value={value}
        onChange={onChange}
        className={classes(densidade).input}
      >
        {children}
      </select>
    </label>
  );
}

function CampoTextarea({
  name,
  label,
  defaultValue,
  rows = 4,
  densidade,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  densidade: Densidade;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={rows}
        className={`${classes(densidade).input} resize-y`}
      />
    </label>
  );
}

function Toggle({
  name,
  label,
  defaultChecked = false,
  checked,
  onChange,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={toggleClass}>
      <span>{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
    </label>
  );
}

function FormSection({
  title,
  children,
  densidade,
}: {
  title: string;
  children: ReactNode;
  densidade: Densidade;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-950">{title}</h2>
      </div>
      <div className={`${classes(densidade).grid} ${classes(densidade).sectionPadding}`}>
        {children}
      </div>
    </section>
  );
}

function MiniTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-[720px] w-full border-collapse text-left text-sm">
        <thead className="bg-gray-50 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-3 py-2">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <tr key={index} className="align-top">
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className="px-3 py-2 text-gray-700">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={headers.length} className="px-3 py-3 text-gray-500">
                Nenhum registro.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function GeralTab({
  parceiro,
  organizacoes,
  densidade,
}: {
  parceiro?: ParceiroDetalhe | null;
  organizacoes: OrganizacaoParceiroOpcao[];
  densidade: Densidade;
}) {
  const endereco = parceiro?.endereco_principal;
  const contato = parceiro?.contato_principal;
  const organizacaoInicial = parceiro?.organizacao_id ?? "";
  const [tipoPessoa, setTipoPessoa] = useState<TipoPessoa>(() =>
    inferirTipoPessoa(parceiro)
  );
  const [campos, setCampos] = useState<CamposGeral>(() => ({
    razao_social: parceiro?.razao_social ?? "",
    nome_fantasia: parceiro?.nome_fantasia ?? "",
    cnpj_cpf: mascararDocumento(parceiro?.cnpj_cpf, inferirTipoPessoa(parceiro)),
    cnae: parceiro?.cnae ?? "",
    cep: mascararCep(endereco?.cep ?? ""),
    endereco: endereco?.endereco ?? "",
    numero: endereco?.numero ?? "",
    complemento: endereco?.complemento ?? "",
    bairro: endereco?.bairro ?? "",
    cidade: endereco?.cidade ?? "",
    estado: normalizarSelect(endereco?.estado?.toUpperCase(), UFS_BRASIL),
    pais: endereco?.pais ?? "Brasil",
  }));
  const [organizacaoId, setOrganizacaoId] = useState(organizacaoInicial);
  const [organizacaoAlterada, setOrganizacaoAlterada] = useState(false);
  const [mensagemConsulta, setMensagemConsulta] = useState("");
  const [situacaoCadastral, setSituacaoCadastral] = useState("");
  const [consultandoCnpj, setConsultandoCnpj] = useState(false);
  const [consultandoCep, setConsultandoCep] = useState(false);
  const [substituicaoPendente, setSubstituicaoPendente] =
    useState<SubstituicaoPendente | null>(null);
  const [contatoCelular, setContatoCelular] = useState(() =>
    mascararCelular(contato?.celular ?? "")
  );
  const [contatoWhatsapp, setContatoWhatsapp] = useState(() =>
    mascararCelular(contato?.whatsapp ?? "")
  );
  const [celularEhWhatsapp, setCelularEhWhatsapp] = useState(
    Boolean(contato?.celular && contato?.celular === contato?.whatsapp)
  );
  const pessoaFisica = tipoPessoa === "fisica";
  const mapsUrl = enderecoGoogleMaps({
    endereco: campos.endereco,
    numero: campos.numero,
    bairro: campos.bairro,
    cidade: campos.cidade,
    estado: campos.estado,
    pais: campos.pais,
    latitude: endereco?.latitude,
    longitude: endereco?.longitude,
  });
  const cnpjConsultavel = !pessoaFisica && somenteDigitos(campos.cnpj_cpf).length === 14;
  const cepConsultavel = somenteDigitos(campos.cep).length === 8;
  const organizacoesSelect =
    organizacaoInicial &&
    parceiro?.organizacao_nome &&
    !organizacoes.some((organizacao) => organizacao.id === organizacaoInicial)
      ? [
          {
            id: organizacaoInicial,
            nome: parceiro.organizacao_nome,
            codigo_interno: null,
            ativo: true,
          },
          ...organizacoes,
        ]
      : organizacoes;

  function atualizarCampo(campo: CampoGeral, valor: string) {
    setCampos((atuais) => ({ ...atuais, [campo]: valor }));
  }

  function aplicarCampos(
    novosCampos: Partial<CamposGeral>,
    origem: SubstituicaoPendente["origem"],
    substituirPreenchidos = false
  ) {
    const conflitos = Object.entries(novosCampos).filter(([campo, valor]) => {
      const atual = campos[campo as CampoGeral]?.trim();
      return Boolean(valor && atual && atual !== String(valor).trim());
    });

    if (conflitos.length > 0 && !substituirPreenchidos) {
      setSubstituicaoPendente({
        origem,
        campos: novosCampos,
        mensagem:
          "Alguns campos já têm informação manual. Revise antes de substituir.",
      });
      return;
    }

    setCampos((atuais) => {
      const atualizados = { ...atuais };

      for (const [campo, valor] of Object.entries(novosCampos)) {
        if (!valor) {
          continue;
        }

        const chave = campo as CampoGeral;
        if (substituirPreenchidos || !atualizados[chave]?.trim()) {
          atualizados[chave] = String(valor);
        }
      }

      return atualizados;
    });
    setSubstituicaoPendente(null);
  }

  async function consultarCnpj() {
    if (!cnpjConsultavel) {
      setMensagemConsulta("Informe um CNPJ com 14 dígitos para consultar.");
      return;
    }

    setConsultandoCnpj(true);
    setMensagemConsulta("");
    setSubstituicaoPendente(null);

    try {
      const resultado = await consultarCnpjPublico(campos.cnpj_cpf);

      if (!resultado.ok) {
        setMensagemConsulta(resultado.mensagem);
        setSituacaoCadastral("");
        return;
      }

      const dados = resultado.data;
      setMensagemConsulta(resultado.mensagem);
      setSituacaoCadastral(dados.situacao_cadastral ?? "");
      aplicarCampos(
        {
          razao_social: dados.razao_social ?? "",
          nome_fantasia: dados.nome_fantasia ?? "",
          cnpj_cpf: mascararCnpj(dados.cnpj ?? ""),
          cnae: dados.cnae ?? "",
          cep: mascararCep(dados.cep ?? ""),
          endereco: dados.endereco ?? "",
          numero: dados.numero ?? "",
          complemento: dados.complemento ?? "",
          bairro: dados.bairro ?? "",
          cidade: dados.cidade ?? "",
          estado: normalizarSelect(dados.estado, UFS_BRASIL),
          pais: dados.pais ?? "Brasil",
        },
        "cnpj"
      );
    } catch {
      setMensagemConsulta("Não foi possível consultar agora. Preencha manualmente.");
      setSituacaoCadastral("");
    } finally {
      setConsultandoCnpj(false);
    }
  }

  async function consultarCep() {
    if (!cepConsultavel) {
      setMensagemConsulta("Informe um CEP com 8 dígitos para consultar.");
      return;
    }

    setConsultandoCep(true);
    setMensagemConsulta("");
    setSubstituicaoPendente(null);

    try {
      const resultado = await consultarCepPublico(campos.cep);

      if (!resultado.ok) {
        setMensagemConsulta(resultado.mensagem);
        return;
      }

      const dados = resultado.data;
      setMensagemConsulta(resultado.mensagem);
      aplicarCampos(
        {
          cep: mascararCep(dados.cep ?? ""),
          endereco: dados.endereco ?? "",
          bairro: dados.bairro ?? "",
          cidade: dados.cidade ?? "",
          estado: normalizarSelect(dados.estado, UFS_BRASIL),
          pais: dados.pais ?? "Brasil",
        },
        "cep"
      );
    } catch {
      setMensagemConsulta("Não foi possível consultar agora. Preencha manualmente.");
    } finally {
      setConsultandoCep(false);
    }
  }

  return (
    <form action={salvarParceiroGeral} className="space-y-4">
      <input type="hidden" name="id" value={parceiro?.id ?? ""} />
      <input type="hidden" name="endereco_id" value={endereco?.id ?? ""} />
      <input type="hidden" name="contato_id" value={contato?.id ?? ""} />
      <input type="hidden" name="organizacao_id_original" value={organizacaoInicial} />
      <input
        type="hidden"
        name="organizacao_id_alterado"
        value={organizacaoAlterada ? "1" : "0"}
      />

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
            {LABEL_TIPO_PESSOA[tipoPessoa]}
          </span>
          <span className="rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            {LABEL_TIPO_PARCEIRO[parceiro?.tipo_parceiro ?? "cliente"]}
          </span>
          <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {LABEL_SITUACAO_PARCEIRO[parceiro?.situacao ?? "ativo"]}
          </span>
        </div>
      </section>

      {parceiro ? (
        <section className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <h2 className="text-base font-bold text-blue-950">
            Vínculo usado nos chamados
          </h2>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                Cliente operacional
              </span>
              <span className="font-semibold">
                {parceiro.cliente_legado_nome ?? "Sem vínculo operacional"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                Organização vinculada
              </span>
              <span className="font-semibold">
                {parceiro.organizacao_nome ?? "Sem organização vinculada"}
              </span>
              {parceiro.organizacao_id ? (
                <Link
                  href={`/cadastros/organizacoes/${parceiro.organizacao_id}`}
                  className="mt-1 block text-xs font-semibold text-blue-700 underline-offset-2 hover:underline"
                >
                  Abrir organização
                </Link>
              ) : null}
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                Filiais vinculadas
              </span>
              <span className="font-semibold">{parceiro.filiais_count ?? 0}</span>
            </div>
          </div>
        </section>
      ) : null}

      <FormSection title="Dados cadastrais" densidade={densidade}>
        <div className="grid gap-2 sm:grid-cols-2">
          <CampoSelect
            name="tipo_pessoa"
            label="Tipo de pessoa"
            value={tipoPessoa}
            densidade={densidade}
            onChange={(event) => {
              const novoTipo = event.target.value as TipoPessoa;
              setTipoPessoa(novoTipo);
              atualizarCampo("cnpj_cpf", mascararDocumento(campos.cnpj_cpf, novoTipo));
              setSituacaoCadastral("");
            }}
          >
            {TIPOS_PESSOA.map((tipo) => (
              <option key={tipo} value={tipo}>
                {LABEL_TIPO_PESSOA[tipo]}
              </option>
            ))}
          </CampoSelect>
          <CampoSelect
            name="tipo_parceiro"
            label="Perfil operacional"
            defaultValue={parceiro?.tipo_parceiro ?? "cliente"}
            densidade={densidade}
          >
            {TIPOS_PARCEIRO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {LABEL_TIPO_PARCEIRO[tipo]}
              </option>
            ))}
          </CampoSelect>
        </div>
        <CampoTexto
          name="razao_social"
          label={pessoaFisica ? "Nome completo" : "Razão social"}
          value={campos.razao_social}
          onChange={(event) => atualizarCampo("razao_social", event.currentTarget.value)}
          required
          densidade={densidade}
        />
        <label className={labelClass}>
          {pessoaFisica ? "CPF" : "CNPJ"}
          <div className="mt-1 flex flex-col gap-2 sm:flex-row">
            <input
              key={tipoPessoa}
              name="cnpj_cpf"
              value={campos.cnpj_cpf}
              onChange={(event) =>
                atualizarCampo(
                  "cnpj_cpf",
                  pessoaFisica
                    ? mascararCpf(event.currentTarget.value)
                    : mascararCnpj(event.currentTarget.value)
                )
              }
              inputMode="numeric"
              maxLength={pessoaFisica ? 14 : 18}
              className={`${classes(densidade).input} mt-0 flex-1`}
            />
            {!pessoaFisica ? (
              <button
                type="button"
                disabled={!cnpjConsultavel || consultandoCnpj}
                onClick={() => {
                  void consultarCnpj();
                }}
                className="min-h-9 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 sm:w-40"
              >
                {consultandoCnpj ? "Consultando..." : "Consultar CNPJ"}
              </button>
            ) : null}
          </div>
        </label>
        <CampoTexto
          name="nome_fantasia"
          label={pessoaFisica ? "Nome de exibição" : "Nome fantasia"}
          value={campos.nome_fantasia}
          onChange={(event) => atualizarCampo("nome_fantasia", event.currentTarget.value)}
          required
          densidade={densidade}
        />
        <CampoTexto
          name="codigo_interno"
          label="Código interno"
          defaultValue={parceiro?.codigo_interno}
          densidade={densidade}
        />
        {pessoaFisica ? (
          <>
            <input type="hidden" name="inscricao_estadual" value={parceiro?.inscricao_estadual ?? ""} />
            <input type="hidden" name="inscricao_municipal" value={parceiro?.inscricao_municipal ?? ""} />
            <input type="hidden" name="crt" value={parceiro?.crt ?? ""} />
            <input type="hidden" name="cnae" value={parceiro?.cnae ?? ""} />
            <input type="hidden" name="suframa" value={parceiro?.suframa ?? ""} />
          </>
        ) : (
          <>
            <CampoTexto
              name="inscricao_estadual"
              label="Inscrição estadual"
              defaultValue={parceiro?.inscricao_estadual}
              densidade={densidade}
            />
            <CampoTexto
              name="inscricao_municipal"
              label="Inscrição municipal"
              defaultValue={parceiro?.inscricao_municipal}
              densidade={densidade}
            />
            <CampoSelect
              name="crt"
              label="CRT"
              defaultValue={normalizarSelect(parceiro?.crt, OPCOES_CRT)}
              densidade={densidade}
            >
              <option value="">Selecione</option>
              {OPCOES_CRT.map((crt) => (
                <option key={crt} value={crt}>
                  {LABEL_CRT[crt]}
                </option>
              ))}
            </CampoSelect>
          </>
        )}
        <CampoSelect
          name="situacao"
          label="Situação"
          defaultValue={parceiro?.situacao ?? "ativo"}
          densidade={densidade}
        >
          {SITUACOES_PARCEIRO.map((situacao) => (
            <option key={situacao} value={situacao}>
              {LABEL_SITUACAO_PARCEIRO[situacao]}
            </option>
          ))}
        </CampoSelect>
        <CampoTexto
          name="cliente_desde"
          label="Data de relacionamento"
          type="date"
          defaultValue={parceiro?.cliente_desde}
          densidade={densidade}
        />
        <CampoSelect
          name="segmento"
          label="Segmento"
          defaultValue={normalizarSelect(parceiro?.segmento, SEGMENTOS_PARCEIRO)}
          densidade={densidade}
        >
          <option value="">Selecione</option>
          {SEGMENTOS_PARCEIRO.map((segmento) => (
            <option key={segmento} value={segmento}>
              {LABEL_SEGMENTO_PARCEIRO[segmento]}
            </option>
          ))}
        </CampoSelect>
        {!pessoaFisica ? (
          <>
            <CampoTexto
              name="cnae"
              label="CNAE"
              value={campos.cnae}
              onChange={(event) => atualizarCampo("cnae", event.currentTarget.value)}
              densidade={densidade}
            />
            <CampoTexto
              name="suframa"
              label="Suframa"
              defaultValue={parceiro?.suframa}
              densidade={densidade}
            />
          </>
        ) : null}
        <CampoTexto
          name="website"
          label="Website"
          defaultValue={parceiro?.website}
          densidade={densidade}
        />
        <CampoSelect
          name="organizacao_id"
          label="Organização vinculada"
          value={organizacaoId}
          densidade={densidade}
          onChange={(event) => {
            setOrganizacaoId(event.currentTarget.value);
            setOrganizacaoAlterada(event.currentTarget.value !== organizacaoInicial);
          }}
        >
          <option value="">Sem organização vinculada</option>
          {organizacoesSelect.map((organizacao) => (
            <option key={organizacao.id} value={organizacao.id}>
              {organizacao.codigo_interno
                ? `${organizacao.nome} (${organizacao.codigo_interno})`
                : organizacao.nome}
            </option>
          ))}
        </CampoSelect>
        {organizacaoId ? (
          <div className="flex items-end">
            <Link
              href={`/cadastros/organizacoes/${organizacaoId}`}
              className="inline-flex min-h-9 w-full items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Abrir organização
            </Link>
          </div>
        ) : null}
        {!organizacaoId ? (
          <label className="flex min-h-9 items-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700">
            <input
              type="checkbox"
              name="criar_organizacao_vinculada"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Criar organização a partir deste cadastro ao salvar</span>
          </label>
        ) : null}
      </FormSection>

      {mensagemConsulta || situacaoCadastral || substituicaoPendente ? (
        <section className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {mensagemConsulta ? <p className="font-semibold">{mensagemConsulta}</p> : null}
          {situacaoCadastral ? (
            <p className="mt-1">
              Situação cadastral do CNPJ:{" "}
              <span className="font-semibold">{situacaoCadastral}</span>
            </p>
          ) : null}
          {substituicaoPendente ? (
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p>{substituicaoPendente.mensagem}</p>
              <button
                type="button"
                onClick={() =>
                  aplicarCampos(
                    substituicaoPendente.campos,
                    substituicaoPendente.origem,
                    true
                  )
                }
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-100"
              >
                Substituir dados
              </button>
            </div>
          ) : null}
        </section>
      ) : null}

      <FormSection title="Contato principal" densidade={densidade}>
        <CampoTexto
          name="contato_nome"
          label="Nome do contato"
          defaultValue={contato?.nome}
          required
          densidade={densidade}
        />
        <CampoSelect
          name="contato_tipo"
          label="Tipo de contato"
          defaultValue={contato?.tipo_contato ?? "operacional"}
          densidade={densidade}
        >
          {TIPOS_CONTATO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {LABEL_TIPO_CONTATO[tipo]}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect
          name="contato_departamento"
          label="Departamento"
          defaultValue={normalizarSelect(contato?.departamento, DEPARTAMENTOS_CONTATO)}
          densidade={densidade}
        >
          <option value="">Selecione</option>
          {DEPARTAMENTOS_CONTATO.map((departamento) => (
            <option key={departamento} value={departamento}>
              {LABEL_DEPARTAMENTO_CONTATO[departamento]}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect
          name="contato_cargo"
          label="Cargo"
          defaultValue={normalizarSelect(contato?.cargo, CARGOS_CONTATO)}
          densidade={densidade}
        >
          <option value="">Selecione</option>
          {CARGOS_CONTATO.map((cargo) => (
            <option key={cargo} value={cargo}>
              {LABEL_CARGO_CONTATO[cargo]}
            </option>
          ))}
        </CampoSelect>
        <CampoTexto
          name="contato_telefone"
          label="Telefone internacional"
          defaultValue={mascararTelefone(contato?.telefone ?? "")}
          densidade={densidade}
          inputMode="tel"
          maxLength={18}
          onInput={(event) => {
            event.currentTarget.value = mascararTelefone(event.currentTarget.value);
          }}
        />
        <CampoTexto
          name="contato_celular"
          label="Celular internacional"
          value={contatoCelular}
          densidade={densidade}
          inputMode="tel"
          maxLength={19}
          onChange={(event) => {
            const valor = mascararCelular(event.currentTarget.value);
            setContatoCelular(valor);
            if (celularEhWhatsapp) {
              setContatoWhatsapp(valor);
            }
          }}
        />
        <div>
          <CampoTexto
            name="contato_email"
            label="E-mail"
            type="email"
            defaultValue={contato?.email}
            densidade={densidade}
            inputMode="email"
          />
          <AcoesContato email={contato?.email} />
        </div>
        <div>
          <CampoTexto
            name="contato_whatsapp"
            label="WhatsApp"
            value={contatoWhatsapp}
            densidade={densidade}
            inputMode="tel"
            maxLength={19}
            onChange={(event) => {
              setContatoWhatsapp(mascararCelular(event.currentTarget.value));
            }}
          />
          <AcoesContato telefone={contato?.whatsapp ?? contato?.celular} />
        </div>
        <Toggle
          name="contato_celular_whatsapp"
          label="Celular é WhatsApp"
          checked={celularEhWhatsapp}
          onChange={(event) => {
            setCelularEhWhatsapp(event.currentTarget.checked);
            if (event.currentTarget.checked) {
              setContatoWhatsapp(contatoCelular);
            }
          }}
        />
        <div className="md:col-span-2">
          <CampoTextarea
            name="contato_observacoes"
            label="Observações do contato"
            defaultValue={contato?.observacoes}
            densidade={densidade}
          />
        </div>
      </FormSection>

      <FormSection title="Endereço principal" densidade={densidade}>
        <CampoTexto
          name="cep"
          label="CEP"
          value={campos.cep}
          onChange={(event) =>
            atualizarCampo("cep", mascararCep(event.currentTarget.value))
          }
          densidade={densidade}
          inputMode="numeric"
          maxLength={9}
        />
        <div className="flex items-end">
          <button
            type="button"
            disabled={!cepConsultavel || consultandoCep}
            onClick={() => {
              void consultarCep();
            }}
            className="min-h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400"
          >
            {consultandoCep ? "Buscando..." : "Buscar CEP"}
          </button>
        </div>
        <CampoTexto name="endereco" label="Endereço / Logradouro" value={campos.endereco} onChange={(event) => atualizarCampo("endereco", event.currentTarget.value)} densidade={densidade} />
        <CampoTexto name="numero" label="Número" value={campos.numero} onChange={(event) => atualizarCampo("numero", event.currentTarget.value)} densidade={densidade} />
        <CampoTexto name="complemento" label="Complemento" value={campos.complemento} onChange={(event) => atualizarCampo("complemento", event.currentTarget.value)} densidade={densidade} />
        <CampoTexto name="bairro" label="Bairro" value={campos.bairro} onChange={(event) => atualizarCampo("bairro", event.currentTarget.value)} densidade={densidade} />
        <CampoTexto name="cidade" label="Cidade" value={campos.cidade} onChange={(event) => atualizarCampo("cidade", event.currentTarget.value)} densidade={densidade} />
        <CampoSelect
          name="estado"
          label="Estado / UF"
          value={campos.estado}
          densidade={densidade}
          onChange={(event) => atualizarCampo("estado", event.currentTarget.value)}
        >
          <option value="">Selecione</option>
          {UFS_BRASIL.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </CampoSelect>
        <CampoSelect name="pais" label="País" value={campos.pais} densidade={densidade} onChange={(event) => atualizarCampo("pais", event.currentTarget.value)}>
          <option value="Brasil">Brasil</option>
        </CampoSelect>
      </FormSection>

      <input type="hidden" name="latitude" value={endereco?.latitude ?? ""} />
      <input type="hidden" name="longitude" value={endereco?.longitude ?? ""} />

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <h2 className="text-base font-bold text-gray-950">Localização</h2>
        </div>
        <div className={`space-y-3 ${classes(densidade).sectionPadding}`}>
          <p className="text-sm text-gray-600">
            A abertura usa coordenadas quando disponíveis ou o endereço preenchido no cadastro.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {mapsUrl ? (
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
              >
                Abrir no Google Maps
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-9 items-center justify-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-400"
              >
                Abrir no Google Maps
              </button>
            )}
          </div>
          {densidade === "compacto" ? (
            <div className="grid gap-3 md:grid-cols-2">
              <CampoTexto name="latitude_tecnica" label="Latitude técnica" defaultValue={endereco?.latitude} densidade={densidade} />
              <CampoTexto name="longitude_tecnica" label="Longitude técnica" defaultValue={endereco?.longitude} densidade={densidade} />
            </div>
          ) : null}
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/cadastros/parceiros"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          Salvar parceiro
        </button>
      </div>
    </form>
  );
}

function FiliaisTab({
  parceiro,
  densidade,
}: {
  parceiro: ParceiroDetalhe;
  densidade: Densidade;
}) {
  return (
    <div className="space-y-4">
      <MiniTable
        headers={["Filial", "Loja vinculada", "Cidade", "SLA", "Contato", "Status"]}
        rows={parceiro.filiais.map((filial) => [
          filial.nome_filial,
          filial.loja_legado_nome ?? "Sem loja legada",
          filial.cidade ?? "-",
          filial.sla_padrao ?? "-",
          filial.contato_nome ?? filial.contato_telefone ?? "-",
          LABEL_STATUS_FILIAL[filial.status],
        ])}
      />

      <form action={salvarParceiroFilial} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="parceiro_id" value={parceiro.id} />
        <div className={classes(densidade).grid}>
          <CampoTexto name="nome_filial" label="Filial" required densidade={densidade} />
          <CampoTexto name="codigo_interno" label="Código interno" densidade={densidade} />
          <CampoTexto name="cep" label="CEP" densidade={densidade} />
          <CampoTexto name="endereco" label="Endereço" densidade={densidade} />
          <CampoTexto name="numero" label="Número" densidade={densidade} />
          <CampoTexto name="bairro" label="Bairro" densidade={densidade} />
          <CampoTexto name="cidade" label="Cidade" densidade={densidade} />
          <CampoTexto name="estado" label="Estado" densidade={densidade} />
          <CampoTexto name="pais" label="País" defaultValue="Brasil" densidade={densidade} />
          <CampoTexto name="contato_nome" label="Contato" densidade={densidade} />
          <CampoTexto name="contato_telefone" label="Telefone" densidade={densidade} />
          <CampoTexto name="contato_email" label="E-mail" densidade={densidade} />
          <CampoTexto name="sla_padrao" label="SLA" densidade={densidade} />
          <CampoTexto name="horario_atendimento" label="Horários" densidade={densidade} />
          <label className={labelClass}>
            Status
            <select name="status" defaultValue="ativa" className={classes(densidade).input}>
              {STATUS_FILIAL.map((status) => (
                <option key={status} value={status}>
                  {LABEL_STATUS_FILIAL[status]}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <CampoTextarea name="observacoes_operacionais" label="Observações operacionais" densidade={densidade} />
          </div>
        </div>
        <button type="submit" className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          + Nova filial
        </button>
      </form>
    </div>
  );
}

function ContatosTab({
  parceiro,
  densidade,
}: {
  parceiro: ParceiroDetalhe;
  densidade: Densidade;
}) {
  const [contatoEmEdicaoId, setContatoEmEdicaoId] = useState("");
  const contatoEmEdicao =
    parceiro.contatos.find((contato) => contato.id === contatoEmEdicaoId) ?? null;

  return (
    <div className="space-y-4">
      <MiniTable
        headers={["Nome", "Tipo", "Cargo", "Telefone", "WhatsApp", "E-mail", "Obs.", "Ações"]}
        rows={parceiro.contatos.map((contato) => [
          contato.nome,
          contato.tipo_contato ? LABEL_TIPO_CONTATO[contato.tipo_contato] : "-",
          normalizarSelect(contato.cargo, CARGOS_CONTATO)
            ? LABEL_CARGO_CONTATO[contato.cargo as keyof typeof LABEL_CARGO_CONTATO]
            : contato.cargo ?? "-",
          mascararTelefone(contato.telefone ?? contato.celular ?? ""),
          mascararCelular(contato.whatsapp ?? ""),
          contato.email ?? "-",
          resumoObservacao(contato.observacoes),
          <div key={contato.id} className="flex flex-col gap-1">
            <span>{contato.principal ? "Principal" : "Contato"}</span>
            <AcoesContato
              email={contato.email}
              telefone={contato.whatsapp ?? contato.celular}
            />
            <button
              type="button"
              onClick={() => setContatoEmEdicaoId(contato.id)}
              className="text-left text-xs font-semibold text-blue-700 underline-offset-2 hover:underline"
            >
              Editar
            </button>
          </div>,
        ])}
      />
      <form
        key={contatoEmEdicao?.id ?? "novo-contato"}
        action={salvarParceiroContato}
        className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <input type="hidden" name="parceiro_id" value={parceiro.id} />
        <input type="hidden" name="contato_id" value={contatoEmEdicao?.id ?? ""} />
        <div className={classes(densidade).grid}>
          <CampoTexto
            name="nome"
            label="Nome"
            defaultValue={contatoEmEdicao?.nome}
            required
            densidade={densidade}
          />
          <CampoSelect
            name="tipo_contato"
            label="Tipo de contato"
            defaultValue={contatoEmEdicao?.tipo_contato ?? "operacional"}
            densidade={densidade}
          >
            {TIPOS_CONTATO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {LABEL_TIPO_CONTATO[tipo]}
              </option>
            ))}
          </CampoSelect>
          <CampoSelect
            name="departamento"
            label="Departamento"
            defaultValue={normalizarSelect(contatoEmEdicao?.departamento, DEPARTAMENTOS_CONTATO)}
            densidade={densidade}
          >
            <option value="">Selecione</option>
            {DEPARTAMENTOS_CONTATO.map((departamento) => (
              <option key={departamento} value={departamento}>
                {LABEL_DEPARTAMENTO_CONTATO[departamento]}
              </option>
            ))}
          </CampoSelect>
          <CampoSelect
            name="cargo"
            label="Cargo"
            defaultValue={normalizarSelect(contatoEmEdicao?.cargo, CARGOS_CONTATO)}
            densidade={densidade}
          >
            <option value="">Selecione</option>
            {CARGOS_CONTATO.map((cargo) => (
              <option key={cargo} value={cargo}>
                {LABEL_CARGO_CONTATO[cargo]}
              </option>
            ))}
          </CampoSelect>
          <CampoTexto
            name="telefone"
            label="Telefone internacional"
            defaultValue={mascararTelefone(contatoEmEdicao?.telefone ?? "")}
            densidade={densidade}
            inputMode="tel"
            maxLength={18}
            onInput={(event) => {
              event.currentTarget.value = mascararTelefone(event.currentTarget.value);
            }}
          />
          <CampoTexto
            name="celular"
            label="Celular internacional"
            defaultValue={mascararCelular(contatoEmEdicao?.celular ?? "")}
            densidade={densidade}
            inputMode="tel"
            maxLength={19}
            onInput={(event) => {
              event.currentTarget.value = mascararCelular(event.currentTarget.value);
            }}
          />
          <CampoTexto
            name="whatsapp"
            label="WhatsApp"
            defaultValue={mascararCelular(contatoEmEdicao?.whatsapp ?? "")}
            densidade={densidade}
            inputMode="tel"
            maxLength={19}
            onInput={(event) => {
              event.currentTarget.value = mascararCelular(event.currentTarget.value);
            }}
          />
          <div>
            <CampoTexto
              name="email"
              label="E-mail"
              type="email"
              defaultValue={contatoEmEdicao?.email}
              densidade={densidade}
              inputMode="email"
            />
            <AcoesContato email={contatoEmEdicao?.email} />
          </div>
          <Toggle
            name="celular_whatsapp"
            label="Celular é WhatsApp"
            defaultChecked={Boolean(
              contatoEmEdicao?.celular &&
                contatoEmEdicao.celular === contatoEmEdicao.whatsapp
            )}
          />
          <Toggle name="principal" label="Principal" defaultChecked={contatoEmEdicao?.principal ?? false} />
          <Toggle
            name="contato_financeiro"
            label="Financeiro"
            defaultChecked={contatoEmEdicao?.contato_financeiro ?? false}
          />
          <Toggle
            name="contato_tecnico"
            label="Técnico"
            defaultChecked={contatoEmEdicao?.contato_tecnico ?? false}
          />
          <Toggle
            name="contato_operacional"
            label="Operacional"
            defaultChecked={contatoEmEdicao?.contato_operacional ?? true}
          />
          <Toggle name="ativo" label="Ativo" defaultChecked={contatoEmEdicao?.ativo ?? true} />
          <div className="md:col-span-2">
            <CampoTextarea
              name="observacoes"
              label="Observações do contato"
              defaultValue={contatoEmEdicao?.observacoes}
              densidade={densidade}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <button type="submit" className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
            {contatoEmEdicao ? "Salvar contato" : "+ Novo contato"}
          </button>
          {contatoEmEdicao ? (
            <button
              type="button"
              onClick={() => setContatoEmEdicaoId("")}
              className="min-h-10 rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Limpar edição
            </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function FinanceiroTab({
  parceiro,
  densidade,
}: {
  parceiro: ParceiroDetalhe;
  densidade: Densidade;
}) {
  const financeiro = parceiro.financeiro;

  return (
    <form action={salvarParceiroFinanceiro} className="space-y-4">
      <input type="hidden" name="parceiro_id" value={parceiro.id} />
      <FormSection title="Cobrança" densidade={densidade}>
        <CampoTexto name="condicao_pagamento" label="Condição de pagamento" defaultValue={financeiro?.condicao_pagamento} densidade={densidade} />
        <CampoTexto name="limite_credito" label="Limite de crédito" defaultValue={financeiro?.limite_credito} densidade={densidade} />
        <CampoTexto name="categoria_financeira" label="Categoria financeira" defaultValue={financeiro?.categoria_financeira} densidade={densidade} />
        <CampoTexto name="centro_custo" label="Centro de custo" defaultValue={financeiro?.centro_custo} densidade={densidade} />
        <CampoTexto name="vendedor" label="Vendedor" defaultValue={financeiro?.vendedor} densidade={densidade} />
        <CampoTexto name="comissao" label="Comissão" defaultValue={financeiro?.comissao} densidade={densidade} />
        <CampoTexto name="forma_pagamento_padrao" label="Forma padrão" defaultValue={financeiro?.forma_pagamento_padrao} densidade={densidade} />
      </FormSection>
      <FormSection title="Faturamento" densidade={densidade}>
        <CampoTexto name="responsavel_financeiro" label="Responsável financeiro" defaultValue={financeiro?.responsavel_financeiro} densidade={densidade} />
        <CampoTexto name="email_nf" label="E-mail NF" defaultValue={financeiro?.email_nf} densidade={densidade} />
        <CampoTexto name="dia_faturamento" label="Dia faturamento" defaultValue={financeiro?.dia_faturamento} densidade={densidade} />
        <CampoTexto name="retencao" label="Retenção" defaultValue={financeiro?.retencao} densidade={densidade} />
        <CampoTexto name="natureza_operacao" label="Natureza operação" defaultValue={financeiro?.natureza_operacao} densidade={densidade} />
        <div className="md:col-span-2">
          <CampoTextarea name="observacoes_financeiras" label="Observações financeiras" defaultValue={financeiro?.observacoes_financeiras} densidade={densidade} />
        </div>
      </FormSection>
      <button type="submit" className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
        Salvar financeiro
      </button>
    </form>
  );
}

function OperacaoTab({
  parceiro,
  densidade,
}: {
  parceiro: ParceiroDetalhe;
  densidade: Densidade;
}) {
  const op = parceiro.operacional;

  return (
    <form action={salvarParceiroOperacional} className="space-y-4">
      <input type="hidden" name="parceiro_id" value={parceiro.id} />
      <FormSection title="SLA" densidade={densidade}>
        <CampoTexto name="sla_padrao" label="SLA padrão" defaultValue={op?.sla_padrao} densidade={densidade} />
        <Toggle name="atendimento_remoto" label="Remoto" defaultChecked={op?.atendimento_remoto ?? true} />
        <Toggle name="atendimento_presencial" label="Presencial" defaultChecked={op?.atendimento_presencial ?? true} />
        <Toggle name="cobranca_km" label="Cobrança KM" defaultChecked={op?.cobranca_km ?? false} />
        <CampoTexto name="valor_km" label="Valor KM" defaultValue={op?.valor_km} densidade={densidade} />
        <CampoTexto name="horario_atendimento" label="Horário atendimento" defaultValue={op?.horario_atendimento} densidade={densidade} />
        <CampoTexto name="cobertura" label="Cobertura" defaultValue={op?.cobertura} densidade={densidade} />
        <CampoTexto name="criticidade" label="Criticidade" defaultValue={op?.criticidade} densidade={densidade} />
      </FormSection>
      <FormSection title="Regras operacionais" densidade={densidade}>
        <Toggle name="necessita_agendamento" label="Agendamento" defaultChecked={op?.necessita_agendamento ?? false} />
        <Toggle name="necessita_autorizacao" label="Autorização" defaultChecked={op?.necessita_autorizacao ?? false} />
        <Toggle name="exige_cracha" label="Crachá" defaultChecked={op?.exige_cracha ?? false} />
        <Toggle name="exige_foto" label="Foto" defaultChecked={op?.exige_foto ?? false} />
        <CampoTexto name="restricao_horario" label="Restrição horário" defaultValue={op?.restricao_horario} densidade={densidade} />
        <CampoTexto name="contato_escalonamento" label="Escalonamento" defaultValue={op?.contato_escalonamento} densidade={densidade} />
        <CampoTexto name="grupo_tecnico_padrao" label="Grupo técnico" defaultValue={op?.grupo_tecnico_padrao} densidade={densidade} />
        <div className="md:col-span-2">
          <CampoTextarea name="observacoes_operacionais" label="Observações operacionais" rows={7} defaultValue={op?.observacoes_operacionais} densidade={densidade} />
        </div>
      </FormSection>
      <button type="submit" className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
        Salvar operação
      </button>
    </form>
  );
}

function ContratosTab({
  parceiro,
  densidade,
}: {
  parceiro: ParceiroDetalhe;
  densidade: Densidade;
}) {
  return (
    <div className="space-y-4">
      <MiniTable
        headers={["Contrato", "Vigência", "SLA", "Status"]}
        rows={parceiro.contratos.map((contrato) => [
          contrato.contrato,
          `${contrato.vigencia_inicio ?? "-"} até ${contrato.vigencia_fim ?? "-"}`,
          contrato.sla ?? "-",
          LABEL_STATUS_CONTRATO[contrato.status],
        ])}
      />
      <form action={salvarParceiroContrato} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="parceiro_id" value={parceiro.id} />
        <div className={classes(densidade).grid}>
          <CampoTexto name="contrato" label="Contrato" required densidade={densidade} />
          <CampoTexto name="vigencia_inicio" label="Vigência início" type="date" densidade={densidade} />
          <CampoTexto name="vigencia_fim" label="Vigência fim" type="date" densidade={densidade} />
          <CampoTexto name="sla" label="SLA" densidade={densidade} />
          <label className={labelClass}>
            Status
            <select name="status" defaultValue="ativo" className={classes(densidade).input}>
              {STATUS_CONTRATO.map((status) => (
                <option key={status} value={status}>
                  {LABEL_STATUS_CONTRATO[status]}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <CampoTextarea name="observacoes" label="Observações" densidade={densidade} />
          </div>
        </div>
        <button type="submit" className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          + Novo contrato
        </button>
      </form>
    </div>
  );
}

function AnexosTab({
  parceiro,
  densidade,
}: {
  parceiro: ParceiroDetalhe;
  densidade: Densidade;
}) {
  const supabase = useSupabaseBrowserClient();
  const [mensagem, setMensagem] = useState("");
  const [pathStorage, setPathStorage] = useState("");
  const [nomeOriginal, setNomeOriginal] = useState("");
  const [mimeType, setMimeType] = useState("");
  const [tamanhoBytes, setTamanhoBytes] = useState("");

  async function prepararUpload(event: FormEvent<HTMLFormElement>) {
    if (pathStorage) {
      return;
    }

    const input = event.currentTarget.elements.namedItem("arquivo");
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
      return;
    }

    event.preventDefault();
    const arquivo = input.files[0];
    const nomeSeguro = normalizarNomeArquivo(arquivo.name);
    const caminho = `parceiros/${parceiro.id}/${Date.now()}-${nomeSeguro}`;
    setMensagem("Enviando anexo...");

    const { error } = await supabase.storage
      .from(PARCEIROS_BUCKET)
      .upload(caminho, arquivo, {
        contentType: arquivo.type || "application/octet-stream",
        upsert: false,
      });

    if (error) {
      setMensagem(error.message);
      return;
    }

    setPathStorage(caminho);
    setNomeOriginal(arquivo.name);
    setMimeType(arquivo.type || "application/octet-stream");
    setTamanhoBytes(String(arquivo.size));
    setMensagem("Anexo enviado. Registre para vincular ao parceiro.");
  }

  return (
    <div className="space-y-4">
      <MiniTable
        headers={["Arquivo", "Tipo", "Tamanho", "Enviado em"]}
        rows={parceiro.anexos.map((anexo) => [
          anexo.nome_original,
          anexo.mime_type ?? "-",
          anexo.tamanho_bytes ? `${Math.round(anexo.tamanho_bytes / 1024)} KB` : "-",
          new Intl.DateTimeFormat("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
          }).format(new Date(anexo.created_at)),
        ])}
      />
      <form action={registrarParceiroAnexo} onSubmit={prepararUpload} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="parceiro_id" value={parceiro.id} />
        <input type="hidden" name="nome_original" value={nomeOriginal} />
        <input type="hidden" name="path_storage" value={pathStorage} />
        <input type="hidden" name="mime_type" value={mimeType} />
        <input type="hidden" name="tamanho_bytes" value={tamanhoBytes} />
        <div className={classes(densidade).grid}>
          <label className={labelClass}>
            Arquivo
            <input name="arquivo" type="file" className={classes(densidade).input} />
          </label>
          <CampoTexto name="observacao" label="Observação" densidade={densidade} />
        </div>
        {mensagem ? <p className="text-sm font-semibold text-gray-700">{mensagem}</p> : null}
        <button type="submit" className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          Registrar anexo
        </button>
      </form>
    </div>
  );
}

function HistoricoTab({ parceiro }: { parceiro: ParceiroDetalhe }) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-950">Timeline operacional</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {parceiro.historico.length > 0 ? (
          parceiro.historico.map((evento) => (
            <div key={evento.id} className="px-4 py-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-semibold text-gray-950">
                  {evento.descricao}
                </span>
                <span className="text-xs font-semibold text-gray-500">
                  {new Intl.DateTimeFormat("pt-BR", {
                    dateStyle: "short",
                    timeStyle: "short",
                  }).format(new Date(evento.created_at))}
                </span>
              </div>
              <p className="mt-1 text-xs uppercase tracking-wide text-gray-500">
                {evento.tipo_evento}
              </p>
            </div>
          ))
        ) : (
          <p className="px-4 py-3 text-sm text-gray-600">
            Nenhum evento registrado.
          </p>
        )}
      </div>
    </section>
  );
}

export function ParceiroForm({ parceiro, organizacoes = [], erro }: Props) {
  const [aba, setAba] = useState<Aba>("geral");
  const [densidade, setDensidade] = useState<Densidade>("confortavel");
  const editando = Boolean(parceiro);

  return (
    <div className="space-y-4">
      {erro ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {erro}
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-2 overflow-x-auto">
            {ABAS.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!editando && item.id !== "geral"}
                onClick={() => setAba(item.id)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-sm font-semibold transition ${
                  aba === item.id
                    ? "bg-gray-900 text-white"
                    : "bg-gray-50 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div className="inline-flex w-fit rounded-md border border-gray-200 bg-gray-50 p-1">
            {(["confortavel", "compacto"] as Densidade[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setDensidade(item)}
                className={`rounded px-3 py-1.5 text-xs font-semibold uppercase tracking-wide ${
                  densidade === item ? "bg-white text-gray-950 shadow-sm" : "text-gray-600"
                }`}
              >
                {item === "confortavel" ? "Confortável" : "ERP compacto"}
              </button>
            ))}
          </div>
        </div>
      </section>

      {aba === "geral" ? (
        <GeralTab
          parceiro={parceiro}
          organizacoes={organizacoes}
          densidade={densidade}
        />
      ) : null}
      {parceiro && aba === "filiais" ? <FiliaisTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "contatos" ? <ContatosTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "financeiro" ? <FinanceiroTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "contratos" ? <ContratosTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "operacao" ? <OperacaoTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "anexos" ? <AnexosTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "historico" ? <HistoricoTab parceiro={parceiro} /> : null}
    </div>
  );
}
