"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useId,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  excluirStatusChamado,
  salvarStatusChamado,
} from "../catalogos-actions";
import {
  CatalogoPaginacao,
  OPCOES_CATALOGOS_ITENS_POR_PAGINA,
} from "../CatalogoConfiguracaoClient";

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

type DraftTouched = {
  nome: boolean;
  descricao: boolean;
  cor: boolean;
  ordem: boolean;
};

type FiltrosStatus = {
  codigo: string;
  nome: string;
  descricao: string;
  cor: string;
  ativo: "todos" | "ativos" | "inativos";
  padrao: "todos" | "padrao" | "nao_padrao";
  vinculo: "todos" | "com_vinculo" | "sem_vinculo";
};

const NOVO_STATUS_INICIAL: DraftStatus = {
  nome: "",
  descricao: "",
  cor: "#2563eb",
  ordem: 0,
  ativo: true,
  eh_padrao: false,
};

const CAMPOS_OBRIGATORIOS_INICIAIS: DraftTouched = {
  nome: false,
  descricao: false,
  cor: false,
  ordem: false,
};

const FILTROS_INICIAIS: FiltrosStatus = {
  codigo: "",
  nome: "",
  descricao: "",
  cor: "",
  ativo: "todos",
  padrao: "todos",
  vinculo: "todos",
};

const labelClass =
  "block text-[11px] font-semibold uppercase tracking-wide text-gray-500";
const inputClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 read-only:bg-gray-100 read-only:text-gray-500";
const selectClass =
  "mt-1 min-h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-950 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100";

function normalizarCodigoPreview(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function statusTemCamposObrigatorios(draft: DraftStatus) {
  return (
    draft.nome.trim().length > 0 &&
    draft.descricao.trim().length > 0 &&
    draft.cor.trim().length > 0 &&
    Number.isFinite(draft.ordem)
  );
}

function draftsIguais(a: DraftStatus, b: DraftStatus) {
  return (
    a.nome === b.nome &&
    a.descricao === b.descricao &&
    a.cor === b.cor &&
    a.ordem === b.ordem &&
    a.ativo === b.ativo &&
    a.eh_padrao === b.eh_padrao
  );
}

function textoFiltro(valor: string | number | null | undefined) {
  return String(valor ?? "").trim().toLowerCase();
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
    <label className={labelClass}>
      {label}
      <input
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        readOnly={readOnly}
        className={inputClass}
      />
    </label>
  );
}

