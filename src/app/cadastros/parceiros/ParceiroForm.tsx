"use client";

import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  registrarParceiroAnexo,
  salvarParceiroContato,
  salvarParceiroContrato,
  salvarParceiroFilial,
  salvarParceiroFinanceiro,
  salvarParceiroGeral,
  salvarParceiroOperacional,
} from "./actions";
import {
  LABEL_STATUS_CONTRATO,
  LABEL_STATUS_FILIAL,
  LABEL_TIPO_PARCEIRO,
  SITUACOES_PARCEIRO,
  STATUS_CONTRATO,
  STATUS_FILIAL,
  TIPOS_PARCEIRO,
  type ParceiroDetalhe,
} from "./types";

type Props = {
  parceiro?: ParceiroDetalhe | null;
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

function CampoTexto({
  name,
  label,
  defaultValue,
  type = "text",
  required = false,
  densidade,
}: {
  name: string;
  label: string;
  defaultValue?: string | number | null;
  type?: string;
  required?: boolean;
  densidade: Densidade;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ""}
        required={required}
        className={classes(densidade).input}
      />
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
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className={toggleClass}>
      <span>{label}</span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
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
  densidade,
}: {
  parceiro?: ParceiroDetalhe | null;
  densidade: Densidade;
}) {
  const endereco = parceiro?.endereco_principal;
  const contato = parceiro?.contato_principal;

  return (
    <form action={salvarParceiroGeral} className="space-y-4">
      <input type="hidden" name="id" value={parceiro?.id ?? ""} />
      <input type="hidden" name="endereco_id" value={endereco?.id ?? ""} />
      <input type="hidden" name="contato_id" value={contato?.id ?? ""} />

      {parceiro ? (
        <section className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
          <h2 className="text-base font-bold text-blue-950">
            Vínculo usado nos chamados
          </h2>
          <div className="mt-2 grid gap-2 md:grid-cols-3">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                Cliente legado
              </span>
              <span className="font-semibold">
                {parceiro.cliente_legado_nome ?? "Sem vínculo legado"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                Organização derivada
              </span>
              <span className="font-semibold">
                {parceiro.organizacao_legada_nome ?? "Sem organização vinculada"}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wide text-blue-700">
                Filiais conectadas
              </span>
              <span className="font-semibold">{parceiro.filiais_count ?? 0}</span>
            </div>
          </div>
        </section>
      ) : null}

      <FormSection title="Dados cadastrais" densidade={densidade}>
        <label className={labelClass}>
          Tipo de parceiro
          <select
            name="tipo_parceiro"
            defaultValue={parceiro?.tipo_parceiro ?? "cliente"}
            className={classes(densidade).input}
          >
            {TIPOS_PARCEIRO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {LABEL_TIPO_PARCEIRO[tipo]}
              </option>
            ))}
          </select>
        </label>
        <CampoTexto
          name="razao_social"
          label="Razão social"
          defaultValue={parceiro?.razao_social}
          required
          densidade={densidade}
        />
        <CampoTexto
          name="nome_fantasia"
          label="Nome fantasia"
          defaultValue={parceiro?.nome_fantasia}
          required
          densidade={densidade}
        />
        <CampoTexto
          name="codigo_interno"
          label="Código interno"
          defaultValue={parceiro?.codigo_interno}
          densidade={densidade}
        />
        <CampoTexto
          name="cnpj_cpf"
          label="CNPJ / CPF"
          defaultValue={parceiro?.cnpj_cpf}
          densidade={densidade}
        />
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
        <CampoTexto
          name="crt"
          label="CRT"
          defaultValue={parceiro?.crt}
          densidade={densidade}
        />
        <label className={labelClass}>
          Situação
          <select
            name="situacao"
            defaultValue={parceiro?.situacao ?? "ativo"}
            className={classes(densidade).input}
          >
            {SITUACOES_PARCEIRO.map((situacao) => (
              <option key={situacao} value={situacao}>
                {situacao}
              </option>
            ))}
          </select>
        </label>
        <CampoTexto
          name="cliente_desde"
          label="Cliente desde"
          type="date"
          defaultValue={parceiro?.cliente_desde}
          densidade={densidade}
        />
        <CampoTexto
          name="segmento"
          label="Segmento"
          defaultValue={parceiro?.segmento}
          densidade={densidade}
        />
        <CampoTexto
          name="cnae"
          label="CNAE"
          defaultValue={parceiro?.cnae}
          densidade={densidade}
        />
        <CampoTexto
          name="suframa"
          label="Suframa"
          defaultValue={parceiro?.suframa}
          densidade={densidade}
        />
        <CampoTexto
          name="website"
          label="Website"
          defaultValue={parceiro?.website}
          densidade={densidade}
        />
      </FormSection>

      <FormSection title="Contato principal" densidade={densidade}>
        <CampoTexto name="contato_nome" label="Nome" defaultValue={contato?.nome} densidade={densidade} />
        <CampoTexto name="contato_cargo" label="Cargo" defaultValue={contato?.cargo} densidade={densidade} />
        <CampoTexto name="contato_telefone" label="Telefone" defaultValue={contato?.telefone} densidade={densidade} />
        <CampoTexto name="contato_celular" label="Celular" defaultValue={contato?.celular} densidade={densidade} />
        <CampoTexto name="contato_whatsapp" label="WhatsApp" defaultValue={contato?.whatsapp} densidade={densidade} />
        <CampoTexto name="contato_email" label="E-mail" defaultValue={contato?.email} densidade={densidade} />
        <CampoTexto name="contato_departamento" label="Departamento" defaultValue={contato?.departamento} densidade={densidade} />
      </FormSection>

      <FormSection title="Endereço principal" densidade={densidade}>
        <CampoTexto name="cep" label="CEP" defaultValue={endereco?.cep} densidade={densidade} />
        <CampoTexto name="endereco" label="Endereço" defaultValue={endereco?.endereco} densidade={densidade} />
        <CampoTexto name="numero" label="Número" defaultValue={endereco?.numero} densidade={densidade} />
        <CampoTexto name="complemento" label="Complemento" defaultValue={endereco?.complemento} densidade={densidade} />
        <CampoTexto name="bairro" label="Bairro" defaultValue={endereco?.bairro} densidade={densidade} />
        <CampoTexto name="cidade" label="Cidade" defaultValue={endereco?.cidade} densidade={densidade} />
        <CampoTexto name="estado" label="Estado" defaultValue={endereco?.estado} densidade={densidade} />
        <CampoTexto name="pais" label="País" defaultValue={endereco?.pais ?? "Brasil"} densidade={densidade} />
        <CampoTexto name="latitude" label="Latitude" defaultValue={endereco?.latitude} densidade={densidade} />
        <CampoTexto name="longitude" label="Longitude" defaultValue={endereco?.longitude} densidade={densidade} />
      </FormSection>

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
  return (
    <div className="space-y-4">
      <MiniTable
        headers={["Nome", "Cargo", "Telefone", "WhatsApp", "E-mail", "Principal"]}
        rows={parceiro.contatos.map((contato) => [
          contato.nome,
          contato.cargo ?? "-",
          contato.telefone ?? contato.celular ?? "-",
          contato.whatsapp ?? "-",
          contato.email ?? "-",
          contato.principal ? "Sim" : "Não",
        ])}
      />
      <form action={salvarParceiroContato} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <input type="hidden" name="parceiro_id" value={parceiro.id} />
        <div className={classes(densidade).grid}>
          <CampoTexto name="nome" label="Nome" required densidade={densidade} />
          <CampoTexto name="cargo" label="Cargo" densidade={densidade} />
          <CampoTexto name="telefone" label="Telefone" densidade={densidade} />
          <CampoTexto name="celular" label="Celular" densidade={densidade} />
          <CampoTexto name="whatsapp" label="WhatsApp" densidade={densidade} />
          <CampoTexto name="email" label="E-mail" densidade={densidade} />
          <CampoTexto name="departamento" label="Departamento" densidade={densidade} />
          <Toggle name="principal" label="Principal" />
          <Toggle name="contato_financeiro" label="Financeiro" />
          <Toggle name="contato_tecnico" label="Técnico" />
          <Toggle name="contato_operacional" label="Operacional" defaultChecked />
          <Toggle name="ativo" label="Ativo" defaultChecked />
        </div>
        <button type="submit" className="min-h-10 rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white">
          + Novo contato
        </button>
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

export function ParceiroForm({ parceiro, erro }: Props) {
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

      {aba === "geral" ? <GeralTab parceiro={parceiro} densidade={densidade} /> : null}
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
