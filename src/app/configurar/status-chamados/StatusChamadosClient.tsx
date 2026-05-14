"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { STATUS_CHAMADOS_PAGE_VERSION } from "@/config/version";
import {
  excluirStatusChamado,
  salvarStatusChamado,
} from "../catalogos-actions";

export type StatusChamadoListItem = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  cor: string | null;
  ordem: number | null;
  ativo: boolean;
  eh_padrao: boolean | null;
  referencias: number;
};

type Props = {
  itens: StatusChamadoListItem[];
  erroCarregamento?: string | null;
};

type DraftStatus = {
  nome: string;
  descricao: string;
  cor: string;
  ordem: number;
  ativo: boolean;
  eh_padrao: boolean;
};

const NOVO_STATUS_INICIAL: DraftStatus = {
  nome: "",
  descricao: "",
  cor: "#2563eb",
  ordem: 0,
  ativo: true,
  eh_padrao: false,
};

type DraftTouched = {
  nome: boolean;
  descricao: boolean;
  cor: boolean;
  ordem: boolean;
};

const CAMPOS_OBRIGATORIOS_INICIAIS: DraftTouched = {
  nome: false,
  descricao: false,
  cor: false,
  ordem: false,
};

function normalizarCodigoPreview(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function CampoTexto({
  label,
  value,
  onChange,
  onBlur,
  placeholder,
  readOnly = false,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      {label}
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        readOnly={readOnly}
        className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900 read-only:bg-gray-100 read-only:text-gray-500"
      />
    </label>
  );
}

function CampoCor({
  value,
  onChange,
  onBlur,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}) {
  return (
    <label className="block text-sm font-semibold text-gray-700">
      Cor
      <div className="mt-1 flex h-10 items-center gap-3 rounded-lg border border-gray-300 bg-white px-3">
        <label className="relative block h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-full border border-gray-300 ring-1 ring-white/80">
          <span
            className="block h-full w-full rounded-full"
            style={{ backgroundColor: value }}
            aria-hidden="true"
          />
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onBlur={onBlur}
            className="absolute inset-0 cursor-pointer opacity-0"
            aria-label="Selecionar cor do status"
          />
        </label>
        <span className="text-sm font-medium text-gray-600">{value}</span>
      </div>
    </label>
  );
}

function CampoOrdem({
  value,
  onChange,
  onBlur,
}: {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
}) {
  return (
    <label className="block w-24 text-sm font-semibold text-gray-700">
      Ordem
      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        onBlur={onBlur}
        className="mt-1 min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-normal text-gray-900"
      />
    </label>
  );
}

function statusTemCamposObrigatorios(draft: DraftStatus) {
  return (
    draft.nome.trim().length > 0 &&
    draft.descricao.trim().length > 0 &&
    draft.cor.trim().length > 0 &&
    Number.isFinite(draft.ordem)
  );
}

function NovoStatusForm() {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftStatus>(NOVO_STATUS_INICIAL);
  const [touched, setTouched] = useState<DraftTouched>(CAMPOS_OBRIGATORIOS_INICIAIS);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const savingRef = useRef(false);

  const codigoPreview = useMemo(
    () => normalizarCodigoPreview(draft.nome) || "status_automatico",
    [draft.nome]
  );

  function marcarCampo(campo: keyof DraftTouched) {
    setTouched((atual) => ({ ...atual, [campo]: true }));
  }

  function salvarNovoStatusSeValido(campoAtual: keyof DraftTouched) {
    if (savingRef.current) {
      return;
    }

    const proximoTouched = { ...touched, [campoAtual]: true };

    if (!Object.values(proximoTouched).every(Boolean)) {
      return;
    }

    if (!statusTemCamposObrigatorios(draft)) {
      setMensagem(null);
      setErro("Preencha todos os campos obrigatórios antes de salvar.");
      return;
    }

    startTransition(async () => {
      savingRef.current = true;

      try {
        const resultado = await salvarStatusChamado(draft);

        if (!resultado.ok) {
          setErro(resultado.error);
          setMensagem(null);
          return;
        }

        setErro(null);
        setMensagem(resultado.message ?? "Status salvo automaticamente.");
        setDraft(NOVO_STATUS_INICIAL);
        setTouched(CAMPOS_OBRIGATORIOS_INICIAIS);
        router.refresh();
      } catch {
        setErro("Não foi possível salvar o status.");
        setMensagem(null);
      } finally {
        savingRef.current = false;
      }
    });
  }

  return (
    <section className="mb-6 rounded-xl bg-white p-5 shadow">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-950">Novo item</h2>
          <p className="mt-1 text-sm text-gray-600">
            O status novo é salvo automaticamente ao sair do último campo obrigatório preenchido.
          </p>
        </div>
        <span className="text-xs font-semibold text-gray-500">
          {isPending ? "Salvando..." : mensagem ?? "Autosave ativo"}
        </span>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[1.2fr_1.4fr_1.4fr_1fr_auto]">
        <CampoTexto label="Código" value={codigoPreview} readOnly />
        <CampoTexto
          label="Nome"
          value={draft.nome}
          onChange={(nome) => {
            setErro(null);
            setMensagem(null);
            setDraft((atual) => ({ ...atual, nome }));
          }}
          onBlur={() => {
            marcarCampo("nome");
            salvarNovoStatusSeValido("nome");
          }}
          placeholder="Pendente de agendamento"
        />
        <CampoTexto
          label="Descrição"
          value={draft.descricao}
          onChange={(descricao) => {
            setErro(null);
            setMensagem(null);
            setDraft((atual) => ({ ...atual, descricao }));
          }}
          onBlur={() => {
            marcarCampo("descricao");
            salvarNovoStatusSeValido("descricao");
          }}
        />
        <CampoCor
          value={draft.cor}
          onChange={(cor) => {
            setErro(null);
            setMensagem(null);
            setDraft((atual) => ({ ...atual, cor }));
          }}
          onBlur={() => {
            marcarCampo("cor");
            salvarNovoStatusSeValido("cor");
          }}
        />
        <CampoOrdem
          value={draft.ordem}
          onChange={(ordem) => {
            setErro(null);
            setMensagem(null);
            setDraft((atual) => ({ ...atual, ordem }));
          }}
          onBlur={() => {
            marcarCampo("ordem");
            salvarNovoStatusSeValido("ordem");
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={draft.ativo}
            onChange={(event) => {
              setErro(null);
              setMensagem(null);
              setDraft((atual) => ({ ...atual, ativo: event.target.checked }));
            }}
          />
          Ativo
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={draft.eh_padrao}
            onChange={(event) => {
              setErro(null);
              setMensagem(null);
              setDraft((atual) => ({ ...atual, eh_padrao: event.target.checked }));
            }}
          />
          Padrão
        </label>
        {erro ? <span className="text-sm font-semibold text-red-600">{erro}</span> : null}
      </div>
    </section>
  );
}

function StatusRow({ item }: { item: StatusChamadoListItem }) {
  const router = useRouter();
  const [draft, setDraft] = useState<DraftStatus>({
    nome: item.nome,
    descricao: item.descricao ?? "",
    cor: item.cor ?? "#2563eb",
    ordem: item.ordem ?? 0,
    ativo: item.ativo,
    eh_padrao: Boolean(item.eh_padrao),
  });
  const [statusTexto, setStatusTexto] = useState<string>("Autosave ativo");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const savingRef = useRef(false);

  function salvarLinhaSeValida() {
    if (savingRef.current) {
      return;
    }

    if (!statusTemCamposObrigatorios(draft)) {
      setErro("Preencha todos os campos obrigatórios antes de salvar.");
      setStatusTexto("Campos obrigatórios pendentes");
      return;
    }

    startTransition(async () => {
      savingRef.current = true;

      try {
        const resultado = await salvarStatusChamado({
          id: item.id,
          ...draft,
        });

        if (!resultado.ok) {
          setErro(resultado.error);
          setStatusTexto("Falha ao salvar");
          return;
        }

        setErro(null);
        setStatusTexto(resultado.message ?? "Salvo automaticamente");
      } catch {
        setErro("Não foi possível salvar o status.");
        setStatusTexto("Falha ao salvar");
      } finally {
        savingRef.current = false;
      }
    });
  }

  const podeExcluir = item.referencias === 0 && !item.eh_padrao;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="grid gap-3 md:grid-cols-[1.2fr_1.4fr_1.4fr_1fr_auto]">
        <CampoTexto label="Código" value={item.codigo} readOnly />
        <CampoTexto
          label="Nome"
          value={draft.nome}
          onChange={(nome) => {
            setErro(nome.trim() ? null : "Nome é obrigatório.");
            setStatusTexto("Alterações pendentes...");
            setDraft((atual) => ({ ...atual, nome }));
          }}
          onBlur={salvarLinhaSeValida}
        />
        <CampoTexto
          label="Descrição"
          value={draft.descricao}
          onChange={(descricao) => {
            setErro(null);
            setStatusTexto("Alterações pendentes...");
            setDraft((atual) => ({ ...atual, descricao }));
          }}
          onBlur={salvarLinhaSeValida}
        />
        <CampoCor
          value={draft.cor}
          onChange={(cor) => {
            setErro(null);
            setStatusTexto("Alterações pendentes...");
            setDraft((atual) => ({ ...atual, cor }));
          }}
          onBlur={salvarLinhaSeValida}
        />
        <CampoOrdem
          value={draft.ordem}
          onChange={(ordem) => {
            setErro(null);
            setStatusTexto("Alterações pendentes...");
            setDraft((atual) => ({ ...atual, ordem }));
          }}
          onBlur={salvarLinhaSeValida}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-5">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={draft.ativo}
            onChange={(event) => {
              setErro(null);
              setStatusTexto("Alterações pendentes...");
              setDraft((atual) => ({ ...atual, ativo: event.target.checked }));
            }}
          />
          Ativo
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <input
            type="checkbox"
            checked={draft.eh_padrao}
            onChange={(event) => {
              setErro(null);
              setStatusTexto("Alterações pendentes...");
              setDraft((atual) => ({ ...atual, eh_padrao: event.target.checked }));
            }}
          />
          Padrão
        </label>
        <span className="text-xs font-semibold text-gray-500">
          {isPending ? "Salvando..." : statusTexto}
        </span>
        <button
          type="button"
          disabled={!podeExcluir || isDeleting}
          onClick={() =>
            startDeleteTransition(async () => {
              const resultado = await excluirStatusChamado(item.id);

              if (!resultado.ok) {
                setErro(resultado.error);
                return;
              }

              setErro(null);
              router.refresh();
            })
          }
          className="min-h-10 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
          title={
            item.eh_padrao
              ? "O status padrão não pode ser excluído."
              : item.referencias > 0
                ? "Esse status já está relacionado a chamados ou histórico."
                : "Excluir status"
          }
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </button>
        {item.referencias > 0 ? (
          <span className="text-xs font-semibold text-amber-700">
            {item.referencias} relacionamento(s) impedem a exclusão.
          </span>
        ) : null}
        {erro ? <span className="text-sm font-semibold text-red-600">{erro}</span> : null}
      </div>
    </div>
  );
}

export function StatusChamadosClient({ itens, erroCarregamento }: Props) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-10 md:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/chamados/novo" className="text-sm font-semibold text-blue-600">
            Voltar para novo chamado
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-gray-950">Status de chamados</h1>
          <p className="mt-2 max-w-3xl text-sm text-gray-600">
            Cadastro operacional dos status usados no ciclo de vida dos chamados.
          </p>
        </div>
        <span className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
          Tela v{STATUS_CHAMADOS_PAGE_VERSION.replace(/^v/, "")}
        </span>
      </div>

      {erroCarregamento ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erroCarregamento}
        </div>
      ) : null}

      <NovoStatusForm />

      <section className="rounded-xl bg-white p-5 shadow">
        <h2 className="text-lg font-bold text-gray-950">Registros</h2>
        <div className="mt-4 space-y-3">
          {itens.map((item) => (
            <StatusRow key={item.id} item={item} />
          ))}

          {itens.length === 0 ? (
            <p className="rounded-lg border border-gray-200 p-4 text-sm text-gray-600">
              Nenhum registro cadastrado.
            </p>
          ) : null}
        </div>
      </section>
    </section>
  );
}
