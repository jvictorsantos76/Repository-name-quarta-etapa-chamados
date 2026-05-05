"use client";

import Link from "next/link";
import { useState } from "react";
import { CADASTRO_USUARIO_PAGE_VERSION } from "@/config/version";
import {
  enviarSolicitacaoAcesso,
  type CadastroSolicitacaoInput,
} from "./actions";

const camposIniciais = {
  nome_completo: "",
  email: "",
  telefone: "",
  empresa: "",
  cnpj: "",
  loja_unidade: "",
  cargo: "",
  motivo_acesso: "",
  aceite_termos: false,
  aceite_privacidade: false,
};

export default function CadastroPage() {
  const [campos, setCampos] = useState(camposIniciais);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  function atualizarCampo(
    campo: keyof typeof campos,
    valor: string | boolean
  ) {
    setCampos((valores) => ({ ...valores, [campo]: valor }));
  }

  async function enviarSolicitacao(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !campos.nome_completo.trim() ||
      !campos.email.trim() ||
      !campos.empresa.trim()
    ) {
      setErro("Preencha nome completo, e-mail e empresa.");
      return;
    }

    if (!campos.aceite_termos || !campos.aceite_privacidade) {
      setErro("É necessário aceitar os Termos de Uso e a Política de Privacidade.");
      return;
    }

    setErro("");
    setEnviando(true);
    const resultado = await enviarSolicitacaoAcesso(
      campos as CadastroSolicitacaoInput
    );

    if (!resultado.ok) {
      setErro(
        resultado.mensagem ??
          "Não foi possível enviar a solicitação. Tente novamente."
      );
      setEnviando(false);
      return;
    }

    setCampos(camposIniciais);
    setSucesso(true);
    setEnviando(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <section className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow">
        <Link href="/login" className="text-sm font-semibold text-blue-600">
          Voltar ao login
        </Link>

        <p className="mt-6 text-sm font-semibold uppercase tracking-wide text-blue-600">
          Solicitação de acesso
        </p>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-2xl font-bold">Cadastro público controlado</h1>
          <span className="w-fit rounded-lg border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
            Tela v{CADASTRO_USUARIO_PAGE_VERSION.replace(/^v/, "")}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          O envio deste formulário não libera acesso automático. A solicitação
          será validada pela Quarta Etapa ou por responsável autorizado. Ao ser
          aprovado, você receberá um convite por e-mail para definir seu acesso.
          O prazo administrativo inicial é de 72 horas úteis.
        </p>

        {sucesso ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Solicitação recebida com sucesso. A liberação depende de validação
            operacional. O e-mail de acesso será enviado somente após aprovação.
          </div>
        ) : (
          <form onSubmit={enviarSolicitacao} className="mt-6 space-y-5">
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <CampoTexto label="Nome completo" value={campos.nome_completo} onChange={(valor) => atualizarCampo("nome_completo", valor)} required />
              <CampoTexto label="E-mail" type="email" value={campos.email} onChange={(valor) => atualizarCampo("email", valor)} required />
              <CampoTexto label="Telefone" value={campos.telefone} onChange={(valor) => atualizarCampo("telefone", valor)} />
              <CampoTexto label="Empresa" value={campos.empresa} onChange={(valor) => atualizarCampo("empresa", valor)} required />
              <CampoTexto label="CNPJ" value={campos.cnpj} onChange={(valor) => atualizarCampo("cnpj", valor)} />
              <CampoTexto label="Loja/Unidade" value={campos.loja_unidade} onChange={(valor) => atualizarCampo("loja_unidade", valor)} />
              <CampoTexto label="Cargo" value={campos.cargo} onChange={(valor) => atualizarCampo("cargo", valor)} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Motivo do acesso
              </label>
              <textarea
                value={campos.motivo_acesso}
                onChange={(event) =>
                  atualizarCampo("motivo_acesso", event.target.value)
                }
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <label className="flex gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={campos.aceite_termos}
                onChange={(event) =>
                  atualizarCampo("aceite_termos", event.target.checked)
                }
                className="mt-1"
              />
              <span>
                Li e aceito os{" "}
                <Link href="/termos-uso" className="font-semibold text-blue-600">
                  Termos de Uso
                </Link>
                .
              </span>
            </label>

            <label className="flex gap-3 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={campos.aceite_privacidade}
                onChange={(event) =>
                  atualizarCampo("aceite_privacidade", event.target.checked)
                }
                className="mt-1"
              />
              <span>
                Li e aceito a{" "}
                <Link href="/politica-privacidade" className="font-semibold text-blue-600">
                  Política de Privacidade
                </Link>
                .
              </span>
            </label>

            <button
              type="submit"
              disabled={enviando}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {enviando ? "Enviando..." : "Enviar solicitação"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
