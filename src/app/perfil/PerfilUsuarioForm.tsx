"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import { ImageCropUpload } from "@/components/ImageCropUpload";
import type { PerfilAutenticado } from "@/lib/auth/types";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  atualizarFotoPerfil,
  atualizarPerfilUsuario,
  type PerfilActionState,
} from "./actions";

const ESTADO_INICIAL: PerfilActionState = {
  status: "idle",
  message: "",
};

const AVATAR_BUCKET = "perfis";

type PerfilUsuarioFormProps = {
  perfil: PerfilAutenticado;
  perfilAtual: PerfilAutenticado;
  modoAdministrativo: boolean;
  aviso?: string;
};

function obterExtensao(nomeArquivo: string) {
  return nomeArquivo.split(".").pop()?.toLowerCase() ?? "";
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
    return "Não foi possível concluir a operação. Tente novamente.";
  }

  if (
    error.message.includes("Server Components render") ||
    error.message.includes("digest")
  ) {
    return "Não foi possível salvar a foto no momento. Verifique se as permissões de perfil e Storage foram publicadas e tente novamente.";
  }

  return error.message || "Não foi possível concluir a operação. Tente novamente.";
}

export function PerfilUsuarioForm({
  perfil,
  perfilAtual,
  modoAdministrativo,
  aviso,
}: PerfilUsuarioFormProps) {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [state, formAction, pending] = useActionState(
    atualizarPerfilUsuario,
    ESTADO_INICIAL
  );
  const editandoOutroPerfil = perfil.id !== perfilAtual.id;
  const [avatarUrl, setAvatarUrl] = useState(perfil.avatar_url ?? "");
  const [avatarMensagem, setAvatarMensagem] = useState("");
  const [avatarStatus, setAvatarStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [avatarPendente, setAvatarPendente] = useState(false);
  const podeEnviarAvatar = !editandoOutroPerfil;

  async function enviarAvatar(arquivo: File) {
    const nomeSeguro = normalizarNomeArquivo(arquivo.name);
    const extensao = obterExtensao(nomeSeguro);
    const nomeAvatar = `avatar-${Date.now()}.${extensao}`;
    const caminhoArquivo = `perfis/${perfilAtual.id}/${nomeAvatar}`;

    const { error: erroUpload } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(caminhoArquivo, arquivo, {
        contentType: arquivo.type || "image/webp",
        upsert: false,
      });

    if (erroUpload?.message.toLowerCase().includes("bucket not found")) {
      throw new Error(
        "O bucket de fotos de perfil ainda não está disponível. Aplique as migrations e tente novamente."
      );
    } else if (erroUpload) {
      throw new Error(erroUpload.message);
    }

    const { data: arquivoPublico } = supabase.storage
      .from(AVATAR_BUCKET)
      .getPublicUrl(caminhoArquivo);

    const resultado = await atualizarFotoPerfil(arquivoPublico.publicUrl);

    if (resultado.status !== "success") {
      throw new Error(resultado.message);
    }

    setAvatarUrl(arquivoPublico.publicUrl);
    setAvatarStatus("success");
    setAvatarMensagem("Foto salva com sucesso.");
    router.refresh();
  }

  async function enviarAvatarAjustado(arquivo: File) {
    setAvatarStatus("idle");
    setAvatarMensagem("Enviando foto...");
    setAvatarPendente(true);

    try {
      await enviarAvatar(arquivo);
    } catch (error) {
      console.error("Falha ao enviar foto do perfil.", error);
      setAvatarStatus("error");
      setAvatarMensagem(mensagemErroOperacional(error));
    } finally {
      setAvatarPendente(false);
    }
  }

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <input type="hidden" name="perfil_id" value={perfil.id} />
      <input type="hidden" name="avatar_url" value={avatarUrl} />

      <div className="min-w-0">
        <div className="space-y-3">
          {aviso ? <Mensagem tipo="alerta" mensagem={aviso} /> : null}
          {modoAdministrativo && editandoOutroPerfil ? (
            <Mensagem
              tipo="alerta"
              mensagem="Edição administrativa ativa. As permissões finais são validadas pelo Supabase."
            />
          ) : null}
          {state.message ? (
            <Mensagem
              tipo={state.status === "success" ? "sucesso" : "erro"}
              mensagem={state.message}
            />
          ) : null}
        </div>

        <section aria-labelledby="perfil-info-heading" className="mt-2">
          <h2 id="perfil-info-heading" className="sr-only">
            Informações pessoais
          </h2>

          <div className="divide-y divide-gray-200">
            <LinhaLeitura label="Nome completo" value={perfil.nome_completo} />
            <LinhaLeitura
              label="E-mail"
              value={perfil.email ?? "Não informado"}
              helper="Vem do Supabase Auth e não pode ser editado livremente."
            />
            <LinhaCampoTexto
              label="Cargo"
              name="cargo"
              defaultValue={perfil.cargo ?? ""}
              disabled={pending}
              required
              maxLength={120}
              placeholder="Ex.: Analista de suporte"
            />
            <LinhaCampoTexto
              label="Telefone"
              name="telefone"
              defaultValue={perfil.telefone ?? ""}
              disabled={pending}
              required
              maxLength={30}
              placeholder="(00) 00000-0000"
            />
            <div className="py-6">
              <ImageCropUpload
                id="avatar_upload"
                label="Foto"
                imageUrl={avatarUrl}
                fallbackText={perfil.nome_completo}
                disabled={pending || avatarPendente || !podeEnviarAvatar}
                uploading={avatarPendente}
                mensagem={avatarMensagem}
                status={avatarStatus}
                onUpload={enviarAvatarAjustado}
                helper={
                  podeEnviarAvatar
                    ? "Envie JPG, PNG ou WEBP. A foto será ajustada para apresentação circular 1:1 e é obrigatória para salvar o perfil completo."
                    : "A foto só pode ser enviada pelo próprio usuário."
                }
              />
            </div>
            <LinhaTextarea
              label="Biografia"
              name="biografia"
              defaultValue={perfil.biografia ?? ""}
              disabled={pending}
              required
              helper="Até 500 caracteres. Use uma descrição objetiva para contexto operacional."
            />
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600" aria-live="polite">
            {pending
              ? "Salvando alterações..."
              : "Cargo, telefone, foto e biografia são obrigatórios."}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-lg bg-gray-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {pending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      <PainelPrivacidade />
    </form>
  );
}

function LinhaLeitura({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="py-6">
      <dt className="text-base font-medium text-gray-950">{label}</dt>
      <dd className="mt-1 break-words text-sm text-gray-600">{value}</dd>
      {helper ? <p className="mt-1 text-sm text-gray-500">{helper}</p> : null}
    </div>
  );
}

function LinhaCampoTexto({
  label,
  name,
  defaultValue,
  placeholder,
  disabled,
  required,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  disabled: boolean;
  required?: boolean;
  maxLength?: number;
}) {
  return (
    <div className="py-6">
      <label htmlFor={name} className="block text-base font-medium text-gray-950">
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        maxLength={maxLength}
        className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
      />
    </div>
  );
}

function LinhaTextarea({
  label,
  name,
  defaultValue,
  disabled,
  helper,
  required,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled: boolean;
  helper: string;
  required?: boolean;
}) {
  return (
    <div className="py-6">
      <label htmlFor={name} className="block text-base font-medium text-gray-950">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        defaultValue={defaultValue}
        rows={4}
        maxLength={500}
        required={required}
        disabled={disabled}
        className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
      />
      <p className="mt-2 text-sm text-gray-500">{helper}</p>
    </div>
  );
}

function Mensagem({
  tipo,
  mensagem,
}: {
  tipo: "sucesso" | "erro" | "alerta";
  mensagem: string;
}) {
  const classes = {
    sucesso: "border-emerald-200 bg-emerald-50 text-emerald-800",
    erro: "border-red-200 bg-red-50 text-red-800",
    alerta: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <p
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${classes[tipo]}`}
      role={tipo === "erro" ? "alert" : "status"}
    >
      {mensagem}
    </p>
  );
}

function PainelPrivacidade() {
  return (
    <aside className="h-fit rounded-xl border border-gray-200 bg-white p-6 lg:sticky lg:top-6">
      <BlocoAjuda
        icone="ID"
        titulo="Dados protegidos"
        texto="Nome e e-mail vêm da base de autenticação e não são alterados livremente pelo usuário."
      />
      <BlocoAjuda
        icone="OK"
        titulo="Perfil completo"
        texto="Cargo, telefone, biografia e foto ajudam a identificar responsáveis nos chamados e evidências."
      />
      <BlocoAjuda
        icone="LG"
        titulo="Uso operacional"
        texto="As informações aparecem apenas em fluxos autorizados, como chamados, histórico, evidências e atribuições."
        semDivisor
      />
    </aside>
  );
}

function BlocoAjuda({
  icone,
  titulo,
  texto,
  semDivisor,
}: {
  icone: string;
  titulo: string;
  texto: string;
  semDivisor?: boolean;
}) {
  return (
    <div className={semDivisor ? "pb-0" : "mb-7 border-b border-gray-200 pb-7"}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-700">
        {icone}
      </span>
      <h3 className="mt-5 text-lg font-bold leading-snug text-gray-950">
        {titulo}
      </h3>
      <p className="mt-4 text-sm leading-6 text-gray-600">{texto}</p>
    </div>
  );
}
