"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { PapelUsuario, PerfilAutenticado } from "@/lib/auth/types";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ativosPorCategoria,
  categoriaChamadoOpcoes,
  type CategoriaChamado,
  getPrioridadeClass,
  getPrioridadeLabel,
} from "../chamadoVisual";
import {
  carregarDadosNovoChamado,
  criarBaseConhecimento,
  criarChamadoIdentificacao,
  criarFilialOrganizacao,
  criarGrupoAtendimento,
  criarOrigemChamado,
  criarOrganizacao,
  criarTipoChamado,
  type BaseConhecimentoItem,
  type CatalogoItem,
  type ClienteItem,
  type LojaItem,
  type MutationResult,
  type NovoChamadoDados,
  type PerfilItem,
} from "./actions";

type Impacto = "baixo" | "medio" | "alto";
type Urgencia = "baixa" | "media" | "alta";
type Prioridade = "baixa" | "media" | "alta" | "critica";
type InlineTipo =
  | "tipo"
  | "origem"
  | "organizacao"
  | "filial"
  | "grupo"
  | "base";

type UsuarioOperacional = {
  id: string;
  nome: string;
  papel: PapelUsuario;
};

type Opcao<T extends string> = {
  value: T;
  label: string;
};

type AnexoEvidencia = {
  chamado_id: string;
  usuario_id: string;
  arquivo_url: string;
  tipo_arquivo: string;
  legenda: string;
  enviado_em: string;
};

const EVIDENCIAS_BUCKET = "evidencias-chamados";

const impactos: Opcao<Impacto>[] = [
  { value: "baixo", label: "Baixo" },
  { value: "medio", label: "Médio" },
  { value: "alto", label: "Alto" },
];

const urgencias: Opcao<Urgencia>[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

const matrizPrioridade: Record<Impacto, Record<Urgencia, Prioridade>> = {
  alto: {
    alta: "critica",
    media: "alta",
    baixa: "media",
  },
  medio: {
    alta: "alta",
    media: "media",
    baixa: "media",
  },
  baixo: {
    alta: "media",
    media: "baixa",
    baixa: "baixa",
  },
};

const extensoesAceitas = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "mp3",
  "wav",
  "m4a",
  "ogg",
  "pdf",
  "txt",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "csv",
]);

const acceptEvidencias = [
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".mp3",
  ".wav",
  ".m4a",
  ".ogg",
  ".pdf",
  ".txt",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
].join(",");

const dadosIniciais: NovoChamadoDados = {
  tipos: [],
  origens: [],
  grupos: [],
  bases: [],
  clientes: [],
  lojas: [],
  perfis: [],
};

function obterExtensao(nomeArquivo: string) {
  return nomeArquivo.split(".").pop()?.toLowerCase() ?? "";
}

