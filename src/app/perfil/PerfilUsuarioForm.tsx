"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LABEL_PAPEL_USUARIO } from "@/lib/auth/permissions";
import type { PerfilAutenticado } from "@/lib/auth/types";
import {
  createSupabaseBrowserClient,
  syncSupabaseSessionCookies,
  useSupabaseBrowserClient,
} from "@/lib/supabase/client";
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
const AVATAR_FALLBACK_BUCKET = "evidencias-chamados";
const AVATAR_MAX_BYTES = 5 * 1024 * 1024;
const avatarExtensoesAceitas = new Set(["jpg", "jpeg", "png", "webp"]);
const avatarMimeTypesAceitos = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const acceptAvatar = ".jpg,.jpeg,.png,.webp";

type PerfilUsuarioFormProps = {
  perfil: PerfilAutenticado;
  perfilAtual: PerfilAutenticado;
  modoAdministrativo: boolean;
  aviso?: string;
};

function getIniciais(nome: string) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return iniciais || "QE";
}

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

function formatarTamanho(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function validarArquivoAvatar(file: File) {
  const extensao = obterExtensao(file.name);

  if (!avatarExtensoesAceitas.has(extensao)) {
    return "Envie uma imagem JPG, PNG ou WEBP.";
  }

  if (file.type && !avatarMimeTypesAceitos.has(file.type)) {
    return "O arquivo selecionado não parece ser uma imagem permitida.";
  }

  if (file.size > AVATAR_MAX_BYTES) {
    return `A foto deve ter no máximo ${formatarTamanho(AVATAR_MAX_BYTES)}.`;
  }

  return "";
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
  const [avatarPendente, startAvatarTransition] = useTransition();
  const podeEnviarAvatar = !editandoOutroPerfil;

  async function enviarAvatar(arquivo: File) {
    const nomeSeguro = normalizarNomeArquivo(arquivo.name);
    const extensao = obterExtensao(nomeSeguro);
    const nomeAvatar = `avatar-${Date.now()}.${extensao}`;
    const caminhoArquivo = `perfis/${perfilAtual.id}/${nomeAvatar}`;
    const caminhoFallback = `chamados/perfis/${perfilAtual.id}/${nomeAvatar}`;

    const { error: erroUpload } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(caminhoArquivo, arquivo, {
        contentType: arquivo.type || undefined,
        upsert: false,
      });

    let bucketUsado = AVATAR_BUCKET;
    let caminhoUsado = caminhoArquivo;

    if (erroUpload?.message.toLowerCase().includes("bucket not found")) {
      const { error: erroFallback } = await supabase.storage
        .from(AVATAR_FALLBACK_BUCKET)
        .upload(caminhoFallback, arquivo, {
          contentType: arquivo.type || undefined,
          upsert: false,
        });

      if (erroFallback) {
        throw new Error(
          "O bucket de fotos ainda não está disponível e o envio alternativo falhou. Aplique as migrations e tente novamente."
        );
      }

      bucketUsado = AVATAR_FALLBACK_BUCKET;
      caminhoUsado = caminhoFallback;
    } else if (erroUpload) {
      throw new Error(erroUpload.message);
    }

    const { data: arquivoPublico } = supabase.storage
      .from(bucketUsado)
      .getPublicUrl(caminhoUsado);

    const resultado = await atualizarFotoPerfil(arquivoPublico.publicUrl);

    if (resultado.status !== "success") {
      throw new Error(resultado.message);
    }

    setAvatarUrl(arquivoPublico.publicUrl);
    setAvatarStatus("success");
    setAvatarMensagem("Foto salva com sucesso.");
    router.refresh();
  }

  function selecionarAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = event.target.files?.[0];
    event.target.value = "";

    if (!arquivo) {
      return;
    }

    const erroValidacao = validarArquivoAvatar(arquivo);

    if (erroValidacao) {
      setAvatarStatus("error");
      setAvatarMensagem(erroValidacao);
      return;
    }

    setAvatarStatus("idle");
    setAvatarMensagem("Enviando foto...");

    startAvatarTransition(() => {
      void enviarAvatar(arquivo).catch((error) => {
        console.error("Falha ao enviar foto do perfil.", error);
        setAvatarStatus("error");
        setAvatarMensagem(
          error instanceof Error
            ? error.message
            : "Não foi possível enviar a foto. Tente novamente."
        );
      });
    });
  }

  return (
    <form
      action={formAction}
      className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_333px]"
    >
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
          <h2
            id="perfil-info-heading"
            className="sr-only"
          >
            Informações pessoais
          </h2>

          <div className="divide-y divide-gray-200">
            <LinhaLeitura
              label="Nome completo"
              value={perfil.nome_completo}
              actionLabel="Bloqueado"
            />
            <LinhaLeitura
              label="E-mail"
              value={perfil.email ?? "Não informado"}
              helper="Vem do Supabase Auth e não pode ser editado livremente."
              actionLabel="Bloqueado"
            />
            <LinhaCampoTexto
              label="Telefone"
              name="telefone"
              defaultValue={perfil.telefone ?? ""}
              disabled={pending}
              placeholder="(00) 00000-0000"
              actionLabel={perfil.telefone ? "Editar" : "Adicionar"}
            />
            <LinhaLeitura
              label="Cargo"
              value={perfil.cargo ?? "Não informado"}
              actionLabel="Admin"
            />
            <LinhaLeitura
              label="Nível operacional"
              value={LABEL_PAPEL_USUARIO[perfil.papel]}
              helper="Definido pela administração conforme permissões em public.perfis."
              actionLabel="Admin"
            />
            <LinhaUploadAvatar
              avatarUrl={avatarUrl}
              nome={perfil.nome_completo}
              disabled={pending || avatarPendente || !podeEnviarAvatar}
              uploading={avatarPendente}
              mensagem={avatarMensagem}
              status={avatarStatus}
              onChange={selecionarAvatar}
              actionLabel={avatarUrl ? "Editar" : "Adicionar"}
              helper={
                podeEnviarAvatar
                  ? "Envie JPG, PNG ou WEBP. A foto será salva no perfil e exibida no cabeçalho."
                  : "A foto só pode ser enviada pelo próprio usuário."
              }
            />
            <LinhaTextarea
              label="Biografia"
              name="biografia"
              defaultValue={perfil.biografia ?? ""}
              disabled={pending}
              helper="Até 500 caracteres. Use uma descrição objetiva para contexto operacional."
              actionLabel={perfil.biografia ? "Editar" : "Adicionar"}
            />
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-gray-600" aria-live="polite">
            {pending
              ? "Salvando alterações..."
              : "Somente telefone, foto e biografia serão salvos."}
          </p>
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 rounded-lg bg-gray-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {pending ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>

        {!editandoOutroPerfil ? (
          <SecaoSeguranca />
        ) : null}
      </div>

      <PainelPrivacidade />
    </form>
  );
}

