"use client";

import Link from "next/link";
import { useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { AgendaSemanalAtendimento } from "@/components/AgendaSemanalAtendimento";
import {
  montarAgendaAtendimentoInicial,
  serializarAgendaAtendimento,
  validarAgendaAtendimento,
  type DiaAtendimento,
} from "@/lib/agenda-semanal";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  coordenadasValidas,
  interpretarCoordenadasMaps,
  montarDestinoRota,
  montarMapaEmbed,
  montarMapaPreview,
  normalizarNumeroCoordenada,
} from "./location-utils";
import {
  consultarCepPublico,
  consultarCnpjPublico,
  registrarParceiroAnexo,
  salvarParceiroContato,
  salvarParceiroFinanceiro,
  salvarParceiroGeral,
  salvarParceiroOperacional,
} from "./actions";
import {
  CARGOS_CONTATO,
  DEPARTAMENTOS_CONTATO,
  DOCUMENTOS_ENTRADA,
  LABEL_CARGO_CONTATO,
  LABEL_CRT,
  LABEL_DEPARTAMENTO_CONTATO,
  LABEL_SEGMENTO_PARCEIRO,
  LABEL_STATUS_CONTRATO,
  LABEL_SITUACAO_PARCEIRO,
  LABEL_TIPO_CONTATO,
  LABEL_TIPO_PARCEIRO,
  LABEL_TIPO_PESSOA,
  OPCOES_CRT,
  SEGMENTOS_PARCEIRO,
  SITUACOES_PARCEIRO,
  TIPOS_CONTATO,
  TIPOS_PARCEIRO,
  TIPOS_PESSOA,
  UFS_BRASIL,
  type OrganizacaoParceiroOpcao,
  type ParceiroDetalhe,
  type ParceiroOrganizacaoResumo,
  type ParceiroSlaOpcao,
  type TipoPessoa,
} from "./types";

type Props = {
  parceiro?: ParceiroDetalhe | null;
  organizacoes?: OrganizacaoParceiroOpcao[];
  slas?: ParceiroSlaOpcao[];
  erro?: string | null;
  sucesso?: string | null;
};

function labelSla(sla: ParceiroSlaOpcao) {
  return `${sla.codigo} - ${sla.nome}`;
}

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
type CampoLocalizacao =
  | "link_maps"
  | "latitude"
  | "longitude"
  | "origem_geolocalizacao"
  | "localizacao_referencia";
type CamposLocalizacao = Record<CampoLocalizacao, string>;
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
  { id: "contratos", label: "Contratos" },
  { id: "operacao", label: "Operação" },
  { id: "anexos", label: "Anexos" },
  { id: "historico", label: "Histórico" },
];

const PARCEIROS_BUCKET = "parceiros-anexos";
const ORIGENS_GEOLOCALIZACAO = [
  "",
  "Endereço cadastral",
  "CEP",
  "CNPJ",
  "Google Maps",
  "Manual",
  "Técnico em campo",
  "Cliente informou",
] as const;
const CATEGORIAS_FINANCEIRAS = [
  "Sem categoria",
  "Compra de insumos e matéria prima",
  "Compras de fornecedores",
  "Contribuição social sobre lucro líquido",
  "Custo das mercadorias vendidas",
  "Custo dos produtos vendidos",
  "Custo dos serviços prestados",
  "Descontos incondicionais",
  "Despesas adicionais em operações financeiras",
] as const;
const LABEL_CATEGORIA_FINANCEIRA: Record<string, string> =
  Object.fromEntries(
    CATEGORIAS_FINANCEIRAS.map((categoria) => [categoria, categoria])
  );

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
    input: `mt-1 w-full min-w-0 rounded-md border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 ${
      densidade === "compacto" ? "min-h-8 py-1" : "min-h-10 py-2"
    }`,
    button: `inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-md border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 ${
      densidade === "compacto" ? "min-h-8 py-1" : "min-h-10 py-2"
    }`,
    grid:
      densidade === "compacto"
        ? "grid gap-x-3 gap-y-2 md:grid-cols-3"
        : "grid gap-x-4 gap-y-3 md:grid-cols-2",
    sectionPadding: densidade === "compacto" ? "p-3" : "p-4",
  };
}

function canonicalFormGrid(densidade: Densidade) {
  return densidade === "compacto"
    ? "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-3 gap-y-4 md:grid-cols-3"
    : "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-x-4 gap-y-[1.2rem] md:grid-cols-2";
}

const fullFieldClass = "md:col-span-2";
const longTextFieldClass = "md:col-span-full";

const labelClass = "flex min-w-0 flex-col text-[11px] font-semibold text-gray-500";
const longFieldLabelClass = "block min-w-0 text-[11px] font-semibold text-gray-500";
const labelTextClass = "uppercase tracking-wide";
const auxiliaryTextClass =
  "mt-1 text-xs font-semibold normal-case tracking-normal text-gray-700";
const auxiliaryLinkClass =
  "inline-flex w-fit max-w-full whitespace-nowrap text-xs font-semibold normal-case tracking-normal underline-offset-2 hover:underline";
const inlineAuxiliaryActionClass =
  "inline-flex w-fit whitespace-nowrap font-[Arial] text-[11px] font-semibold uppercase leading-[inherit] tracking-wide text-blue-700 underline-offset-2 hover:underline disabled:cursor-wait disabled:text-blue-400";
const inlineCheckboxClass =
  "inline-flex h-[17px] max-h-[17px] w-fit items-center gap-2 overflow-hidden font-[Arial] text-[11px] font-semibold uppercase leading-[17px] tracking-wide text-blue-700 underline-offset-2 hover:underline";
const inlineCheckboxInputClass =
  "h-[17px] w-[17px] shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500";
const smallFieldsGroupClass = "grid min-w-0 grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-3";
const emailPattern = "[^@\\s]+@[^@\\s]+\\.[^@\\s]+";
const metaBadgeClass =
  "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide";

function toggleClass(densidade: Densidade) {
  return `flex items-center justify-start gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold uppercase tracking-wide text-gray-700 ${
    densidade === "compacto" ? "min-h-8 py-1.5" : "min-h-10 py-2"
  }`;
}

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

function formatarMoedaReaisPorCentavos(centavos: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

function centavosDeValorMonetario(valor: string | number | null | undefined) {
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return Math.round(valor * 100);
  }

  return Number(somenteDigitos(String(valor ?? "")));
}

function centavosTextoDeValorMonetario(valor: string | number | null | undefined) {
  if (valor === null || valor === undefined || valor === "") {
    return "";
  }

  const centavos = centavosDeValorMonetario(valor);
  return Number.isFinite(centavos) ? String(centavos) : "";
}

