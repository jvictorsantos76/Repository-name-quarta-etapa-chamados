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
  senha: "",
  confirmacao_senha: "",
  aceite_termos: false,
  aceite_privacidade: false,
};

const termosUsoResumo = [
  "O Portal de Atendimento Quarta Etapa é destinado à abertura, acompanhamento e gestão de chamados técnicos.",
  "O acesso é pessoal, intransferível e pode ser limitado, suspenso ou encerrado quando houver risco operacional, uso indevido ou ausência de aprovação administrativa.",
  "Durante o período temporário de análise, o usuário pode registrar chamados próprios e acompanhar apenas informações vinculadas ao seu atendimento.",
  "Solicitações aprovadas recebem um perfil operacional com papel, cliente e unidade definidos por responsável autorizado.",
  "A Quarta Etapa mantém registros de autenticação, solicitações, chamados, evidências e alterações para segurança, auditoria e melhoria contínua do serviço.",
];

const politicaPrivacidadeResumo = [
  "Os dados informados no cadastro são usados para validação de identidade, controle de acesso, comunicação operacional e gestão de chamados.",
  "Podem ser tratados dados de identificação, contato, empresa, unidade, cargo, histórico de acesso, chamados, anexos e evidências enviadas pelo usuário.",
  "O tratamento segue bases legais ligadas à execução de contrato, legítimo interesse, cumprimento de obrigação legal e segurança do serviço.",
  "O acesso aos dados é restrito por autenticação, autorização, RLS no Supabase e políticas internas de necessidade operacional.",
  "O titular pode solicitar informações, correção ou revisão de dados pelos canais administrativos da Quarta Etapa.",
];

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
      setErro("Leia e confirme os Termos de Uso e a Política de Privacidade.");
      return;
    }

    if (campos.senha.length < 8) {
      setErro("Informe uma senha com pelo menos 8 caracteres.");
      return;
    }

    if (campos.senha !== campos.confirmacao_senha) {
      setErro("A confirmação de senha não confere.");
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
          enviado, confirme seu e-mail para iniciar o acesso temporário restrito
          por até 72 horas úteis.
        </p>

        {sucesso ? (
          <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
            Solicitação recebida com sucesso. A liberação depende de validação
            operacional. Confirme o e-mail enviado para iniciar o acesso
            temporário restrito.
          </div>
        ) : (
          <form onSubmit={enviarSolicitacao} className="mt-6 space-y-5">
            {erro && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <CampoTexto label="Nome completo" value={campos.nome_completo} onChange={(valor) => atualizarCampo("nome_completo", valor)} autoComplete="name" required />
              <CampoTexto label="E-mail" type="email" value={campos.email} onChange={(valor) => atualizarCampo("email", valor)} autoComplete="username" required />
              <CampoTexto label="Telefone" value={campos.telefone} onChange={(valor) => atualizarCampo("telefone", valor)} autoComplete="tel" />
              <CampoTexto label="Empresa" value={campos.empresa} onChange={(valor) => atualizarCampo("empresa", valor)} autoComplete="organization" required />
              <CampoTexto label="CNPJ" value={campos.cnpj} onChange={(valor) => atualizarCampo("cnpj", valor)} />
              <CampoTexto label="Loja/Unidade" value={campos.loja_unidade} onChange={(valor) => atualizarCampo("loja_unidade", valor)} />
              <CampoTexto label="Cargo" value={campos.cargo} onChange={(valor) => atualizarCampo("cargo", valor)} />
              <CampoTexto label="Senha" type="password" value={campos.senha} onChange={(valor) => atualizarCampo("senha", valor)} required />
              <CampoTexto label="Confirmar senha" type="password" value={campos.confirmacao_senha} onChange={(valor) => atualizarCampo("confirmacao_senha", valor)} required />
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

            <LeituraObrigatoria
              titulo="Termos de Uso"
              href="/termos-uso"
              itens={termosUsoResumo}
              confirmado={campos.aceite_termos}
              onConfirmar={() => atualizarCampo("aceite_termos", true)}
            />

            <LeituraObrigatoria
              titulo="Política de Privacidade"
              href="/politica-privacidade"
              itens={politicaPrivacidadeResumo}
              confirmado={campos.aceite_privacidade}
              onConfirmar={() => atualizarCampo("aceite_privacidade", true)}
            />

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

function LeituraObrigatoria({
  titulo,
  href,
  itens,
  confirmado,
  onConfirmar,
}: {
  titulo: string;
  href: string;
  itens: string[];
  confirmado: boolean;
  onConfirmar: () => void;
}) {
  const [rolagemCompleta, setRolagemCompleta] = useState(false);

  function verificarRolagem(event: React.UIEvent<HTMLDivElement>) {
    const elemento = event.currentTarget;
    const chegouAoFim =
      elemento.scrollTop + elemento.clientHeight >= elemento.scrollHeight - 8;

    if (chegouAoFim) {
      setRolagemCompleta(true);
    }
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">{titulo}</h2>
          <Link href={href} className="text-xs font-semibold text-blue-600">
            Abrir documento completo
          </Link>
        </div>
        <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-600">
          {confirmado ? "Leitura confirmada" : "Leitura obrigatória"}
        </span>
      </div>

      <div
        onScroll={verificarRolagem}
        className="mt-3 max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-sm leading-6 text-gray-700"
      >
        {itens.map((item) => (
          <p key={item} className="mb-3 last:mb-0">
            {item}
          </p>
        ))}
      </div>

      {rolagemCompleta && !confirmado && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
          Leitura concluída. Confirme para prosseguir com a solicitação.
        </div>
      )}

      <button
        type="button"
        disabled={!rolagemCompleta || confirmado}
        onClick={onConfirmar}
        className="mt-3 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {confirmado ? "Confirmado" : "Confirmar leitura"}
      </button>
    </section>
  );
}

function CampoTexto({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  autoComplete?: string;
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
        autoComplete={autoComplete ?? (type === "password" ? "new-password" : undefined)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </div>
  );
}
