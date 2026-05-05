"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LABEL_PAPEL_USUARIO } from "@/lib/auth/permissions";
import type { PerfilAutenticado } from "@/lib/auth/types";
import {
  atualizarPerfilUsuario,
  type PerfilActionState,
} from "./actions";

const ESTADO_INICIAL: PerfilActionState = {
  status: "idle",
  message: "",
};

type PerfilUsuarioFormProps = {
  perfil: PerfilAutenticado;
  perfilAtual: PerfilAutenticado;
  modoAdministrativo: boolean;
  aviso?: string;
};

export function PerfilUsuarioForm({
  perfil,
  perfilAtual,
  modoAdministrativo,
  aviso,
}: PerfilUsuarioFormProps) {
  const [state, formAction, pending] = useActionState(
    atualizarPerfilUsuario,
    ESTADO_INICIAL
  );
  const editandoOutroPerfil = perfil.id !== perfilAtual.id;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="perfil_id" value={perfil.id} />

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

      <section
        id="dados-basicos"
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase text-blue-700">
            Dados básicos
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">
            Identificação operacional
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Nome, e-mail, nível e cargo seguem as regras administrativas do
            sistema.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoLeitura label="Nome" value={perfil.nome_completo} />
          <CampoLeitura label="E-mail" value={perfil.email ?? "Não informado"} />
          <CampoLeitura
            label="Nível"
            value={LABEL_PAPEL_USUARIO[perfil.papel]}
          />
          <CampoLeitura label="Cargo" value={perfil.cargo ?? "Não informado"} />
          <CampoTexto
            label="Telefone"
            name="telefone"
            defaultValue={perfil.telefone ?? ""}
            disabled={pending}
            placeholder="(00) 00000-0000"
          />
        </div>
      </section>

      <section
        id="seguranca"
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase text-blue-700">
            Segurança
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">
            Acesso e autenticação
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            O e-mail vem do Supabase Auth e não é editado livremente nesta tela.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 md:flex-1">
            <span className="block text-xs font-semibold uppercase text-gray-500">
              Conta autenticada
            </span>
            <span className="mt-1 block font-medium text-gray-950">
              {perfil.email ?? "E-mail não informado"}
            </span>
          </div>
          {!editandoOutroPerfil ? (
            <Link
              href="/auth/alterar-senha"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Alterar senha
            </Link>
          ) : null}
        </div>
      </section>

      <section
        id="preferencias"
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      >
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase text-blue-700">
            Preferências / Perfil
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-950">
            Apresentação do usuário
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Foto por URL e biografia ficam salvas em public.perfis.
          </p>
        </div>

        <div className="space-y-4">
          <CampoTexto
            label="URL da foto"
            name="avatar_url"
            defaultValue={perfil.avatar_url ?? ""}
            disabled={pending}
            placeholder="https://..."
          />

          <div>
            <label
              htmlFor="biografia"
              className="mb-2 block text-sm font-semibold text-gray-900"
            >
              Biografia
            </label>
            <textarea
              id="biografia"
              name="biografia"
              defaultValue={perfil.biografia ?? ""}
              rows={5}
              maxLength={500}
              disabled={pending}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              Até 500 caracteres. Use uma descrição objetiva para contexto
              operacional.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-gray-600" aria-live="polite">
          {pending ? "Salvando alterações..." : "Revise os dados antes de salvar."}
        </p>
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-lg bg-gray-950 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-400"
        >
          {pending ? "Salvando..." : "Salvar perfil"}
        </button>
      </div>
    </form>
  );
}

function CampoLeitura({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <dt className="text-xs font-semibold uppercase text-gray-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-gray-950">
        {value}
      </dd>
    </div>
  );
}

function CampoTexto({
  label,
  name,
  defaultValue,
  placeholder,
  disabled,
}: {
  label: string;
  name: string;
  defaultValue: string;
  placeholder?: string;
  disabled: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-semibold text-gray-900"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        placeholder={placeholder}
        disabled={disabled}
        className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-100"
      />
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