function valorDecimalDeCentavos(centavos: number) {
  return (centavos / 100).toFixed(2);
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

function montarEnderecoFormatado(campos: CamposGeral) {
  return [
    campos.endereco,
    campos.numero,
    campos.bairro,
    campos.cidade,
    campos.estado,
    campos.pais,
  ]
    .filter((parte) => parte.trim())
    .join(", ");
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

function feedbackConsultaClass(
  origem: SubstituicaoPendente["origem"],
  mensagem: string,
  substituicaoPendente: SubstituicaoPendente | null
) {
  if (substituicaoPendente?.origem === origem) {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (
    mensagem.startsWith("CNPJ consultado") ||
    mensagem.startsWith("CEP encontrado")
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  return "border-red-200 bg-red-50 text-red-700";
}

function valorSelectEditavel(
  valor: string | null | undefined,
  opcoes: readonly string[],
  fallback = ""
) {
  const normalizado = String(valor ?? "").trim();

  if (!normalizado) {
    return fallback;
  }

  return opcoes.includes(normalizado) ? normalizado : "outro";
}

function labelContatoCatalogo(
  valor: string | null | undefined,
  labels: Record<string, string>
) {
  const normalizado = String(valor ?? "").trim();

  if (!normalizado) {
    return "-";
  }

  return labels[normalizado] ?? normalizado;
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
    <div className="mt-1 flex min-h-4 flex-wrap items-center gap-2">
      {emailLink ? (
        <a className={`${auxiliaryLinkClass} text-blue-700`} href={`mailto:${emailLink}`}>
          Enviar e-mail
        </a>
      ) : null}
      {whatsappLink ? (
        <a
          className={`${auxiliaryLinkClass} text-emerald-700`}
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

function FieldMetaBadge({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <span className={`${metaBadgeClass} border-gray-300 bg-white text-gray-700`}>
      {children}
    </span>
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
  pattern,
  title,
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
  pattern?: string;
  title?: string;
  onInput?: (event: FormEvent<HTMLInputElement>) => void;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className={labelClass}>
      <span className={labelTextClass}>
        {label}
        {required ? <span aria-hidden="true" className="ml-1 text-red-500">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={value === undefined ? defaultValue ?? "" : undefined}
        value={value}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        onInput={onInput}
        onChange={onChange}
        className={classes(densidade).input}
      />
      <span aria-hidden="true" className={`${auxiliaryTextClass} hidden`} />
    </label>
  );
}

function InlineFieldCheckbox({
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
    <label className={inlineCheckboxClass}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        onChange={onChange}
        className={inlineCheckboxInputClass}
      />
      <span>{label}</span>
    </label>
  );
}

function CampoTextoComAcao({
  name,
  label,
  action,
  defaultValue,
  type = "text",
  required = false,
  densidade,
  inputMode,
  maxLength,
  pattern,
  title,
  onInput,
  value,
  onChange,
}: {
  name: string;
  label: string;
  action?: ReactNode;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  densidade: Densidade;
  inputMode?: "text" | "search" | "email" | "tel" | "url" | "numeric" | "decimal";
  maxLength?: number;
  pattern?: string;
  title?: string;
  onInput?: (event: FormEvent<HTMLInputElement>) => void;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={labelClass}>
      <div className="flex h-[17px] items-end justify-between gap-3">
        <label htmlFor={name} className={labelTextClass}>
          {label}
          {required ? <span aria-hidden="true" className="ml-1 text-red-500">*</span> : null}
        </label>
        {action}
      </div>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={value === undefined ? defaultValue ?? "" : undefined}
        value={value}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        pattern={pattern}
        title={title}
        onInput={onInput}
        onChange={onChange}
        className={classes(densidade).input}
      />
      <span aria-hidden="true" className={`${auxiliaryTextClass} hidden`} />
    </div>
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
      <span className={labelTextClass}>{label}</span>
      <select
        name={name}
        defaultValue={value === undefined ? defaultValue ?? "" : undefined}
        value={value}
        onChange={onChange}
        className={classes(densidade).input}
      >
        {children}
      </select>
      <span aria-hidden="true" className={`${auxiliaryTextClass} hidden`} />
    </label>
  );
}

function CampoSelectEditavel({
  name,
  label,
  options,
  labels,
  defaultValue,
  defaultOption = "",
  placeholder = "Selecione",
  densidade,
}: {
  name: string;
  label: string;
  options: readonly string[];
  labels: Record<string, string>;
  defaultValue?: string | null;
  defaultOption?: string;
  placeholder?: string | null;
  densidade: Densidade;
}) {
  const opcaoInicial = valorSelectEditavel(defaultValue, options, defaultOption);
  const [opcao, setOpcao] = useState(opcaoInicial);
  const [outro, setOutro] = useState(
    opcaoInicial === "outro" ? String(defaultValue ?? "") : ""
  );
  const opcoes = options.includes("outro") ? options : [...options, "outro"];

  return (
    <div className="grid gap-2">
      <label className={labelClass}>
        <span className={labelTextClass}>{label}</span>
        <select
          name={`${name}_opcao`}
          value={opcao}
          onChange={(event) => setOpcao(event.currentTarget.value)}
          className={classes(densidade).input}
        >
          {placeholder !== null ? <option value="">{placeholder}</option> : null}
          {opcoes.map((opcaoItem) => (
            <option key={opcaoItem} value={opcaoItem}>
              {opcaoItem === "outro" ? "Outro" : labels[opcaoItem] ?? opcaoItem}
            </option>
          ))}
        </select>
      </label>
      {opcao === "outro" ? (
        <label className={labelClass}>
          <span className={labelTextClass}>{label} personalizado</span>
          <input
            name={name}
            value={outro}
            onChange={(event) => setOutro(event.currentTarget.value)}
            maxLength={80}
            placeholder={`Informe ${label.toLowerCase()}`}
            className={classes(densidade).input}
          />
        </label>
      ) : (
        <input type="hidden" name={name} value={opcao} />
      )}
    </div>
  );
}

function CampoMoedaReais({
  name,
  label,
  defaultValue,
  densidade,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  densidade: Densidade;
}) {
  const [centavosTexto, setCentavosTexto] = useState(() =>
    centavosTextoDeValorMonetario(defaultValue)
  );
  const centavos = Number(centavosTexto);

  return (
    <label className={labelClass}>
      <span className={labelTextClass}>{label}</span>
      <input
        type="hidden"
        name={name}
        value={centavosTexto ? valorDecimalDeCentavos(centavos) : ""}
      />
      <input
        type="text"
        value={centavosTexto ? formatarMoedaReaisPorCentavos(centavos) : ""}
        inputMode="numeric"
        placeholder="R$ 0,00"
        onChange={(event) => {
          setCentavosTexto(somenteDigitos(event.currentTarget.value));
        }}
        className={classes(densidade).input}
      />
      <span aria-hidden="true" className={`${auxiliaryTextClass} hidden`} />
    </label>
  );
}

function CampoTextarea({
  name,
  label,
  defaultValue,
  rows = 3,
  densidade,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  rows?: number;
  densidade: Densidade;
}) {
  return (
    <label className={longFieldLabelClass}>
      <span className={labelTextClass}>{label}</span>
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
  densidade = "confortavel",
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  densidade?: Densidade;
}) {
  return (
    <label className={toggleClass(densidade)}>
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked === undefined ? defaultChecked : undefined}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
      <span>{label}</span>
    </label>
  );
}

function FormSection({
  step,
  title,
  description,
  children,
  densidade,
  gridClassName,
}: {
  step?: number;
  title: string;
  description?: string;
  children: ReactNode;
  densidade: Densidade;
  gridClassName?: string;
}) {
  const gridClass = gridClassName ?? classes(densidade).grid;

  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-bold text-gray-950">
            {step ? `${step}. ` : ""}
            {title}
          </h2>
        </div>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm text-gray-600">{description}</p>
        ) : null}
      </div>
      <div className={`${gridClass} ${classes(densidade).sectionPadding}`}>
        {children}
      </div>
    </section>
  );
}

function FieldMetaLegend() {
  return (
    <section
      aria-label="Legenda dos campos do cadastro"
      className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 shadow-sm"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-slate-900">Legenda dos campos:</span>
        <FieldMetaBadge>* obrigatório</FieldMetaBadge>
        <FieldMetaBadge>sem marca: opcional</FieldMetaBadge>
        <FieldMetaBadge>automático</FieldMetaBadge>
        <FieldMetaBadge>somente leitura</FieldMetaBadge>
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

function textoConsulta(valor: string | null | undefined) {
  return valor?.trim() || "-";
}

function UnidadeAtualBadge({ unidade }: { unidade: ParceiroOrganizacaoResumo }) {
  return unidade.is_atual ? (
    <span className="ml-2 inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
      Atual
    </span>
  ) : null;
}

function GeralTab({
  parceiro,
  organizacoes,
  densidade,
  erro,
  sucesso,
}: {
  parceiro?: ParceiroDetalhe | null;
  organizacoes: OrganizacaoParceiroOpcao[];
  densidade: Densidade;
  erro?: string | null;
  sucesso?: string | null;
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
  const [localizacao, setLocalizacao] = useState<CamposLocalizacao>(() => ({
    link_maps:
      parceiro?.link_maps ??
      parceiro?.localizacao_referencia ??
      [
        endereco?.endereco,
        endereco?.numero,
        endereco?.bairro,
        endereco?.cidade,
        endereco?.estado,
        endereco?.pais ?? "Brasil",
      ]
        .filter((parte) => String(parte ?? "").trim())
        .join(", "),
    latitude: parceiro?.latitude?.toString() ?? "",
    longitude: parceiro?.longitude?.toString() ?? "",
    origem_geolocalizacao: parceiro?.origem_geolocalizacao ?? "",
    localizacao_referencia: parceiro?.localizacao_referencia ?? "",
  }));
  const [mensagemLocalizacao, setMensagemLocalizacao] = useState("");
  const [previewReferencia, setPreviewReferencia] = useState("");
  const [organizacaoId, setOrganizacaoId] = useState(organizacaoInicial);
  const [organizacaoAlterada, setOrganizacaoAlterada] = useState(false);
  const [mensagemConsulta, setMensagemConsulta] = useState("");
  const [situacaoCadastral, setSituacaoCadastral] = useState("");
  const [consultaOrigem, setConsultaOrigem] =
    useState<SubstituicaoPendente["origem"] | null>(null);
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
  const [responsavelContatoId, setResponsavelContatoId] = useState(
    parceiro?.responsavel_local_contato_id ?? ""
  );
  const [responsavelLocalNome, setResponsavelLocalNome] = useState(
    parceiro?.responsavel_local_nome ?? parceiro?.responsavel_local ?? ""
  );
  const [responsavelLocalTelefone, setResponsavelLocalTelefone] = useState(() =>
    mascararCelular(
      parceiro?.responsavel_local_telefone ??
        parceiro?.telefone_responsavel_local ??
        ""
    )
  );
  const [responsavelLocalWhatsapp, setResponsavelLocalWhatsapp] = useState(
    parceiro?.responsavel_local_whatsapp ?? false
  );
  const [possuiDoca, setPossuiDoca] = useState(
    parceiro?.possui_doca_carga_descarga ??
      Boolean(parceiro?.doca_carga_descarga?.trim())
  );
  const [agendaAtendimento, setAgendaAtendimento] = useState<DiaAtendimento[]>(
    () => montarAgendaAtendimentoInicial(parceiro?.horarios_atendimento)
  );
  const [erroAgendaAtendimento, setErroAgendaAtendimento] = useState("");
  const [estacionamentoTerceiros, setEstacionamentoTerceiros] = useState(
    parceiro?.estacionamento_terceiros ?? false
  );
  const documentosEntradaIniciais =
    parceiro?.documentos_entrada && parceiro.documentos_entrada.length > 0
      ? parceiro.documentos_entrada
      : parceiro?.documento_necessario_entrada
        ? [parceiro.documento_necessario_entrada]
        : [];
  const [documentosEntrada, setDocumentosEntrada] = useState<string[]>(() =>
    DOCUMENTOS_ENTRADA.filter((documento) =>
      documento === "Outro"
        ? documentosEntradaIniciais.some((item) => item === "Outro" || item.startsWith("Outro:"))
        : documentosEntradaIniciais.includes(documento)
    )
  );
  const [documentoOutro, setDocumentoOutro] = useState(() => {
    const outro = documentosEntradaIniciais.find((item) => item.startsWith("Outro:"));
    return outro ? outro.replace(/^Outro:\s*/, "") : "";
  });
  const pessoaFisica = tipoPessoa === "fisica";
  const enderecoFormatado = montarEnderecoFormatado(campos);
  const latitudeNumero = normalizarNumeroCoordenada(localizacao.latitude);
  const longitudeNumero = normalizarNumeroCoordenada(localizacao.longitude);
  const temCoordenadasValidas = coordenadasValidas(latitudeNumero, longitudeNumero);
  const latitudeDerivada = temCoordenadasValidas ? localizacao.latitude : "";
  const longitudeDerivada = temCoordenadasValidas ? localizacao.longitude : "";
  const textoLocalizacao = localizacao.link_maps.trim();
  const entradaEhLinkCurtoMaps = /maps\.app\.goo\.gl/i.test(textoLocalizacao);
  const referenciaMapa =
    previewReferencia ||
    (entradaEhLinkCurtoMaps ? enderecoFormatado : textoLocalizacao) ||
    localizacao.localizacao_referencia ||
    enderecoFormatado;
  const mapaPreviewUrl = montarMapaPreview({
    latitude: localizacao.latitude,
    longitude: localizacao.longitude,
    endereco: referenciaMapa,
  });
  const mapaEmbedUrl = montarMapaEmbed({
    latitude: localizacao.latitude,
    longitude: localizacao.longitude,
    endereco: referenciaMapa,
  });
  const rotaUrl = montarDestinoRota({
    latitude: localizacao.latitude,
    longitude: localizacao.longitude,
    endereco: referenciaMapa,
  });
  const cnpjConsultavel = !pessoaFisica && somenteDigitos(campos.cnpj_cpf).length === 14;
  const cepConsultavel = somenteDigitos(campos.cep).length === 8;
  const contatosResponsavel = (parceiro?.contatos ?? []).filter(
    (item) => item.ativo
  );
  const responsavelWhatsappLink =
    responsavelLocalWhatsapp && responsavelLocalTelefone
      ? whatsappUrl(responsavelLocalTelefone)
      : null;
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
  const feedbackOrigem = substituicaoPendente?.origem ?? consultaOrigem;
  const horariosAtendimentoJson = JSON.stringify(
    serializarAgendaAtendimento(agendaAtendimento)
  );
  const dadosCadastraisGrid = canonicalFormGrid(densidade);

  function validarFormulario(event: FormEvent<HTMLFormElement>) {
    const erroAgenda = validarAgendaAtendimento(agendaAtendimento);
    setErroAgendaAtendimento(erroAgenda);

    if (erroAgenda) {
      event.preventDefault();
    }
  }

  function sincronizarLocalizacaoComEndereco(
    enderecoAnterior: CamposGeral,
    proximoEndereco: CamposGeral
  ) {
    const enderecoAnteriorFormatado = montarEnderecoFormatado(enderecoAnterior);
    const proximoEnderecoFormatado = montarEnderecoFormatado(proximoEndereco);

    if (!proximoEnderecoFormatado) {
      return;
    }

    setLocalizacao((atuais) => {
      const valorAtual = atuais.link_maps.trim();
      const podeAtualizar =
        !valorAtual ||
        valorAtual === enderecoAnteriorFormatado ||
        valorAtual === atuais.localizacao_referencia;

      return podeAtualizar
        ? {
            ...atuais,
            link_maps: proximoEnderecoFormatado,
            localizacao_referencia: atuais.localizacao_referencia || proximoEnderecoFormatado,
          }
        : atuais;
    });
    setPreviewReferencia("");
  }

  function atualizarCampo(campo: CampoGeral, valor: string) {
    const atualizados = { ...campos, [campo]: valor };

    setCampos(atualizados);

    if (
      ["cep", "endereco", "numero", "complemento", "bairro", "cidade", "estado", "pais"].includes(campo)
    ) {
      sincronizarLocalizacaoComEndereco(campos, atualizados);
    }
  }

  function atualizarLocalizacao(campo: CampoLocalizacao, valor: string) {
    if (campo === "link_maps") {
      const coordenadas = interpretarCoordenadasMaps(valor);
      const valorReferencia = valor.trim();
      setLocalizacao((atuais) => ({
        ...atuais,
        link_maps: valor,
        latitude: coordenadas ? String(coordenadas.latitude) : "",
        longitude: coordenadas ? String(coordenadas.longitude) : "",
        origem_geolocalizacao: coordenadas
          ? "Google Maps"
          : atuais.origem_geolocalizacao,
        localizacao_referencia: coordenadas
          ? atuais.localizacao_referencia
          : valorReferencia,
      }));
      setPreviewReferencia("");
      setMensagemLocalizacao(
        coordenadas
          ? "Coordenadas extraídas do endereço do Google Maps."
          : /maps\.app\.goo\.gl/i.test(valor)
            ? "Link curto salvo. O preview usa o endereço cadastral até uma URL longa ou coordenadas serem informadas."
            : ""
      );
      return;
    }

    setLocalizacao((atuais) => ({ ...atuais, [campo]: valor }));
    setMensagemLocalizacao("");
  }

  function selecionarResponsavelContato(contatoId: string) {
    setResponsavelContatoId(contatoId);

    if (!contatoId) {
      return;
    }

    const contatoSelecionado = contatosResponsavel.find(
      (item) => item.id === contatoId
    );

    if (!contatoSelecionado) {
      return;
    }

    setResponsavelLocalNome(contatoSelecionado.nome);
    setResponsavelLocalTelefone(
      mascararCelular(
        contatoSelecionado.whatsapp ??
          contatoSelecionado.celular ??
          contatoSelecionado.telefone ??
          ""
      )
    );
    setResponsavelLocalWhatsapp(Boolean(contatoSelecionado.whatsapp));
  }

  function atualizarDocumentoEntrada(documento: string, selecionado: boolean) {
    setDocumentosEntrada((atuais) => {
      if (selecionado) {
        return atuais.includes(documento) ? atuais : [...atuais, documento];
      }

      return atuais.filter((item) => item !== documento);
    });
  }

  function atualizarPreviewMapa() {
    const entrada = localizacao.link_maps.trim();
    const coordenadas = interpretarCoordenadasMaps(entrada);

    if (coordenadas) {
      setLocalizacao((atuais) => ({
        ...atuais,
        latitude: String(coordenadas.latitude),
        longitude: String(coordenadas.longitude),
        origem_geolocalizacao: "Google Maps",
      }));
      setPreviewReferencia("");
      setMensagemLocalizacao("Preview atualizado com coordenadas extraídas do Google Maps.");
      return;
    }

    if (entrada) {
      setLocalizacao((atuais) => ({
        ...atuais,
        latitude: "",
        longitude: "",
        localizacao_referencia: entrada,
      }));
    } else {
      setLocalizacao((atuais) => ({
        ...atuais,
        latitude: "",
        longitude: "",
      }));
    }

    setPreviewReferencia(entradaEhLinkCurtoMaps ? enderecoFormatado : entrada || enderecoFormatado);
    setMensagemLocalizacao(
      entrada.includes("maps.app.goo.gl")
        ? "Preview atualizado com o endereço cadastral. Link curto salvo sem resolução automática."
        : "Preview atualizado com a referência informada."
    );
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

    const atualizados = { ...campos };

    for (const [campo, valor] of Object.entries(novosCampos)) {
      if (!valor) {
        continue;
      }

      const chave = campo as CampoGeral;
      if (substituirPreenchidos || !atualizados[chave]?.trim()) {
        atualizados[chave] = String(valor);
      }
    }

    setCampos(atualizados);
    sincronizarLocalizacaoComEndereco(campos, atualizados);
    setSubstituicaoPendente(null);
  }

  async function consultarCnpj() {
    setConsultaOrigem("cnpj");

    if (!cnpjConsultavel) {
      setMensagemConsulta("Informe um CNPJ com 14 dígitos para consultar.");
      setSituacaoCadastral("");
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
    setConsultaOrigem("cep");
    setSituacaoCadastral("");

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

  function renderFeedbackConsulta(origem: SubstituicaoPendente["origem"]) {
    if (
      feedbackOrigem !== origem ||
      (!mensagemConsulta && !situacaoCadastral && !substituicaoPendente)
    ) {
      return null;
    }

    const feedbackClass = feedbackConsultaClass(
      origem,
      mensagemConsulta,
      substituicaoPendente
    );

    return (
      <div
        role={feedbackClass.includes("red") ? "alert" : "status"}
        className={`rounded-md border p-3 text-sm font-medium md:col-span-full ${feedbackClass}`}
      >
        {mensagemConsulta ? <p className="font-semibold">{mensagemConsulta}</p> : null}
        {origem === "cnpj" && situacaoCadastral ? (
          <p className="mt-1">
            Situação cadastral do CNPJ:{" "}
            <span className="font-semibold">{situacaoCadastral}</span>
          </p>
        ) : null}
        {substituicaoPendente?.origem === origem ? (
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
              className={`${classes(densidade).button} border-amber-300 text-amber-900 hover:bg-amber-100 sm:w-auto`}
            >
              Substituir dados
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <form
      id="parceiro-geral-form"
      action={salvarParceiroGeral}
      onSubmit={validarFormulario}
      className="space-y-4"
    >
      <input type="hidden" name="id" value={parceiro?.id ?? ""} />
      <input type="hidden" name="endereco_id" value={endereco?.id ?? ""} />
      <input type="hidden" name="contato_id" value={contato?.id ?? ""} />
      <input type="hidden" name="organizacao_id_original" value={organizacaoInicial} />
      <input
        type="hidden"
        name="horarios_atendimento_json"
        value={horariosAtendimentoJson}
      />
      <input
        type="hidden"
        name="organizacao_id_alterado"
        value={organizacaoAlterada ? "1" : "0"}
      />

      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800">
            {LABEL_TIPO_PESSOA[tipoPessoa]}
          </span>
          <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800">
            {LABEL_TIPO_PARCEIRO[parceiro?.tipo_parceiro ?? "cliente"]}
          </span>
          <span className="rounded-full border border-gray-300 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-800">
            {LABEL_SITUACAO_PARCEIRO[parceiro?.situacao ?? "ativo"]}
          </span>
        </div>
      </section>

      <FieldMetaLegend />

      {parceiro ? (
        <section className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-900 shadow-sm">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-gray-950">
              Vínculo usado nos chamados
            </h2>
            <FieldMetaBadge>Somente leitura</FieldMetaBadge>
          </div>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Cliente operacional
              </span>
              <span className="font-semibold">
                {parceiro.cliente_legado_nome ?? "Sem vínculo operacional"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Organização vinculada
              </span>
              <span className="font-semibold">
                {parceiro.organizacao_nome ?? "Sem organização vinculada"}
              </span>
              {parceiro.organizacao_id ? (
                <Link
                  href={`/cadastros/organizacoes/${parceiro.organizacao_id}`}
                  className="mt-1 block text-xs font-semibold text-gray-700 underline-offset-2 hover:underline"
                >
                  Abrir organização
                </Link>
              ) : null}
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Filiais vinculadas
              </span>
              <span className="font-semibold">{parceiro.filiais_count ?? 0}</span>
            </div>
          </div>
        </section>
      ) : null}

      <FormSection
        step={1}
        title="Dados cadastrais"
        description="Identificação fiscal, operacional e vínculo de organização."
        densidade={densidade}
        gridClassName={dadosCadastraisGrid}
      >
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
        <div className={labelClass}>
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="cnpj_cpf" className={labelTextClass}>
              {pessoaFisica ? "CPF" : "CNPJ"}
            </label>
            {!pessoaFisica ? (
              <button
                type="button"
                disabled={consultandoCnpj}
                onClick={() => {
                  void consultarCnpj();
                }}
                className={inlineAuxiliaryActionClass}
              >
                {consultandoCnpj ? "Consultando..." : "Consultar CNPJ"}
              </button>
            ) : null}
          </div>
          <input
            id="cnpj_cpf"
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
            className={classes(densidade).input}
          />
        </div>
        {renderFeedbackConsulta("cnpj")}
        <CampoTexto
          name="nome_fantasia"
          label={pessoaFisica ? "Nome de exibição" : "Nome fantasia"}
          value={campos.nome_fantasia}
          onChange={(event) => atualizarCampo("nome_fantasia", event.currentTarget.value)}
          required
          densidade={densidade}
        />
        <div className="grid gap-2 sm:grid-cols-2">
          <CampoTexto
            name="codigo_interno"
            label="Código interno"
            defaultValue={parceiro?.codigo_interno}
            densidade={densidade}
          />
          {!pessoaFisica ? (
            <CampoTexto
              name="inscricao_estadual"
              label="Inscrição estadual"
              defaultValue={parceiro?.inscricao_estadual}
              densidade={densidade}
            />
          ) : null}
        </div>
        {pessoaFisica ? (
          <>
            <input type="hidden" name="inscricao_estadual" value={parceiro?.inscricao_estadual ?? ""} />
            <input type="hidden" name="inscricao_municipal" value={parceiro?.inscricao_municipal ?? ""} />
            <input type="hidden" name="crt" value={parceiro?.crt ?? ""} />
            <input type="hidden" name="cnae" value={parceiro?.cnae ?? ""} />
            <input type="hidden" name="suframa" value={parceiro?.suframa ?? ""} />
          </>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
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
          </div>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
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
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <CampoTexto
            name="cliente_desde"
            label="Data de relacionamento"
            type="date"
            defaultValue={parceiro?.cliente_desde}
            densidade={densidade}
          />
          {!pessoaFisica ? (
            <CampoTexto
              name="suframa"
              label="Suframa"
              defaultValue={parceiro?.suframa}
              densidade={densidade}
            />
          ) : null}
        </div>
        {!pessoaFisica ? (
          <CampoTexto
            name="cnae"
            label="CNAE"
            value={campos.cnae}
            onChange={(event) => atualizarCampo("cnae", event.currentTarget.value)}
            densidade={densidade}
          />
        ) : null}
        <CampoTexto
          name="website"
          label="Website"
          defaultValue={parceiro?.website}
          densidade={densidade}
        />
        <div className={labelClass}>
          <div className="flex items-end justify-between gap-3">
            <label htmlFor="organizacao_id" className={labelTextClass}>
              Organização vinculada
            </label>
            {!organizacaoId ? (
              <InlineFieldCheckbox
                name="criar_organizacao_vinculada"
                label="Criar organização ao salvar"
              />
            ) : null}
          </div>
          <select
            id="organizacao_id"
            name="organizacao_id"
            value={organizacaoId}
            onChange={(event) => {
              setOrganizacaoId(event.currentTarget.value);
              setOrganizacaoAlterada(event.currentTarget.value !== organizacaoInicial);
            }}
            className={classes(densidade).input}
          >
            <option value="">Sem organização vinculada</option>
            {organizacoesSelect.map((organizacao) => (
              <option key={organizacao.id} value={organizacao.id}>
                {organizacao.codigo_interno
                  ? `${organizacao.nome} (${organizacao.codigo_interno})`
                  : organizacao.nome}
              </option>
            ))}
          </select>
          {organizacaoId ? (
            <Link
              href={`/cadastros/organizacoes/${organizacaoId}`}
              className={`${auxiliaryTextClass} inline-flex w-fit underline-offset-2 hover:underline`}
            >
              Abrir organização
            </Link>
          ) : null}
        </div>
      </FormSection>

      <FormSection
        step={2}
        title="Contato principal"
        description="Pessoa de referência para atendimento, validação e comunicação inicial."
        densidade={densidade}
        gridClassName={dadosCadastraisGrid}
      >
        <CampoTexto
          name="contato_nome"
          label="Nome do contato"
          defaultValue={contato?.nome}
          required
          densidade={densidade}
        />
        <CampoSelectEditavel
          name="contato_tipo"
          label="Tipo de contato"
          defaultValue={contato?.tipo_contato ?? "operacional"}
          densidade={densidade}
          options={TIPOS_CONTATO}
          labels={LABEL_TIPO_CONTATO}
          defaultOption="operacional"
          placeholder={null}
        />
        <CampoSelectEditavel
          name="contato_departamento"
          label="Departamento"
          defaultValue={contato?.departamento}
          densidade={densidade}
          options={DEPARTAMENTOS_CONTATO}
          labels={LABEL_DEPARTAMENTO_CONTATO}
        />
        <CampoSelectEditavel
          name="contato_cargo"
          label="Cargo"
          defaultValue={contato?.cargo}
          densidade={densidade}
          options={CARGOS_CONTATO}
          labels={LABEL_CARGO_CONTATO}
        />
        <CampoTexto
          name="contato_telefone"
          label="Telefone comercial"
          defaultValue={mascararTelefone(contato?.telefone ?? "")}
          densidade={densidade}
          inputMode="tel"
          maxLength={18}
          onInput={(event) => {
            event.currentTarget.value = mascararTelefone(event.currentTarget.value);
          }}
        />
        <CampoTextoComAcao
          name="contato_celular"
          label="Celular comercial"
          value={contatoCelular}
          densidade={densidade}
          inputMode="tel"
          maxLength={19}
          action={
            <InlineFieldCheckbox
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
          }
          onChange={(event) => {
            const valor = mascararCelular(event.currentTarget.value);
            setContatoCelular(valor);
            if (celularEhWhatsapp) {
              setContatoWhatsapp(valor);
            }
          }}
        />
        <CampoTextoComAcao
          name="contato_email"
          label="E-mail"
          type="email"
          defaultValue={contato?.email}
          densidade={densidade}
          inputMode="email"
          pattern={emailPattern}
          title="Informe um e-mail válido com @ e domínio, como nome@empresa.com."
          action={
            emailValido(contato?.email) ? (
              <a
                className={inlineAuxiliaryActionClass}
                href={`mailto:${emailValido(contato?.email)}`}
              >
                Enviar e-mail
              </a>
            ) : null
          }
        />
        <CampoTextoComAcao
          name="contato_whatsapp"
          label="WhatsApp"
          value={contatoWhatsapp}
          densidade={densidade}
          inputMode="tel"
          maxLength={19}
          action={
            whatsappUrl(contato?.whatsapp ?? contato?.celular) ? (
              <a
                className={`${inlineAuxiliaryActionClass} text-emerald-700`}
                href={whatsappUrl(contato?.whatsapp ?? contato?.celular) ?? undefined}
                target="_blank"
                rel="noreferrer"
              >
                Abrir WhatsApp
              </a>
            ) : null
          }
          onChange={(event) => {
            setContatoWhatsapp(mascararCelular(event.currentTarget.value));
          }}
        />
        <div className={longTextFieldClass}>
          <CampoTextarea
            name="contato_observacoes"
            label="Observações do contato"
            defaultValue={contato?.observacoes}
            densidade={densidade}
          />
        </div>
      </FormSection>

      <FormSection
        step={3}
        title="Endereço principal"
        description="Base cadastral usada para identificação, cobrança e referência inicial de deslocamento."
        densidade={densidade}
        gridClassName={dadosCadastraisGrid}
      >
        <CampoTextoComAcao
          name="cep"
          label="CEP"
          value={campos.cep}
          densidade={densidade}
          inputMode="numeric"
          maxLength={9}
          action={
            <button
              type="button"
              disabled={!cepConsultavel || consultandoCep}
              onClick={() => {
                void consultarCep();
              }}
              className={inlineAuxiliaryActionClass}
            >
              {consultandoCep ? "Buscando..." : "Buscar CEP"}
            </button>
          }
          onChange={(event) =>
            atualizarCampo("cep", mascararCep(event.currentTarget.value))
          }
        />
        {renderFeedbackConsulta("cep")}
        <div className={fullFieldClass}>
          <CampoTexto name="endereco" label="Endereço / Logradouro" value={campos.endereco} onChange={(event) => atualizarCampo("endereco", event.currentTarget.value)} densidade={densidade} />
        </div>
        <div className={`${smallFieldsGroupClass} ${fullFieldClass}`}>
          <CampoTexto name="numero" label="Número" value={campos.numero} onChange={(event) => atualizarCampo("numero", event.currentTarget.value)} densidade={densidade} />
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
        </div>
        <CampoTexto name="complemento" label="Complemento" value={campos.complemento} onChange={(event) => atualizarCampo("complemento", event.currentTarget.value)} densidade={densidade} />
        <CampoTexto name="bairro" label="Bairro" value={campos.bairro} onChange={(event) => atualizarCampo("bairro", event.currentTarget.value)} densidade={densidade} />
        <CampoTexto name="cidade" label="Cidade" value={campos.cidade} onChange={(event) => atualizarCampo("cidade", event.currentTarget.value)} densidade={densidade} />
      </FormSection>

      <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-4 py-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-bold text-gray-950">
              4. Localização operacional
            </h2>
            <FieldMetaBadge>Mapa derivado</FieldMetaBadge>
          </div>
          <p className="mt-1 text-sm text-gray-600">
            Ponto real de chegada do técnico, independente do endereço cadastral.
          </p>
        </div>
        <div className={`space-y-4 ${classes(densidade).sectionPadding}`}>
          <div className={canonicalFormGrid(densidade)}>
            <div className={fullFieldClass}>
              <CampoTexto
                name="link_maps"
                label="Link ou endereço do Google Maps"
                value={localizacao.link_maps}
                onChange={(event) => atualizarLocalizacao("link_maps", event.currentTarget.value)}
                densidade={densidade}
                inputMode="url"
              />
            </div>
            <div className={labelClass}>
              <div className="flex items-center gap-2">
                <span className={labelTextClass}>Latitude</span>
                <FieldMetaBadge>Automático</FieldMetaBadge>
              </div>
              <div
                aria-label="Latitude derivada"
                className="mt-1 inline-flex min-h-7 max-w-full items-center rounded border border-gray-200 bg-gray-100 px-2 text-[11px] font-semibold normal-case tracking-normal text-gray-700"
              >
                {latitudeDerivada || "Gerada pelo link/endereço"}
              </div>
              <span aria-hidden="true" className={auxiliaryTextClass} />
            </div>
            <div className={labelClass}>
              <div className="flex items-center gap-2">
                <span className={labelTextClass}>Longitude</span>
                <FieldMetaBadge>Automático</FieldMetaBadge>
              </div>
              <div
                aria-label="Longitude derivada"
                className="mt-1 inline-flex min-h-7 max-w-full items-center rounded border border-gray-200 bg-gray-100 px-2 text-[11px] font-semibold normal-case tracking-normal text-gray-700"
              >
                {longitudeDerivada || "Gerada pelo link/endereço"}
              </div>
              <span aria-hidden="true" className={auxiliaryTextClass} />
            </div>
            <CampoSelect
              name="origem_geolocalizacao"
              label="Origem da geolocalização"
              value={localizacao.origem_geolocalizacao}
              densidade={densidade}
              onChange={(event) =>
                atualizarLocalizacao("origem_geolocalizacao", event.currentTarget.value)
              }
            >
              {ORIGENS_GEOLOCALIZACAO.map((origem) => (
                <option key={origem || "nao-informado"} value={origem}>
                  {origem || "Não informado"}
                </option>
              ))}
            </CampoSelect>
            <CampoTexto
              name="localizacao_referencia"
              label="Localização de referência"
              value={localizacao.localizacao_referencia}
              onChange={(event) =>
                atualizarLocalizacao("localizacao_referencia", event.currentTarget.value)
              }
              densidade={densidade}
            />
          </div>
          <input type="hidden" name="latitude" value={latitudeDerivada} />
          <input type="hidden" name="longitude" value={longitudeDerivada} />

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={!mapaEmbedUrl}
              onClick={() => {
                atualizarPreviewMapa();
                const preview = document.getElementById("preview-mapa-operacional");
                preview?.scrollIntoView({ behavior: "smooth", block: "nearest" });
              }}
              className={classes(densidade).button}
            >
              Visualizar no mapa
            </button>
            {rotaUrl ? (
              <a
                href={rotaUrl}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md bg-gray-900 px-3 text-sm font-semibold text-white transition hover:bg-gray-800 ${
                  densidade === "compacto" ? "min-h-8 py-1" : "min-h-10 py-2"
                }`}
              >
                Iniciar rota
              </a>
            ) : (
              <button
                type="button"
                disabled
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-md bg-gray-100 px-3 text-sm font-semibold text-gray-400 ${
                  densidade === "compacto" ? "min-h-8 py-1" : "min-h-10 py-2"
                }`}
              >
                Iniciar rota
              </button>
            )}
          </div>

          {mensagemLocalizacao ? (
            <p className="text-sm font-semibold text-gray-700">
              {mensagemLocalizacao}
            </p>
          ) : null}

          <div
            id="preview-mapa-operacional"
            className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50"
            aria-label="Preview do mapa operacional"
          >
            {mapaEmbedUrl ? (
              <div className="relative min-h-64 overflow-hidden bg-gray-100 sm:min-h-80">
                <iframe
                  title="Preview do mapa operacional"
                  src={mapaEmbedUrl}
                  className="h-64 w-full border-0 sm:h-80"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
                <div className="absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-md border border-gray-200 bg-white/95 px-3 py-2 text-gray-900 shadow-sm sm:max-w-md">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">
                    Preview de referência
                  </p>
                  <p className="mt-1 text-sm font-bold text-gray-950">
                    {temCoordenadasValidas ? "Ponto por coordenadas" : "Endereço de chegada"}
                  </p>
                  <p className="mt-1 truncate text-xs text-gray-600">
                    {temCoordenadasValidas
                      ? `${latitudeDerivada}, ${longitudeDerivada}`
                      : referenciaMapa}
                  </p>
                </div>
                <div className="absolute right-3 top-3 flex flex-col gap-2 sm:flex-row">
                  {mapaPreviewUrl ? (
                    <a
                      href={mapaPreviewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center justify-center rounded-md border border-gray-300 bg-white/95 px-2.5 py-1.5 text-xs font-semibold text-gray-800 shadow-sm transition hover:bg-white"
                    >
                      Conferir
                    </a>
                  ) : null}
                  {rotaUrl ? (
                    <a
                      href={rotaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-8 items-center justify-center rounded-md bg-gray-900/95 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-gray-800"
                    >
                      Rota
                    </a>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="flex min-h-40 items-center justify-center p-4 text-center text-sm font-semibold text-gray-500">
                Informe coordenadas ou uma referência de localização para visualizar o mapa.
              </div>
            )}
          </div>
        </div>
      </section>

      <FormSection
        step={5}
        title="Informações de acesso"
        description="Regras práticas para entrada, autorização, estacionamento, portaria e documentos."
        densidade={densidade}
        gridClassName={dadosCadastraisGrid}
      >
        <CampoTexto name="ponto_referencia" label="Ponto de referência" defaultValue={parceiro?.ponto_referencia} densidade={densidade} />
        <CampoSelect
          name="responsavel_local_contato_id"
          label="Responsável cadastrado"
          value={responsavelContatoId}
          densidade={densidade}
          onChange={(event) => selecionarResponsavelContato(event.currentTarget.value)}
        >
          <option value="">Digitar manualmente</option>
          {contatosResponsavel.map((item) => (
            <option key={item.id} value={item.id}>
              {item.nome}
            </option>
          ))}
        </CampoSelect>
        <CampoTexto
          name="responsavel_local_nome"
          label="Responsável no local"
          value={responsavelLocalNome}
          onChange={(event) => {
            setResponsavelContatoId("");
            setResponsavelLocalNome(event.currentTarget.value);
          }}
          densidade={densidade}
        />
        <CampoTextoComAcao
          name="responsavel_local_telefone"
          label={densidade === "compacto" ? "Tel resp local" : "Telefone do responsável no local"}
          value={responsavelLocalTelefone}
          onChange={(event) => {
            setResponsavelLocalTelefone(mascararCelular(event.currentTarget.value));
          }}
          densidade={densidade}
          inputMode="tel"
          maxLength={19}
          action={
            <InlineFieldCheckbox
              name="responsavel_local_whatsapp"
              label={densidade === "compacto" ? "WhatsApp?" : "Celular é WhatsApp"}
              checked={responsavelLocalWhatsapp}
              onChange={(event) => setResponsavelLocalWhatsapp(event.currentTarget.checked)}
            />
          }
        />
        {responsavelWhatsappLink ? (
          <a
            href={responsavelWhatsappLink}
            target="_blank"
            rel="noreferrer"
            className={`${inlineAuxiliaryActionClass} text-emerald-700`}
          >
            Abrir WhatsApp
          </a>
        ) : null}
        <Toggle
          name="necessita_autorizacao_previa"
          label="Necessita autorização prévia"
          defaultChecked={parceiro?.necessita_autorizacao_previa ?? false}
          densidade={densidade}
        />
        <Toggle
          name="estacionamento_privativo"
          label="Estacionamento privativo"
          defaultChecked={
            parceiro?.estacionamento_privativo ??
            Boolean(parceiro?.estacionamento?.trim())
          }
          densidade={densidade}
        />
        <Toggle
          name="estacionamento_terceiros"
          label="Estacionamento de terceiros"
          checked={estacionamentoTerceiros}
          densidade={densidade}
          onChange={(event) => setEstacionamentoTerceiros(event.currentTarget.checked)}
        />
        {estacionamentoTerceiros ? (
          <>
            <CampoTexto
              name="estacionamento_terceiros_nome"
              label="Nome do estacionamento"
              defaultValue={parceiro?.estacionamento_terceiros_nome}
              densidade={densidade}
            />
            <CampoTexto
              name="estacionamento_terceiros_endereco"
              label="Endereço do estacionamento"
              defaultValue={parceiro?.estacionamento_terceiros_endereco}
              densidade={densidade}
            />
            <CampoTexto
              name="estacionamento_terceiros_valores"
              label="Valores"
              defaultValue={parceiro?.estacionamento_terceiros_valores}
              densidade={densidade}
            />
          </>
        ) : null}
        <Toggle
          name="possui_portaria_recepcao"
          label="Portaria / recepção"
          defaultChecked={
            parceiro?.possui_portaria_recepcao ??
            Boolean(parceiro?.portaria_recepcao?.trim())
          }
          densidade={densidade}
        />
        <Toggle
          name="possui_doca_carga_descarga"
          label="Doca / carga e descarga"
          checked={possuiDoca}
          densidade={densidade}
          onChange={(event) => setPossuiDoca(event.currentTarget.checked)}
        />
        {possuiDoca ? (
          <CampoTexto
            name="identificacao_doca"
            label="Identificação da doca"
            defaultValue={parceiro?.identificacao_doca ?? parceiro?.doca_carga_descarga}
            densidade={densidade}
          />
        ) : null}
        <div className={longTextFieldClass}>
          <span className={`${longFieldLabelClass} ${labelTextClass}`}>
            Documento necessário para entrada
          </span>
          <div className="mt-2 grid gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
            {DOCUMENTOS_ENTRADA.map((documento) => (
              <label
                key={documento}
                className="flex min-h-10 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2.5 py-2 text-xs font-semibold text-gray-700"
              >
                <input
                  type="checkbox"
                  name="documentos_entrada"
                  value={documento}
                  checked={documentosEntrada.includes(documento)}
                  onChange={(event) =>
                    atualizarDocumentoEntrada(documento, event.currentTarget.checked)
                  }
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>{documento}</span>
              </label>
            ))}
          </div>
        </div>
        {documentosEntrada.includes("Outro") ? (
          <CampoTexto
            name="documentos_entrada_outro"
            label="Descrição de outro documento"
            value={documentoOutro}
            onChange={(event) => setDocumentoOutro(event.currentTarget.value)}
            densidade={densidade}
          />
        ) : null}
        <div className={longTextFieldClass}>
          <CampoTextarea name="observacoes_acesso" label="Observações de acesso" rows={densidade === "compacto" ? 3 : 4} defaultValue={parceiro?.observacoes_acesso} densidade={densidade} />
        </div>
      </FormSection>

      <FormSection
        step={6}
        title="Horários de atendimento"
        description="Agenda semanal usada como referência para atendimento técnico e agendamento."
        densidade={densidade}
        gridClassName={dadosCadastraisGrid}
      >
        <Toggle name="atendimento_feriado" label="Atendimento em feriados" defaultChecked={parceiro?.atendimento_feriado ?? false} densidade={densidade} />
        <Toggle name="necessita_agendamento" label="Necessita agendamento" defaultChecked={parceiro?.necessita_agendamento ?? false} densidade={densidade} />
        <AgendaSemanalAtendimento
          agenda={agendaAtendimento}
          onChange={(proximaAgenda) => {
            setAgendaAtendimento(proximaAgenda);
            setErroAgendaAtendimento("");
          }}
          erro={erroAgendaAtendimento}
        />
      </FormSection>

      <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm font-semibold">
          {erro ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {erro}
            </p>
          ) : sucesso ? (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
              {sucesso}
            </p>
          ) : (
            <p className="text-gray-600">
              Salve para registrar as alterações da aba Geral.
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
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
      </div>
    </form>
  );
}

function FiliaisTab({
  parceiro,
}: {
  parceiro: ParceiroDetalhe;
  densidade: Densidade;
}) {
  const unidades = parceiro.unidades_organizacao;
  const totalUnidades = unidades.length;
  const somenteUnidadeAtual = Boolean(parceiro.organizacao_id && totalUnidades === 1);

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-950">
            Unidades vinculadas à organização
          </h2>
          <p className="text-sm text-gray-600">
            Consulta dos clientes e unidades operacionais vinculados à mesma organização.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
          {totalUnidades} {totalUnidades === 1 ? "unidade" : "unidades"}
        </span>
      </div>

      {!parceiro.organizacao_id ? (
        <div className="px-4 py-5 text-sm text-gray-600">
          Este cadastro ainda não possui organização vinculada. Vincule uma organização
          na aba Geral para visualizar unidades relacionadas.
        </div>
      ) : null}

      {somenteUnidadeAtual ? (
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
          Esta é a única unidade vinculada à organização.
        </div>
      ) : null}

      {parceiro.organizacao_id ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Endereço</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Observações</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((unidade) => (
                  <tr key={unidade.id} className="border-b border-gray-200 last:border-b-0">
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-gray-950">
                        {unidade.nome_exibicao}
                        <UnidadeAtualBadge unidade={unidade} />
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {textoConsulta(unidade.codigo_interno)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {textoConsulta(unidade.endereco_resumido)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {textoConsulta(unidade.contato_resumido)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        {LABEL_SITUACAO_PARCEIRO[unidade.situacao]}
                      </span>
                      {!unidade.ativo ? (
                        <span className="ml-2 inline-flex rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                          Inativo
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {LABEL_TIPO_PARCEIRO[unidade.tipo_parceiro]}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {textoConsulta(unidade.observacoes_resumidas)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/cadastros/parceiros/${unidade.id}`}
                        className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
                      >
                        Abrir cadastro
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="divide-y divide-gray-100 md:hidden">
            {unidades.map((unidade) => (
              <article key={unidade.id} className="space-y-3 px-4 py-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-950">
                    {unidade.nome_exibicao}
                    <UnidadeAtualBadge unidade={unidade} />
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {textoConsulta(unidade.codigo_interno)}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-gray-700">
                  <p>{textoConsulta(unidade.endereco_resumido)}</p>
                  <p>{LABEL_SITUACAO_PARCEIRO[unidade.situacao]}</p>
                </div>
                <Link
                  href={`/cadastros/parceiros/${unidade.id}`}
                  className="inline-flex min-h-9 items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Abrir cadastro
                </Link>
              </article>
            ))}
          </div>
        </>
      ) : null}
    </section>
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
          labelContatoCatalogo(contato.tipo_contato, LABEL_TIPO_CONTATO),
          labelContatoCatalogo(contato.cargo, LABEL_CARGO_CONTATO),
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
            label="Telefone comercial"
            defaultValue={mascararTelefone(contatoEmEdicao?.telefone ?? "")}
            densidade={densidade}
            inputMode="tel"
            maxLength={18}
            onInput={(event) => {
              event.currentTarget.value = mascararTelefone(event.currentTarget.value);
            }}
          />
          <CampoTextoComAcao
            name="celular"
            label="Celular comercial"
            defaultValue={mascararCelular(contatoEmEdicao?.celular ?? "")}
            densidade={densidade}
            inputMode="tel"
            maxLength={19}
            action={
              <InlineFieldCheckbox
                name="celular_whatsapp"
                label="Celular é WhatsApp"
                defaultChecked={Boolean(
                  contatoEmEdicao?.celular &&
                    contatoEmEdicao.celular === contatoEmEdicao.whatsapp
                )}
              />
            }
            onInput={(event) => {
              event.currentTarget.value = mascararCelular(event.currentTarget.value);
            }}
          />
          <CampoTextoComAcao
            name="whatsapp"
            label="WhatsApp"
            defaultValue={mascararCelular(contatoEmEdicao?.whatsapp ?? "")}
            densidade={densidade}
            inputMode="tel"
            maxLength={19}
            action={
              whatsappUrl(contatoEmEdicao?.whatsapp ?? contatoEmEdicao?.celular) ? (
                <a
                  className={`${inlineAuxiliaryActionClass} text-emerald-700`}
                  href={
                    whatsappUrl(contatoEmEdicao?.whatsapp ?? contatoEmEdicao?.celular) ??
                    undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  Abrir WhatsApp
                </a>
              ) : null
            }
            onInput={(event) => {
              event.currentTarget.value = mascararCelular(event.currentTarget.value);
            }}
          />
          <CampoTextoComAcao
            name="email"
            label="E-mail"
            type="email"
            defaultValue={contatoEmEdicao?.email}
            densidade={densidade}
            inputMode="email"
            pattern={emailPattern}
            title="Informe um e-mail válido com @ e domínio, como nome@empresa.com."
            action={
              emailValido(contatoEmEdicao?.email) ? (
                <a
                  className={inlineAuxiliaryActionClass}
                  href={`mailto:${emailValido(contatoEmEdicao?.email)}`}
                >
                  Enviar e-mail
                </a>
              ) : null
            }
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
          <div className={longTextFieldClass}>
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
        <CampoMoedaReais name="limite_credito" label="Limite de crédito" defaultValue={financeiro?.limite_credito} densidade={densidade} />
        <CampoSelectEditavel
          name="categoria_financeira"
          label="Categoria financeira"
          options={CATEGORIAS_FINANCEIRAS}
          labels={LABEL_CATEGORIA_FINANCEIRA}
          defaultValue={financeiro?.categoria_financeira}
          defaultOption="Sem categoria"
          placeholder={null}
          densidade={densidade}
        />
        <CampoTexto name="vendedor" label="Vendedor" defaultValue={financeiro?.vendedor} densidade={densidade} />
        <CampoTexto name="comissao" label="Comissão" defaultValue={financeiro?.comissao} densidade={densidade} />
        <CampoTexto name="forma_pagamento_padrao" label="Forma padrão" defaultValue={financeiro?.forma_pagamento_padrao} densidade={densidade} />
      </FormSection>
      <FormSection title="Faturamento" densidade={densidade}>
        <CampoTexto name="responsavel_financeiro" label="Responsável financeiro" defaultValue={financeiro?.responsavel_financeiro} densidade={densidade} />
        <CampoTexto
          name="email_nf"
          label="E-mail NF"
          type="email"
          defaultValue={financeiro?.email_nf}
          densidade={densidade}
          inputMode="email"
          pattern={emailPattern}
          title="Informe um e-mail válido com @ e domínio, como nome@empresa.com."
        />
        <div className={longTextFieldClass}>
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
  slas,
}: {
  parceiro: ParceiroDetalhe;
  densidade: Densidade;
  slas: ParceiroSlaOpcao[];
}) {
  const op = parceiro.operacional;

  return (
    <form action={salvarParceiroOperacional} className="space-y-4">
      <input type="hidden" name="parceiro_id" value={parceiro.id} />
      <FormSection title="SLA" densidade={densidade}>
        <CampoSelect
          name="sla_padrao_id"
          label="SLA padrão cadastrado"
          defaultValue={parceiro.sla_padrao_id ?? ""}
          densidade={densidade}
        >
          <option value="">Sem SLA cadastrado</option>
          {slas.map((sla) => (
            <option key={sla.id} value={sla.id}>
              {labelSla(sla)}
            </option>
          ))}
        </CampoSelect>
        <CampoTexto name="sla_padrao" label="SLA legado / observação" defaultValue={op?.sla_padrao} densidade={densidade} />
        <Toggle name="atendimento_remoto" label="Remoto" defaultChecked={op?.atendimento_remoto ?? true} />
        <Toggle name="atendimento_presencial" label="Presencial" defaultChecked={op?.atendimento_presencial ?? true} />
        <Toggle name="cobranca_km" label="Cobrança KM" defaultChecked={op?.cobranca_km ?? false} />
        <CampoTexto name="valor_km" label="Valor KM" defaultValue={op?.valor_km} densidade={densidade} />
        <CampoTexto name="cobertura" label="Cobertura" defaultValue={op?.cobertura} densidade={densidade} />
        <CampoTexto name="criticidade" label="Criticidade" defaultValue={op?.criticidade} densidade={densidade} />
      </FormSection>
      <FormSection title="Regras operacionais" densidade={densidade}>
        <Toggle name="necessita_autorizacao" label="Autorização" defaultChecked={op?.necessita_autorizacao ?? false} />
        <Toggle name="exige_cracha" label="Crachá" defaultChecked={op?.exige_cracha ?? false} />
        <Toggle name="exige_foto" label="Foto" defaultChecked={op?.exige_foto ?? false} />
        <CampoTexto name="restricao_horario" label="Restrição horário" defaultValue={op?.restricao_horario} densidade={densidade} />
        <CampoTexto name="contato_escalonamento" label="Escalonamento" defaultValue={op?.contato_escalonamento} densidade={densidade} />
        <CampoTexto name="grupo_tecnico_padrao" label="Grupo técnico" defaultValue={op?.grupo_tecnico_padrao} densidade={densidade} />
        <div className={longTextFieldClass}>
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
}: {
  parceiro: ParceiroDetalhe;
}) {
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-950">
              Contratos vinculados ao cliente
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Consulta dos contratos cadastrados na Gerência. Novos contratos devem ser criados no cadastro próprio.
            </p>
          </div>
          <Link
            href={`/cadastros/contratos?parceiro=${parceiro.id}`}
            className="inline-flex min-h-10 w-fit items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Gerenciar contratos
          </Link>
        </div>
      </section>
      <MiniTable
        headers={["Contrato", "Vigência", "SLA", "Status"]}
        rows={parceiro.contratos.map((contrato) => [
          contrato.contrato,
          `${contrato.vigencia_inicio ?? "-"} até ${contrato.vigencia_fim ?? "-"}`,
          contrato.sla ?? "-",
          LABEL_STATUS_CONTRATO[contrato.status],
        ])}
      />
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
            <span className={labelTextClass}>Arquivo</span>
            <input name="arquivo" type="file" className={classes(densidade).input} />
            <span aria-hidden="true" className={auxiliaryTextClass} />
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

export function ParceiroForm({
  parceiro,
  organizacoes = [],
  slas = [],
  erro,
  sucesso,
}: Props) {
  const [aba, setAba] = useState<Aba>("geral");
  const [densidade, setDensidade] = useState<Densidade>("confortavel");
  const editando = Boolean(parceiro);

  return (
    <div className="space-y-4">
      {erro ? (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
        >
          <p className="font-bold">Revise a aba Geral antes de salvar.</p>
          <p className="mt-1 font-semibold">{erro}</p>
        </div>
      ) : null}
      {sucesso ? (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          <p className="font-bold">Cadastro salvo com sucesso.</p>
          <p className="mt-1 font-semibold">{sucesso}</p>
        </div>
      ) : null}

      <section className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto">
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
          erro={erro}
          sucesso={sucesso}
        />
      ) : null}
      {parceiro && aba === "filiais" ? <FiliaisTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "contatos" ? <ContatosTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "financeiro" ? <FinanceiroTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "contratos" ? <ContratosTab parceiro={parceiro} /> : null}
      {parceiro && aba === "operacao" ? <OperacaoTab parceiro={parceiro} densidade={densidade} slas={slas} /> : null}
      {parceiro && aba === "anexos" ? <AnexosTab parceiro={parceiro} densidade={densidade} /> : null}
      {parceiro && aba === "historico" ? <HistoricoTab parceiro={parceiro} /> : null}
    </div>
  );
}