function obterTipoArquivo(file: File) {
  const extensao = obterExtensao(file.name);

  if (["jpg", "jpeg", "png", "webp"].includes(extensao)) {
    return "imagem";
  }

  if (["mp3", "wav", "m4a", "ogg"].includes(extensao)) {
    return "audio";
  }

  return "documento";
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

function normalizarPapel(papel: string): PapelUsuario | null {
  if (
    papel === "admin" ||
    papel === "super_admin" ||
    papel === "gestor" ||
    papel === "operador" ||
    papel === "analista" ||
    papel === "tecnico" ||
    papel === "cliente" ||
    papel === "solicitante"
  ) {
    return papel;
  }

  return null;
}

function podeAtribuirResponsaveis(papel: PapelUsuario | undefined) {
  return (
    papel === "super_admin" ||
    papel === "admin" ||
    papel === "gestor" ||
    papel === "analista"
  );
}

function podeCriarCatalogo(papel: PapelUsuario | undefined) {
  return (
    papel === "super_admin" ||
    papel === "admin" ||
    papel === "gestor" ||
    papel === "analista"
  );
}

function montarUsuariosOperacionais(perfis: PerfilItem[]) {
  const usuarios: UsuarioOperacional[] = [];

  for (const perfil of perfis) {
    const papel = normalizarPapel(perfil.papel);

    if (!papel || usuarios.some((usuario) => usuario.id === perfil.id)) {
      continue;
    }

    usuarios.push({
      id: perfil.id,
      nome: perfil.nome_completo,
      papel,
    });
  }

  return usuarios;
}

export function calcularPrioridade(impacto: Impacto, urgencia: Urgencia) {
  return matrizPrioridade[impacto][urgencia];
}

function useEvidenciasChamado(onErroChange: (erro: string) => void) {
  const [evidencias, setEvidencias] = useState<File[]>([]);
  const [arrastando, setArrastando] = useState(false);

  function adicionarEvidencias(arquivos: File[]) {
    const arquivoInvalido = arquivos.find(
      (arquivo) => !extensoesAceitas.has(obterExtensao(arquivo.name))
    );

    if (arquivoInvalido) {
      onErroChange(`Arquivo não permitido: ${arquivoInvalido.name}.`);
      return;
    }

    onErroChange("");
    setEvidencias((evidenciasAtuais) => {
      const chavesAtuais = new Set(
        evidenciasAtuais.map(
          (arquivo) => `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`
        )
      );
      const novosArquivos = arquivos.filter(
        (arquivo) =>
          !chavesAtuais.has(
            `${arquivo.name}-${arquivo.size}-${arquivo.lastModified}`
          )
      );

      return [...evidenciasAtuais, ...novosArquivos];
    });
  }

  function selecionarEvidencias(event: React.ChangeEvent<HTMLInputElement>) {
    adicionarEvidencias(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function removerEvidencia(indiceArquivo: number) {
    setEvidencias((arquivos) =>
      arquivos.filter((_, indice) => indice !== indiceArquivo)
    );
  }

  function receberArquivosArrastados(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setArrastando(false);
    adicionarEvidencias(Array.from(event.dataTransfer.files));
  }

  return {
    evidencias,
    arrastando,
    setArrastando,
    selecionarEvidencias,
    removerEvidencia,
    receberArquivosArrastados,
  };
}

type NovoChamadoFormProps = {
  perfilAtual: PerfilAutenticado;
};

type BlocoChamadoProps = {
  title: string;
  description: string;
  children: React.ReactNode;
  className?: string;
};

const mensagemBlocoFuturo =
  "Campos deste bloco serão implementados em etapa posterior.";

function BlocoChamado({
  title,
  description,
  children,
  className = "",
}: BlocoChamadoProps) {
  return (
    <section
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-950">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function BlocoFuturo({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <BlocoChamado title={title} description={description}>
      <p className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        {mensagemBlocoFuturo}
      </p>
    </BlocoChamado>
  );
}

function CampoInformativo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        value={value}
        readOnly
        className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
      />
    </div>
  );
}

function BotaoNovo({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-xs font-semibold text-blue-600 hover:text-blue-800"
    >
      {children}
    </button>
  );
}

function InlineModal({
  tipo,
  onClose,
  onSubmit,
  salvando,
  erro,
}: {
  tipo: InlineTipo;
  onClose: () => void;
  onSubmit: (campos: { nome: string; descricao: string; url: string }) => void;
  salvando: boolean;
  erro: string;
}) {
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [url, setUrl] = useState("");
  const config: Record<InlineTipo, { titulo: string; label: string }> = {
    tipo: { titulo: "Novo tipo de chamado", label: "Nome do tipo" },
    origem: { titulo: "Nova origem", label: "Nome da origem" },
    organizacao: { titulo: "Nova organização", label: "Nome da organização" },
    filial: { titulo: "Nova filial", label: "Nome da filial" },
    grupo: { titulo: "Novo grupo de atendimento", label: "Nome do grupo" },
    base: { titulo: "Nova base de conhecimento", label: "Título" },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-base font-bold text-gray-950">
            {config[tipo].titulo}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-3 py-1 text-sm font-semibold text-gray-700"
          >
            Fechar
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {erro && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {erro}
            </p>
          )}

          <div>
            <label className="mb-2 block text-sm font-semibold">
              {config[tipo].label}
            </label>
            <input
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          {tipo === "base" && (
            <div>
              <label className="mb-2 block text-sm font-semibold">URL</label>
              <input
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          {tipo !== "organizacao" && tipo !== "filial" && (
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Descrição ou resumo
              </label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          )}

          <button
            type="button"
            disabled={salvando}
            onClick={() => onSubmit({ nome, descricao, url })}
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar cadastro"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function NovoChamadoForm({ perfilAtual }: NovoChamadoFormProps) {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [dados, setDados] = useState<NovoChamadoDados>(dadosIniciais);
  const [carregando, setCarregando] = useState(true);
  const [titulo, setTitulo] = useState("");
  const [tipoChamadoId, setTipoChamadoId] = useState("");
  const [origemId, setOrigemId] = useState("");
  const [idExterno, setIdExterno] = useState("");
  const [clienteId, setClienteId] = useState("");
  const [grupoAtendimentoId, setGrupoAtendimentoId] = useState("");
  const [basesSelecionadas, setBasesSelecionadas] = useState<string[]>([]);
  const [lojaId, setLojaId] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [impacto, setImpacto] = useState<Impacto>("medio");
  const [urgencia, setUrgencia] = useState<Urgencia>("media");
  const [categoria, setCategoria] = useState<CategoriaChamado | "">("");
  const [ativoTipo, setAtivoTipo] = useState("");
  const [ativoDescricao, setAtivoDescricao] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [analistaResponsavelId, setAnalistaResponsavelId] = useState("");
  const [tecnicoResponsavelId, setTecnicoResponsavelId] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState<InlineTipo | null>(null);
  const [erroInline, setErroInline] = useState("");
  const [salvandoInline, startInlineTransition] = useTransition();
  const {
    evidencias,
    arrastando,
    setArrastando,
    selecionarEvidencias,
    removerEvidencia,
    receberArquivosArrastados,
  } = useEvidenciasChamado(setErro);

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      const resultado = await carregarDadosNovoChamado();

      if (!ativo) {
        return;
      }

      if (resultado.status !== "success" || !resultado.data) {
        setErro(resultado.message);
        setCarregando(false);
        return;
      }

      setDados(resultado.data);
      setTipoChamadoId(resultado.data.tipos[0]?.id ?? "");
      setOrigemId(resultado.data.origens[0]?.id ?? "");
      setGrupoAtendimentoId(resultado.data.grupos[0]?.id ?? "");
      setCarregando(false);
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  const usuariosOperacionais = useMemo(
    () => montarUsuariosOperacionais(dados.perfis),
    [dados.perfis]
  );
  const usuarioAtual: UsuarioOperacional = {
    id: perfilAtual.id,
    nome: perfilAtual.nome_completo,
    papel: perfilAtual.papel,
  };
  const papelAtual = usuarioAtual.papel;
  const podeCriarInline = podeCriarCatalogo(papelAtual);
  const analistas = useMemo(
    () =>
      usuariosOperacionais.filter((usuario) => usuario.papel === "analista"),
    [usuariosOperacionais]
  );
  const tecnicos = useMemo(
    () => usuariosOperacionais.filter((usuario) => usuario.papel === "tecnico"),
    [usuariosOperacionais]
  );
  const prioridadeCalculada = calcularPrioridade(impacto, urgencia);
  const lojasFiltradas = useMemo(
    () => dados.lojas.filter((loja) => loja.cliente_id === clienteId),
    [clienteId, dados.lojas]
  );
  const ativosDisponiveis = useMemo(
    () => (categoria ? ativosPorCategoria[categoria] : []),
    [categoria]
  );
  const podeAtribuir = podeAtribuirResponsaveis(papelAtual);
  const analistaBloqueado = !podeAtribuir;
  const analistaResponsavelEfetivo =
    papelAtual === "analista"
      ? analistaResponsavelId || usuarioAtual.id
      : podeAtribuir
        ? analistaResponsavelId || analistas[0]?.id || ""
        : "";
  const tecnicoResponsavelEfetivo =
    papelAtual === "tecnico"
      ? usuarioAtual.id
      : !podeAtribuir
        ? ""
        : tecnicoResponsavelId;

  async function enviarEvidencias(chamadoId: string, usuarioId: string) {
    if (!supabase || evidencias.length === 0) {
      return;
    }

    const anexos: AnexoEvidencia[] = [];

    for (const [indice, evidencia] of evidencias.entries()) {
      const nomeSeguro = normalizarNomeArquivo(evidencia.name);
      const caminhoArquivo = `chamados/${chamadoId}/${evidencia.lastModified}-${indice}-${nomeSeguro}`;

      const { error: erroUpload } = await supabase.storage
        .from(EVIDENCIAS_BUCKET)
        .upload(caminhoArquivo, evidencia, {
          contentType: evidencia.type || undefined,
          upsert: false,
        });

      if (erroUpload) {
        throw new Error(
          `Não foi possível enviar "${evidencia.name}": ${erroUpload.message}`
        );
      }

      const { data: arquivoPublico } = supabase.storage
        .from(EVIDENCIAS_BUCKET)
        .getPublicUrl(caminhoArquivo);

      anexos.push({
        chamado_id: chamadoId,
        usuario_id: usuarioId,
        arquivo_url: arquivoPublico.publicUrl,
        tipo_arquivo: obterTipoArquivo(evidencia),
        legenda: evidencia.name,
        enviado_em: new Date().toISOString(),
      });
    }

    const { error: erroAnexos } = await supabase
      .from("evidencias_anexos")
      .insert(anexos);

    if (erroAnexos) {
      throw new Error(
        `Não foi possível registrar os anexos: ${erroAnexos.message}`
      );
    }
  }

  function alternarBaseConhecimento(baseId: string) {
    setBasesSelecionadas((basesAtuais) =>
      basesAtuais.includes(baseId)
        ? basesAtuais.filter((id) => id !== baseId)
        : [...basesAtuais, baseId]
    );
  }

  async function salvarInline(campos: {
    nome: string;
    descricao: string;
    url: string;
  }) {
    if (!modalAberto) {
      return;
    }

    setErroInline("");

    if (modalAberto === "filial" && !clienteId) {
      setErroInline("Selecione uma organização antes de criar a filial.");
      return;
    }

    startInlineTransition(async () => {
      let resultado: MutationResult<
        | CatalogoItem
        | ClienteItem
        | LojaItem
        | BaseConhecimentoItem
      >;

      if (modalAberto === "tipo") {
        resultado = await criarTipoChamado(campos.nome, campos.descricao);
      } else if (modalAberto === "origem") {
        resultado = await criarOrigemChamado(campos.nome, campos.descricao);
      } else if (modalAberto === "grupo") {
        resultado = await criarGrupoAtendimento(campos.nome, campos.descricao);
      } else if (modalAberto === "organizacao") {
        resultado = await criarOrganizacao(campos.nome);
      } else if (modalAberto === "filial") {
        resultado = await criarFilialOrganizacao(clienteId, campos.nome);
      } else {
        resultado = await criarBaseConhecimento({
          titulo: campos.nome,
          url: campos.url,
          resumo: campos.descricao,
        });
      }

      if (resultado.status !== "success" || !resultado.data) {
        setErroInline(resultado.message);
        return;
      }

      if (modalAberto === "tipo") {
        const item = resultado.data as CatalogoItem;
        setDados((atual) => ({ ...atual, tipos: [...atual.tipos, item] }));
        setTipoChamadoId(item.id);
      } else if (modalAberto === "origem") {
        const item = resultado.data as CatalogoItem;
        setDados((atual) => ({ ...atual, origens: [...atual.origens, item] }));
        setOrigemId(item.id);
      } else if (modalAberto === "grupo") {
        const item = resultado.data as CatalogoItem;
        setDados((atual) => ({ ...atual, grupos: [...atual.grupos, item] }));
        setGrupoAtendimentoId(item.id);
      } else if (modalAberto === "organizacao") {
        const item = resultado.data as ClienteItem;
        setDados((atual) => ({ ...atual, clientes: [...atual.clientes, item] }));
        setClienteId(item.id);
        setLojaId("");
      } else if (modalAberto === "filial") {
        const item = resultado.data as LojaItem;
        setDados((atual) => ({ ...atual, lojas: [...atual.lojas, item] }));
        setClienteId(item.cliente_id);
        setLojaId(item.id);
      } else {
        const item = resultado.data as BaseConhecimentoItem;
        setDados((atual) => ({ ...atual, bases: [...atual.bases, item] }));
        setBasesSelecionadas((basesAtuais) => [...basesAtuais, item.id]);
      }

      setModalAberto(null);
      setErroInline("");
    });
  }

  async function salvarChamado(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!titulo.trim()) {
      setErro("Informe o Assunto do chamado.");
      return;
    }

    if (
      !tipoChamadoId ||
      !origemId ||
      !clienteId ||
      !grupoAtendimentoId ||
      !lojaId
    ) {
      setErro(
        "Selecione tipo, origem, organização, filial e grupo de atendimento."
      );
      return;
    }

    if (!solicitante.trim() || !categoria || !ativoTipo || !descricao.trim()) {
      setErro(
        "Preencha solicitante, categoria, ativo e problema relatado antes de abrir o chamado."
      );
      return;
    }

    setErro("");
    setSalvando(true);

    const respostaChamado = await criarChamadoIdentificacao({
      titulo,
      tipo_chamado_id: tipoChamadoId,
      origem_id: origemId,
      id_externo: idExterno,
      organizacao_id: clienteId,
      grupo_atendimento_id: grupoAtendimentoId,
      base_conhecimento_ids: basesSelecionadas,
      loja_id: lojaId,
      solicitante,
      impacto,
      urgencia,
      prioridade: prioridadeCalculada,
      categoria,
      ativo_tipo: ativoTipo,
      ativo_descricao: ativoDescricao,
      marca,
      modelo,
      descricao,
      analista_responsavel_id: analistaResponsavelEfetivo || "",
      tecnico_responsavel_id: tecnicoResponsavelEfetivo || "",
    });

    if (respostaChamado.status !== "success" || !respostaChamado.data) {
      setErro(respostaChamado.message);
      setSalvando(false);
      return;
    }

    try {
      await enviarEvidencias(respostaChamado.data.id, usuarioAtual.id);
    } catch (error) {
      setErro(
        `Chamado #${respostaChamado.data.numero} criado, mas houve erro nas evidências. ${
          error instanceof Error ? error.message : "Tente enviar novamente."
        }`
      );
      setSalvando(false);
      return;
    }

    router.push(`/chamados/${respostaChamado.data.numero}`);
  }

  if (carregando) {
    return (
      <p className="mt-6 text-sm text-gray-600">
        Carregando dados do Supabase...
      </p>
    );
  }

  return (
    <form onSubmit={salvarChamado} className="space-y-6">
      {erro && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">
          {erro}
        </div>
      )}

      {modalAberto && (
        <InlineModal
          tipo={modalAberto}
          onClose={() => {
            setModalAberto(null);
            setErroInline("");
          }}
          onSubmit={salvarInline}
          salvando={salvandoInline}
          erro={erroInline}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <BlocoChamado
          title="Identificação do chamado"
          description="Dados iniciais para classificar a demanda e direcionar o atendimento."
          className="lg:col-span-2"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <CampoInformativo
              label="Número do chamado"
              value="Gerado após salvar"
            />

            <CampoInformativo
              label="Status"
              value="Pendente de agendamento"
            />

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Assunto <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                value={titulo}
                onChange={(event) => setTitulo(event.target.value)}
                placeholder="Resumo objetivo do chamado"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Problema Relatado <span className="text-red-600">*</span>
              </label>
              <textarea
                value={descricao}
                onChange={(event) => setDescricao(event.target.value)}
                rows={4}
                placeholder="Descreva a necessidade, impacto e contexto informado pela filial."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold">
                  Tipo de chamado <span className="text-red-600">*</span>
                </label>
                {podeCriarInline && (
                  <BotaoNovo onClick={() => setModalAberto("tipo")}>
                    + Novo tipo
                  </BotaoNovo>
                )}
              </div>
              <select
                value={tipoChamadoId}
                onChange={(event) => setTipoChamadoId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecione um tipo</option>
                {dados.tipos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold">
                  Origem <span className="text-red-600">*</span>
                </label>
                {podeCriarInline && (
                  <BotaoNovo onClick={() => setModalAberto("origem")}>
                    + Nova origem
                  </BotaoNovo>
                )}
              </div>
              <select
                value={origemId}
                onChange={(event) => setOrigemId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecione uma origem</option>
                {dados.origens.map((origem) => (
                  <option key={origem.id} value={origem.id}>
                    {origem.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                ID externo
              </label>
              <input
                type="text"
                value={idExterno}
                onChange={(event) => setIdExterno(event.target.value)}
                placeholder="Ex.: Jira, Freshservice, GLPI"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold">
                  Grupo de atendimento <span className="text-red-600">*</span>
                </label>
                {podeCriarInline && (
                  <BotaoNovo onClick={() => setModalAberto("grupo")}>
                    + Novo grupo
                  </BotaoNovo>
                )}
              </div>
              <select
                value={grupoAtendimentoId}
                onChange={(event) => setGrupoAtendimentoId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecione um grupo</option>
                {dados.grupos.map((grupo) => (
                  <option key={grupo.id} value={grupo.id}>
                    {grupo.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold">
                  Base de conhecimento relacionada
                </label>
                {podeCriarInline && (
                  <BotaoNovo onClick={() => setModalAberto("base")}>
                    + Nova base
                  </BotaoNovo>
                )}
              </div>
              <div className="max-h-44 space-y-2 overflow-auto rounded-lg border border-gray-300 bg-white p-3">
                {dados.bases.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Nenhuma base cadastrada.
                  </p>
                ) : (
                  dados.bases.map((base) => (
                    <label
                      key={base.id}
                      className="flex items-start gap-2 rounded-md px-2 py-1 text-sm hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={basesSelecionadas.includes(base.id)}
                        onChange={() => alternarBaseConhecimento(base.id)}
                        className="mt-1"
                      />
                      <span>
                        <span className="font-medium text-gray-900">
                          {base.titulo}
                        </span>
                        {base.url && (
                          <span className="block break-all text-xs text-gray-500">
                            {base.url}
                          </span>
                        )}
                      </span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>
        </BlocoChamado>

        <BlocoChamado
          title="2. Organização e filial"
          description="Organização e filial onde o atendimento será tratado."
        >
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold">
                  Organização <span className="text-red-600">*</span>
                </label>
                {podeCriarInline && (
                  <BotaoNovo onClick={() => setModalAberto("organizacao")}>
                    + Nova organização
                  </BotaoNovo>
                )}
              </div>
              <select
                value={clienteId}
                onChange={(event) => {
                  setClienteId(event.target.value);
                  setLojaId("");
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecione uma organização</option>
                {dados.clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome_fantasia}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-semibold">
                  Filial <span className="text-red-600">*</span>
                </label>
                {podeCriarInline && (
                  <BotaoNovo
                    onClick={() => {
                      if (!clienteId) {
                        setErro(
                          "Selecione uma organização antes de criar a filial."
                        );
                        return;
                      }

                      setErro("");
                      setModalAberto("filial");
                    }}
                  >
                    + Nova filial
                  </BotaoNovo>
                )}
              </div>
              <select
                value={lojaId}
                onChange={(event) => setLojaId(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!clienteId}
              >
                <option value="">Selecione uma filial</option>
                {lojasFiltradas.map((loja) => (
                  <option key={loja.id} value={loja.id}>
                    {loja.nome_loja}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </BlocoChamado>

        <BlocoChamado
          title="3. Solicitante e contato"
          description="Identificação de quem acionou o atendimento."
        >
          <label className="mb-2 block text-sm font-semibold">
            Solicitante <span className="text-red-600">*</span>
          </label>
          <input
            type="text"
            value={solicitante}
            onChange={(event) => setSolicitante(event.target.value)}
            placeholder="Nome de quem solicitou o atendimento"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </BlocoChamado>

        <BlocoChamado
          title="4. Classificação e triagem"
          description="Categoria, impacto e urgência usados para calcular a prioridade."
          className="lg:col-span-2"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Categoria <span className="text-red-600">*</span>
              </label>
              <select
                value={categoria}
                onChange={(event) => {
                  setCategoria(event.target.value as CategoriaChamado | "");
                  setAtivoTipo("");
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">Selecione uma categoria</option>
                {categoriaChamadoOpcoes.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Impacto
              </label>
              <select
                value={impacto}
                onChange={(event) => setImpacto(event.target.value as Impacto)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {impactos.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Urgência
              </label>
              <select
                value={urgencia}
                onChange={(event) => setUrgencia(event.target.value as Urgencia)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                {urgencias.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Prioridade calculada
              </label>
              <div className="flex min-h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                <span className={getPrioridadeClass(prioridadeCalculada)}>
                  {getPrioridadeLabel(prioridadeCalculada)}
                </span>
              </div>
            </div>
          </div>
        </BlocoChamado>

        <BlocoChamado
          title="5. Ativo, equipamento e PDV"
          description="Ativo afetado e dados básicos do equipamento informado."
          className="lg:col-span-2"
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Ativo <span className="text-red-600">*</span>
              </label>
              <select
                value={ativoTipo}
                onChange={(event) => setAtivoTipo(event.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
                disabled={!categoria}
              >
                <option value="">Selecione um ativo</option>
                {ativosDisponiveis.map((ativo) => (
                  <option key={ativo} value={ativo}>
                    {ativo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Complemento do ativo
              </label>
              <input
                type="text"
                value={ativoDescricao}
                onChange={(event) => setAtivoDescricao(event.target.value)}
                placeholder="Ex.: PDV 03, corredor 2, rack principal"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Marca</label>
              <input
                type="text"
                value={marca}
                onChange={(event) => setMarca(event.target.value)}
                placeholder="Ex.: Epson, Dell, Intelbras"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">Modelo</label>
              <input
                type="text"
                value={modelo}
                onChange={(event) => setModelo(event.target.value)}
                placeholder="Ex.: TM-T20, OptiPlex 3080, VIP 1230"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </BlocoChamado>

        <BlocoChamado
          title="6. Responsáveis e operadores"
          description="Atribuição operacional conforme permissões do perfil autenticado."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Analista responsável
              </label>
              <select
                value={analistaResponsavelEfetivo}
                onChange={(event) =>
                  setAnalistaResponsavelId(event.target.value)
                }
                disabled={analistaBloqueado}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Sem analista definido</option>
                {analistas.map((analista) => (
                  <option key={analista.id} value={analista.id}>
                    {analista.nome}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold">
                Técnico responsável
              </label>
              <select
                value={tecnicoResponsavelEfetivo}
                onChange={(event) =>
                  setTecnicoResponsavelId(event.target.value)
                }
                disabled={!podeAtribuir}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="">Sem técnico atribuído</option>
                {tecnicos.map((tecnico) => (
                  <option key={tecnico.id} value={tecnico.id}>
                    {tecnico.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </BlocoChamado>

        <BlocoChamado
          title="7. Evidências e anexos"
          description="Arquivos iniciais para apoiar a triagem do atendimento."
          className="lg:col-span-2"
        >
          <label className="mb-2 block text-sm font-semibold">
            Evidências iniciais
          </label>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setArrastando(true);
            }}
            onDragLeave={() => setArrastando(false)}
            onDrop={receberArquivosArrastados}
            className={`rounded-lg border-2 border-dashed p-5 transition ${
              arrastando
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 bg-gray-50"
            }`}
          >
            <input
              type="file"
              multiple
              accept={acceptEvidencias}
              onChange={selecionarEvidencias}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            />
            <p className="mt-3 text-sm text-gray-600">
              Arraste arquivos para esta área ou selecione pelo campo acima.
            </p>
          </div>

          {evidencias.length > 0 && (
            <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-sm font-semibold">
                {evidencias.length} arquivo(s) selecionado(s)
              </p>

              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {evidencias.map((evidencia, indice) => (
                  <li
                    key={`${evidencia.name}-${evidencia.size}-${evidencia.lastModified}`}
                    className="flex flex-col rounded border border-gray-200 bg-white px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <span className="break-all font-medium">
                        {evidencia.name}
                      </span>
                      <p className="mt-1 text-xs text-gray-500">
                        {obterTipoArquivo(evidencia)} ·{" "}
                        {formatarTamanho(evidencia.size)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removerEvidencia(indice)}
                      className="mt-2 text-left text-sm font-semibold text-red-600 sm:mt-0"
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </BlocoChamado>

        <BlocoFuturo
          title="8. Datas, agendamento e SLA"
          description="Reserva para prazos, janelas de atendimento e indicadores de SLA."
        />
        <BlocoFuturo
          title="9. Peças, equipamentos e substituições"
          description="Reserva para itens aplicados, trocas e substituições técnicas."
        />
        <BlocoFuturo
          title="10. Custos e financeiro"
          description="Reserva para custos, valores e impactos financeiros."
        />
        <BlocoFuturo
          title="11. Controle, validação e encerramento"
          description="Reserva para aprovação, validação final e encerramento operacional."
        />
        <BlocoFuturo
          title="12. Integrações e dados externos"
          description="Reserva para vínculos com sistemas externos e referências integradas."
        />
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-950">
              Ações do chamado
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Revise os dados informados antes de abrir o chamado técnico.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex min-h-11 items-center justify-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {salvando ? "Salvando..." : "Abrir chamado"}
            </button>
          </div>
        </div>
      </section>
    </form>
  );
}