function CampoFiltroTexto({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

function CampoFiltroSelecao({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <label className={labelClass}>
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={selectClass}
      >
        {children}
      </select>
    </label>
  );
}

function CampoFiltroCor({
  label,
  value,
  onChange,
  opcoes,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  opcoes: Array<{ value: string; label: string }>;
}) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [aberto, setAberto] = useState(false);
  const corSelecionada = value.trim();
  const mostrarSwatch = corSelecionada.length > 0;
  const opcaoSelecionada =
    opcoes.find((opcao) => opcao.value === value) ??
    opcoes.find((opcao) => opcao.value === "") ??
    opcoes[0];

  useEffect(() => {
    if (!aberto) {
      return;
    }

    function handleClickFora(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setAberto(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAberto(false);
      }
    }

    document.addEventListener("mousedown", handleClickFora);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickFora);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [aberto]);

  return (
    <label className={labelClass}>
      {label}
      <div
        ref={containerRef}
        className="relative mt-1 flex min-h-9 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100"
      >
        <span
          className={`h-5 w-5 shrink-0 rounded-full border ${
            mostrarSwatch ? "border-gray-300 ring-1 ring-white" : "border-dashed border-gray-400"
          }`}
          style={mostrarSwatch ? { backgroundColor: corSelecionada } : undefined}
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={() => setAberto((atual) => !atual)}
          aria-haspopup="listbox"
          aria-expanded={aberto}
          aria-controls={listboxId}
          className="flex min-h-9 w-full items-center justify-between gap-2 bg-transparent py-2 text-left text-sm font-medium text-gray-950 outline-none"
        >
          <span className="truncate">{opcaoSelecionada?.label ?? "Todas"}</span>
          <span aria-hidden="true" className="text-xs text-gray-500">
            ▾
          </span>
        </button>

        {aberto ? (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-64 overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {opcoes.map((opcao) => {
              const temCor = opcao.value.startsWith("#");
              const selecionada = opcao.value === value;

              return (
                <li key={opcao.value || "todas"} role="option" aria-selected={selecionada}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opcao.value);
                      setAberto(false);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      selecionada
                        ? "bg-blue-600 text-white"
                        : "text-gray-900 transition hover:bg-gray-100"
                    }`}
                  >
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full border ${
                        temCor ? "border-gray-300" : "border-transparent"
                      }`}
                      style={temCor ? { backgroundColor: opcao.value } : undefined}
                      aria-hidden="true"
                    />
                    <span className="truncate">{opcao.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
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
    <label className={labelClass}>
      Cor
      <div className="mt-1 flex min-h-9 items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 transition focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100">
        <label className="relative block h-6 w-6 shrink-0 cursor-pointer overflow-hidden rounded-full border border-gray-300 ring-1 ring-white">
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
        <span className="min-w-0 truncate font-mono text-xs font-semibold normal-case tracking-normal text-gray-700">
          {value}
        </span>
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
    <label className={labelClass}>
      Ordem
      <input
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        onBlur={onBlur}
        className={inputClass}
      />
    </label>
  );
}

function CampoBooleano({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-9 items-center justify-between gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 text-xs font-semibold text-gray-700">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
      />
    </label>
  );
}

function AutosaveStatus({
  isPending,
  texto,
}: {
  isPending: boolean;
  texto: string;
}) {
  const label = isPending ? "Salvando..." : texto;

  return (
    <span className="inline-flex min-h-7 w-fit items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 text-xs font-semibold text-blue-700">
      <span className="h-1.5 w-1.5 rounded-full bg-blue-500" aria-hidden="true" />
      {label}
    </span>
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
    <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-950">Novo item</h2>
          <p className="mt-1 text-xs text-gray-600">
            Preencha os campos obrigatórios. O salvamento acontece ao sair do último campo.
          </p>
        </div>
        <AutosaveStatus isPending={isPending} texto={mensagem ?? "Autosave ativo"} />
      </div>

      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-[1.1fr_1.25fr_2fr_1fr_0.8fr]">
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
          placeholder="Descreva o uso operacional deste status"
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

      <div className="grid gap-3 border-t border-gray-100 px-4 py-3 sm:grid-cols-2 lg:grid-cols-[160px_160px_1fr]">
        <CampoBooleano
          label="Ativo"
          checked={draft.ativo}
          onChange={(ativo) => {
            setErro(null);
            setMensagem(null);
            setDraft((atual) => ({ ...atual, ativo }));
          }}
        />
        <CampoBooleano
          label="Padrão"
          checked={draft.eh_padrao}
          onChange={(eh_padrao) => {
            setErro(null);
            setMensagem(null);
            setDraft((atual) => ({ ...atual, eh_padrao }));
          }}
        />
        {erro ? (
          <span className="self-center text-sm font-semibold text-red-600">{erro}</span>
        ) : null}
      </div>
    </section>
  );
}

function StatusRow({ item }: { item: StatusChamadoListItem }) {
  const router = useRouter();
  const itemDraft = useMemo<DraftStatus>(() => ({
    nome: item.nome,
    descricao: item.descricao ?? "",
    cor: item.cor ?? "#2563eb",
    ordem: item.ordem ?? 0,
    ativo: item.ativo,
    eh_padrao: Boolean(item.eh_padrao),
  }), [item.ativo, item.cor, item.descricao, item.eh_padrao, item.nome, item.ordem]);
  const [draft, setDraft] = useState<DraftStatus>(itemDraft);
  const [statusTexto, setStatusTexto] = useState<string>("Autosave ativo");
  const [erro, setErro] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const savingRef = useRef(false);
  const draftNaFilaRef = useRef<DraftStatus | null>(null);
  const ultimoSalvoRef = useRef<DraftStatus>(itemDraft);
  const sincronizacaoInicialRef = useRef(true);

  useEffect(() => {
    if (sincronizacaoInicialRef.current) {
      sincronizacaoInicialRef.current = false;
      return;
    }

    setDraft(itemDraft);
    ultimoSalvoRef.current = itemDraft;
    draftNaFilaRef.current = null;
    setErro(null);

    if (!savingRef.current) {
      setStatusTexto("Salvo automaticamente");
    }
  }, [itemDraft]);

  function processarFila() {
    if (savingRef.current || !draftNaFilaRef.current) {
      return;
    }

    startTransition(async () => {
      savingRef.current = true;
      setStatusTexto("Salvando...");

      try {
        while (draftNaFilaRef.current) {
          const draftAtual = draftNaFilaRef.current;
          draftNaFilaRef.current = null;

          const resultado = await salvarStatusChamado({
            id: item.id,
            ...draftAtual,
          });

          if (!resultado.ok) {
            setErro(resultado.error);
            setStatusTexto("Falha ao salvar");
            return;
          }

          setErro(null);
          ultimoSalvoRef.current = draftAtual;
          setStatusTexto(resultado.message ?? "Salvo automaticamente");
          router.refresh();
        }
      } catch {
        setErro("Não foi possível salvar o status.");
        setStatusTexto("Falha ao salvar");
      } finally {
        savingRef.current = false;

        if (draftNaFilaRef.current) {
          processarFila();
        }
      }
    });
  }

  function salvarLinhaSeValida(draftAtual: DraftStatus = draft) {
    if (!statusTemCamposObrigatorios(draftAtual)) {
      setErro("Preencha todos os campos obrigatórios antes de salvar.");
      setStatusTexto("Campos obrigatórios pendentes");
      return;
    }

    if (!savingRef.current && draftsIguais(ultimoSalvoRef.current, draftAtual)) {
      setStatusTexto("Salvo automaticamente");
      return;
    }

    draftNaFilaRef.current = draftAtual;
    setStatusTexto("Alterações pendentes...");
    processarFila();
  }

  const podeExcluir = item.referencias === 0 && !item.eh_padrao;
  const tituloExclusao = item.eh_padrao
    ? "O status padrão não pode ser excluído."
    : item.referencias > 0
      ? "Esse status já está relacionado a chamados ou histórico."
      : "Excluir status";

  return (
    <article className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div
        className="h-1 w-full"
        style={{ backgroundColor: draft.cor || "#2563eb" }}
        aria-hidden="true"
      />

      <div className="grid gap-3 p-4 lg:grid-cols-[1.05fr_1.2fr_2fr_0.95fr_0.7fr]">
        <CampoTexto label="Código" value={item.codigo} readOnly />
        <CampoTexto
          label="Nome"
          value={draft.nome}
          onChange={(nome) => {
            setErro(nome.trim() ? null : "Nome é obrigatório.");
            setStatusTexto("Alterações pendentes...");
            setDraft((atual) => ({ ...atual, nome }));
          }}
          onBlur={() => salvarLinhaSeValida()}
        />
        <CampoTexto
          label="Descrição"
          value={draft.descricao}
          onChange={(descricao) => {
            setErro(null);
            setStatusTexto("Alterações pendentes...");
            setDraft((atual) => ({ ...atual, descricao }));
          }}
          onBlur={() => salvarLinhaSeValida()}
        />
        <CampoCor
          value={draft.cor}
          onChange={(cor) => {
            setErro(null);
            setStatusTexto("Alterações pendentes...");
            setDraft((atual) => ({ ...atual, cor }));
          }}
          onBlur={() => salvarLinhaSeValida()}
        />
        <CampoOrdem
          value={draft.ordem}
          onChange={(ordem) => {
            setErro(null);
            setStatusTexto("Alterações pendentes...");
            setDraft((atual) => ({ ...atual, ordem }));
          }}
          onBlur={() => salvarLinhaSeValida()}
        />
      </div>

      <div className="grid gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 md:grid-cols-2 lg:grid-cols-[130px_130px_150px_1fr_auto] lg:items-center">
        <CampoBooleano
          label="Ativo"
          checked={draft.ativo}
          onChange={(ativo) => {
            const proximoDraft = { ...draft, ativo };
            setErro(null);
            setStatusTexto("Alterações pendentes...");
            setDraft(proximoDraft);
            salvarLinhaSeValida(proximoDraft);
          }}
        />
        <CampoBooleano
          label="Padrão"
          checked={draft.eh_padrao}
          onChange={(eh_padrao) => {
            const proximoDraft = { ...draft, eh_padrao };
            setErro(null);
            setStatusTexto("Alterações pendentes...");
            setDraft(proximoDraft);
            salvarLinhaSeValida(proximoDraft);
          }}
        />
        <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
          <span className="block text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Referências
          </span>
          <span className="text-sm font-bold text-gray-950">{item.referencias}</span>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <AutosaveStatus isPending={isPending} texto={statusTexto} />
          {item.referencias > 0 ? (
            <span className="text-xs font-semibold text-amber-700">
              {item.referencias} relacionamento(s) impedem a exclusão.
            </span>
          ) : null}
          {erro ? <span className="text-sm font-semibold text-red-600">{erro}</span> : null}
        </div>
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
          className="min-h-9 rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
          title={tituloExclusao}
        >
          {isDeleting ? "Excluindo..." : "Excluir"}
        </button>
      </div>
    </article>
  );
}

export function StatusChamadosClient({ itens, erroCarregamento }: Props) {
  const [filtros, setFiltros] = useState<FiltrosStatus>(FILTROS_INICIAIS);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const vinculados = itens.filter((item) => item.referencias > 0).length;
  const itensFiltrados = useMemo(
    () =>
      itens.filter((item) => {
        const codigoMatch = textoFiltro(item.codigo).includes(textoFiltro(filtros.codigo));
        const nomeMatch = textoFiltro(item.nome).includes(textoFiltro(filtros.nome));
        const descricaoMatch = textoFiltro(item.descricao).includes(
          textoFiltro(filtros.descricao)
        );
        const corMatch = textoFiltro(item.cor).includes(textoFiltro(filtros.cor));
        const ativoMatch =
          filtros.ativo === "todos" ||
          (filtros.ativo === "ativos" && item.ativo) ||
          (filtros.ativo === "inativos" && !item.ativo);
        const padraoMatch =
          filtros.padrao === "todos" ||
          (filtros.padrao === "padrao" && Boolean(item.eh_padrao)) ||
          (filtros.padrao === "nao_padrao" && !item.eh_padrao);
        const vinculoMatch =
          filtros.vinculo === "todos" ||
          (filtros.vinculo === "com_vinculo" && item.referencias > 0) ||
          (filtros.vinculo === "sem_vinculo" && item.referencias === 0);

        return (
          codigoMatch &&
          nomeMatch &&
          descricaoMatch &&
          corMatch &&
          ativoMatch &&
          padraoMatch &&
          vinculoMatch
        );
      }),
    [filtros, itens]
  );
  const opcoesCor = useMemo(() => {
    const cores = Array.from(
      new Set(
        itens
          .map((item) => (item.cor ?? "").trim().toLowerCase())
          .filter((cor) => cor.length > 0)
      )
    );

    return cores.sort((a, b) => a.localeCompare(b));
  }, [itens]);
  const opcoesFiltroCor = useMemo(
    () => [{ value: "", label: "Todas" }, ...opcoesCor.map((cor) => ({ value: cor, label: cor }))],
    [opcoesCor]
  );
  const totalPaginas = Math.max(1, Math.ceil(itensFiltrados.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const itensPaginados = itensFiltrados.slice(
    inicioPagina,
    inicioPagina + itensPorPagina
  );
  const primeiroItemVisivel =
    itensFiltrados.length === 0 ? 0 : inicioPagina + 1;
  const ultimoItemVisivel = Math.min(inicioPagina + itensPorPagina, itensFiltrados.length);

  function atualizarFiltro<K extends keyof FiltrosStatus>(
    campo: K,
    valor: FiltrosStatus[K]
  ) {
    setFiltros((atuais) => ({ ...atuais, [campo]: valor }));
    setPaginaAtual(1);
  }

  function limparFiltros() {
    setFiltros(FILTROS_INICIAIS);
    setPaginaAtual(1);
  }

  return (
    <section className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 sm:px-6 md:px-8">
      <div className="mb-4 flex flex-col gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <Link href="/chamados/novo" className="text-xs font-semibold text-blue-600">
            Voltar para novo chamado
          </Link>
          <h1 className="mt-1 text-xl font-bold text-gray-950 sm:text-2xl">
            Status de chamados
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-gray-600">
            Cadastro operacional dos status usados no ciclo de vida dos chamados.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-2 text-xs lg:min-w-[120px]">
          <span className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 font-semibold text-gray-700">
            Total: {itens.length}
          </span>
        </div>
      </div>

      {erroCarregamento ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
          {erroCarregamento}
        </div>
      ) : null}

      <div className="space-y-4">
        <NovoStatusForm />

        <section className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-950">Registros</h2>
              <p className="mt-1 text-xs text-gray-600">
                Filtre, pagine e edite os status sem ocultar campos operacionais.
              </p>
              <p className="mt-1 text-xs font-semibold text-amber-700">
                Apenas um status pode ficar marcado como Padrão. Ao marcar outro
                registro, o padrão anterior é desmarcado automaticamente no salvamento.
              </p>
            </div>
            <span className="w-fit rounded-full border border-amber-100 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {vinculados} com vínculo operacional
            </span>
          </div>

          <div className="border-b border-gray-100 bg-white p-3 sm:p-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.1fr_1.6fr_0.9fr_0.9fr_0.9fr_1fr_auto] xl:items-end">
              <CampoFiltroTexto
                label="Código"
                value={filtros.codigo}
                onChange={(valor) => atualizarFiltro("codigo", valor)}
                placeholder="Filtrar código"
              />
              <CampoFiltroTexto
                label="Nome"
                value={filtros.nome}
                onChange={(valor) => atualizarFiltro("nome", valor)}
                placeholder="Filtrar nome"
              />
              <CampoFiltroTexto
                label="Descrição"
                value={filtros.descricao}
                onChange={(valor) => atualizarFiltro("descricao", valor)}
                placeholder="Filtrar descrição"
              />
              <CampoFiltroCor
                label="Cor"
                value={filtros.cor}
                onChange={(valor) => atualizarFiltro("cor", valor)}
                opcoes={opcoesFiltroCor}
              />
              <CampoFiltroSelecao
                label="Ativo"
                value={filtros.ativo}
                onChange={(valor) =>
                  atualizarFiltro("ativo", valor as FiltrosStatus["ativo"])
                }
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="inativos">Inativos</option>
              </CampoFiltroSelecao>
              <CampoFiltroSelecao
                label="Padrão"
                value={filtros.padrao}
                onChange={(valor) =>
                  atualizarFiltro("padrao", valor as FiltrosStatus["padrao"])
                }
              >
                <option value="todos">Todos</option>
                <option value="padrao">Padrão</option>
                <option value="nao_padrao">Não padrão</option>
              </CampoFiltroSelecao>
              <CampoFiltroSelecao
                label="Referências"
                value={filtros.vinculo}
                onChange={(valor) =>
                  atualizarFiltro("vinculo", valor as FiltrosStatus["vinculo"])
                }
              >
                <option value="todos">Todos</option>
                <option value="com_vinculo">Com vínculo</option>
                <option value="sem_vinculo">Sem vínculo</option>
              </CampoFiltroSelecao>
              <button
                type="button"
                onClick={limparFiltros}
                className="min-h-9 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:bg-white"
              >
                Limpar
              </button>
            </div>
            <div className="mt-3 hidden rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 lg:grid lg:grid-cols-[1.05fr_1.2fr_2fr_0.95fr_0.7fr]">
              <span>Código</span>
              <span>Nome</span>
              <span>Descrição</span>
              <span>Cor</span>
              <span>Ordem</span>
            </div>
          </div>

          <div className="space-y-3 bg-gray-50 p-3 sm:p-4">
            {itensPaginados.map((item) => (
              <StatusRow key={item.id} item={item} />
            ))}

            {itens.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                Nenhum registro cadastrado.
              </p>
            ) : null}

            {itens.length > 0 && itensFiltrados.length === 0 ? (
              <p className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                Nenhum registro encontrado com os filtros aplicados.
              </p>
            ) : null}
          </div>

          <CatalogoPaginacao
            primeiroItemVisivel={primeiroItemVisivel}
            ultimoItemVisivel={ultimoItemVisivel}
            totalItens={itensFiltrados.length}
            itensPorPagina={itensPorPagina}
            opcoesItensPorPagina={OPCOES_CATALOGOS_ITENS_POR_PAGINA}
            paginaAtual={paginaSegura}
            totalPaginas={totalPaginas}
            onItensPorPaginaChange={(value) => {
              setItensPorPagina(value);
              setPaginaAtual(1);
            }}
            onPaginaChange={setPaginaAtual}
          />
        </section>
      </div>
    </section>
  );
}