function SecaoSeguranca() {
  const [erroLogout, setErroLogout] = useState("");
  const [logoutPendente, startLogoutTransition] = useTransition();

  function encerrarSessao() {
    setErroLogout("");

    startLogoutTransition(async () => {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signOut();

      syncSupabaseSessionCookies(null);

      if (error) {
        setErroLogout(
          "Não foi possível encerrar a sessão no navegador. Tente novamente."
        );
        return;
      }

      window.location.assign("/auth/logout");
    });
  }

  return (
    <section
      aria-labelledby="perfil-seguranca-heading"
      className="mt-8 border-t border-gray-200 pt-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2
            id="perfil-seguranca-heading"
            className="text-base font-bold text-gray-950"
          >
            Segurança
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie senha e encerramento manual da sessão neste dispositivo.
          </p>
        </div>
      </div>

      {erroLogout ? (
        <div className="mt-4">
          <Mensagem tipo="erro" mensagem={erroLogout} />
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Link
          href="/auth/alterar-senha"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
        >
          Alterar senha
        </Link>
        <button
          type="button"
          onClick={encerrarSessao}
          disabled={logoutPendente}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {logoutPendente ? "Saindo..." : "Encerrar sessão"}
        </button>
      </div>
    </section>
  );
}

function LinhaLeitura({
  label,
  value,
  helper,
  actionLabel,
}: {
  label: string;
  value: string;
  helper?: string;
  actionLabel: string;
}) {
  return (
    <div className="grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_96px]">
      <div className="min-w-0">
        <dt className="text-base font-medium text-gray-950">{label}</dt>
        <dd className="mt-1 break-words text-sm text-gray-600">{value}</dd>
        {helper ? <p className="mt-1 text-sm text-gray-500">{helper}</p> : null}
      </div>
      <span className="text-left text-sm font-semibold text-gray-950 sm:text-right">
        {actionLabel}
      </span>
    </div>
  );
}

function LinhaCampoTexto({
  label,
  name,
  defaultValue,
  placeholder,
  disabled,
  helper,
  actionLabel,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  disabled: boolean;
  helper?: string;
  actionLabel: string;
}) {
  return (
    <div className="grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_96px]">
      <div className="min-w-0">
        <label htmlFor={name} className="block text-base font-medium text-gray-950">
          {label}
        </label>
        <input
          id={name}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />
        {helper ? <p className="mt-2 text-sm text-gray-500">{helper}</p> : null}
      </div>
      <span className="text-left text-sm font-semibold text-gray-950 underline sm:text-right">
        {actionLabel}
      </span>
    </div>
  );
}

function LinhaUploadAvatar({
  avatarUrl,
  nome,
  disabled,
  uploading,
  mensagem,
  status,
  helper,
  actionLabel,
  onChange,
}: {
  avatarUrl: string;
  nome: string;
  disabled: boolean;
  uploading: boolean;
  mensagem: string;
  status: "idle" | "success" | "error";
  helper: string;
  actionLabel: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const mensagemClasse =
    status === "success"
      ? "text-emerald-700"
      : status === "error"
        ? "text-red-700"
        : "text-gray-600";

  return (
    <div className="grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_96px]">
      <div className="min-w-0">
        <label
          htmlFor="avatar_upload"
          className="block text-base font-medium text-gray-950"
        >
          Foto do perfil
        </label>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center">
          <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-950 text-lg font-bold text-white ring-4 ring-gray-100">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              getIniciais(nome)
            )}
          </span>
          <div className="min-w-0 flex-1">
            <input
              id="avatar_upload"
              type="file"
              accept={acceptAvatar}
              disabled={disabled}
              onChange={onChange}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 file:mr-3 file:rounded-md file:border-0 file:bg-gray-950 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white disabled:cursor-not-allowed disabled:bg-gray-100"
            />
            <p className="mt-2 text-sm text-gray-500">{helper}</p>
            <p className={`mt-2 text-sm font-medium ${mensagemClasse}`} aria-live="polite">
              {uploading ? "Enviando foto..." : mensagem}
            </p>
          </div>
        </div>
      </div>
      <span className="text-left text-sm font-semibold text-gray-950 underline sm:text-right">
        {uploading ? "Enviando" : actionLabel}
      </span>
    </div>
  );
}

function LinhaTextarea({
  label,
  name,
  defaultValue,
  disabled,
  helper,
  actionLabel,
}: {
  label: string;
  name: string;
  defaultValue: string;
  disabled: boolean;
  helper: string;
  actionLabel: string;
}) {
  return (
    <div className="grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_96px]">
      <div className="min-w-0">
        <label htmlFor={name} className="block text-base font-medium text-gray-950">
          {label}
        </label>
        <textarea
          id={name}
          name={name}
          defaultValue={defaultValue}
          rows={4}
          maxLength={500}
          disabled={disabled}
          className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
        />
        <p className="mt-2 text-sm text-gray-500">{helper}</p>
      </div>
      <span className="text-left text-sm font-semibold text-gray-950 underline sm:text-right">
        {actionLabel}
      </span>
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
        icone="?"
        titulo="Por que alguns dados não podem ser editados?"
        texto="Ocultamos e bloqueamos dados sensíveis para proteger a identidade do usuário e preservar a governança de acesso."
      />
      <BlocoAjuda
        icone="!"
        titulo="Quais detalhes podem ser editados?"
        texto="Telefone, foto e biografia podem ser atualizados pelo próprio usuário. Nome, e-mail, cargo e nível dependem da administração."
      />
      <BlocoAjuda
        icone="i"
        titulo="O que é compartilhado no sistema?"
        texto="As informações do perfil aparecem apenas em fluxos operacionais autorizados, como chamados, evidências, histórico e atribuições."
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
    <div className={semDivisor ? "pb-0" : "border-b border-gray-200 pb-7 mb-7"}>
      <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700">
        {icone}
      </span>
      <h3 className="mt-5 text-lg font-bold leading-snug text-gray-950">
        {titulo}
      </h3>
      <p className="mt-4 text-sm leading-6 text-gray-600">{texto}</p>
    </div>
  );
}
