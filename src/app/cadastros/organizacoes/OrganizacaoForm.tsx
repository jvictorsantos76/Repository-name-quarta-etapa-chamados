"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ImageCropUpload } from "@/components/ImageCropUpload";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import { salvarOrganizacao } from "./actions";
import {
  LABEL_TIPO_ORGANIZACAO,
  TIPOS_ORGANIZACAO,
  type Organizacao,
} from "./types";

type Props = {
  organizacao?: Organizacao | null;
  erro?: string | null;
};

type UploadStatus = "idle" | "success" | "error";

const ORGANIZACOES_BUCKET = "organizacoes";
const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";
const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const toggleClass =
  "flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold uppercase tracking-wide text-gray-700";

function obterExtensao(nomeArquivo: string) {
  return nomeArquivo.split(".").pop()?.toLowerCase() ?? "webp";
}

function normalizarNomeArquivo(nomeArquivo: string) {
  return nomeArquivo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function mensagemErroOperacional(error: unknown) {
  if (!(error instanceof Error)) {
    return "Não foi possível concluir o envio da imagem.";
  }

  if (error.message.toLowerCase().includes("bucket not found")) {
    return "O bucket de imagens de organizações ainda não está disponível. Aplique as migrations e tente novamente.";
  }

  return error.message || "Não foi possível concluir o envio da imagem.";
}

function CampoTexto({
  name,
  label,
  defaultValue,
  placeholder,
  required = false,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        required={required}
        className={inputClass}
      />
    </label>
  );
}

function CampoTextarea({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={5}
        className={`${inputClass} resize-y`}
      />
    </label>
  );
}

function CampoCor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const corVisual = /^#[0-9a-f]{6}$/i.test(value) ? value : "#00aeef";

  return (
    <div className={labelClass}>
      Cor de identificação
      <input type="hidden" name="cor_identificacao" value={value} />
      <div className="mt-1 flex min-h-9 items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
        <label
          className="relative h-5 w-5 shrink-0 cursor-pointer overflow-hidden rounded-full border border-gray-300"
          style={{ backgroundColor: corVisual }}
          title="Selecionar cor"
        >
          <span className="sr-only">Selecionar cor</span>
          <input
            type="color"
            value={corVisual}
            onChange={(event) => onChange(event.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <span className="min-w-0 flex-1 text-sm font-semibold normal-case tracking-normal text-gray-800">
          {value || "Sem cor definida"}
        </span>
        {value ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="rounded border border-gray-200 px-2 py-1 text-[11px] font-semibold normal-case tracking-normal text-gray-600 transition hover:bg-white"
          >
            Limpar
          </button>
        ) : null}
      </div>
    </div>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-4 py-3">
        <h2 className="text-base font-bold text-gray-950">{title}</h2>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2">{children}</div>
    </section>
  );
}

export function OrganizacaoForm({ organizacao, erro }: Props) {
  const editando = Boolean(organizacao);
  const supabase = useSupabaseBrowserClient();
  const [logoUrl, setLogoUrl] = useState(organizacao?.logo_url ?? "");
  const [logoMensagem, setLogoMensagem] = useState("");
  const [logoStatus, setLogoStatus] = useState<UploadStatus>("idle");
  const [logoPendente, setLogoPendente] = useState(false);
  const [corIdentificacao, setCorIdentificacao] = useState(
    organizacao?.cor_identificacao ?? ""
  );

  async function enviarLogo(arquivo: File) {
    const nomeSeguro = normalizarNomeArquivo(arquivo.name);
    const extensao = obterExtensao(nomeSeguro);
    const basePath = organizacao?.id ?? "temp";
    const caminhoArquivo = `organizacoes/${basePath}/logo-${Date.now()}.${extensao}`;

    setLogoStatus("idle");
    setLogoMensagem("Enviando imagem...");
    setLogoPendente(true);

    try {
      const { error } = await supabase.storage
        .from(ORGANIZACOES_BUCKET)
        .upload(caminhoArquivo, arquivo, {
          contentType: arquivo.type || "image/webp",
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from(ORGANIZACOES_BUCKET)
        .getPublicUrl(caminhoArquivo);

      setLogoUrl(data.publicUrl);
      setLogoStatus("success");
      setLogoMensagem("Imagem preparada. Salve a organização para gravar a URL.");
    } catch (error) {
      console.error("Falha ao enviar imagem da organização.", error);
      setLogoStatus("error");
      setLogoMensagem(mensagemErroOperacional(error));
    } finally {
      setLogoPendente(false);
    }
  }

  return (
    <form action={salvarOrganizacao} className="space-y-4">
      <input type="hidden" name="id" value={organizacao?.id ?? ""} />
      <input type="hidden" name="logo_url" value={logoUrl} />

      {erro ? (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {erro}
        </div>
      ) : null}

      <FormSection title="Identificação">
        <CampoTexto
          name="nome"
          label="Nome da organização"
          defaultValue={organizacao?.nome}
          placeholder="Americanas"
          required
        />
        <CampoTexto
          name="codigo_interno"
          label="Código interno"
          defaultValue={organizacao?.codigo_interno}
          placeholder="AMER"
        />
        <label className={labelClass}>
          Tipo de organização
          <select
            name="tipo_organizacao"
            defaultValue={organizacao?.tipo_organizacao ?? "cliente"}
            required
            className={inputClass}
          >
            {TIPOS_ORGANIZACAO.map((tipo) => (
              <option key={tipo} value={tipo}>
                {LABEL_TIPO_ORGANIZACAO[tipo]}
              </option>
            ))}
          </select>
        </label>
        <label className={toggleClass}>
          <span>Status ativo</span>
          <input
            type="checkbox"
            name="ativo"
            defaultChecked={organizacao?.ativo ?? true}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </label>
        <div className="md:col-span-2">
          <ImageCropUpload
            id="organizacao_logo"
            label="Logo"
            imageUrl={logoUrl}
            fallbackText={organizacao?.nome ?? "Organização"}
            helper="Envie JPG, PNG ou WEBP. A imagem será ajustada para apresentação circular 1:1."
            disabled={logoPendente}
            uploading={logoPendente}
            mensagem={logoMensagem}
            status={logoStatus}
            buttonLabel="Escolher logo"
            onUpload={enviarLogo}
          />
        </div>
        <CampoCor value={corIdentificacao} onChange={setCorIdentificacao} />
      </FormSection>

      <FormSection title="Estrutura operacional">
        <div className="md:col-span-2">
          <label className={toggleClass}>
            <span>Possui filiais</span>
            <input
              type="checkbox"
              name="possui_filiais"
              defaultChecked={organizacao?.possui_filiais ?? false}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </label>
          <p className="mt-2 text-sm text-gray-600">
            Use este campo para indicar se a organização representa uma rede ou
            estrutura com múltiplos clientes/unidades operacionais.
          </p>
        </div>
        <div className="md:col-span-2">
          <CampoTextarea
            name="observacoes"
            label="Observações"
            defaultValue={organizacao?.observacoes}
          />
        </div>
      </FormSection>

      <FormSection title="Integrações">
        <CampoTexto
          name="sistema_externo_padrao"
          label="Sistema externo padrão"
          defaultValue={organizacao?.sistema_externo_padrao}
          placeholder="GLPI, Jira, Freshservice"
        />
        <CampoTexto
          name="id_externo"
          label="ID externo"
          defaultValue={organizacao?.id_externo}
        />
      </FormSection>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/cadastros/organizacoes"
          className="inline-flex min-h-10 items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          className="inline-flex min-h-10 items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
        >
          {editando ? "Salvar alterações" : "Salvar organização"}
        </button>
      </div>
    </form>
  );
}
