"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { PapelUsuario, PerfilAutenticado } from "@/lib/auth/types";
import { useSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  ativosPorCategoria,
  categoriaChamadoOpcoes,
  type CategoriaChamado,
  getPrioridadeClass,
  getPrioridadeLabel,
} from "../chamadoVisual";

type TipoChamado = "incidente" | "requisicao_servico";
type Impacto = "baixo" | "medio" | "alto";
type Urgencia = "baixa" | "media" | "alta";
type Origem = "sistema" | "whatsapp" | "telefone" | "tecnico";
type Prioridade = "baixa" | "media" | "alta" | "critica";
type StatusChamado = "pendente_agendamento";

type Cliente = {
  id: string;
  nome_fantasia: string;
};

type Loja = {
  id: string;
  cliente_id: string;
  nome_loja: string;
};

type Perfil = {
  id: string;
  nome_completo: string;
  papel: string;
};

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

type ChamadoInsert = {
  cliente_id: string;
  loja_id: string;
  operador_id: string;
  tecnico_id?: string | null;
  analista_responsavel_id?: string | null;
  tecnico_responsavel_id?: string | null;
  tipo_chamado?: TipoChamado;
  impacto?: Impacto;
  urgencia?: Urgencia;
  origem?: Origem;
  ativo_afetado?: string | null;
  categoria?: CategoriaChamado;
  ativo_tipo?: string | null;
  ativo_descricao?: string | null;
  marca?: string | null;
  modelo?: string | null;
  titulo: string;
  descricao_problema: string;
  status: StatusChamado;
  prioridade: Prioridade;
};

const EVIDENCIAS_BUCKET = "evidencias-chamados";

const tiposChamado: Opcao<TipoChamado>[] = [
  { value: "incidente", label: "Incidente" },
  { value: "requisicao_servico", label: "Requisição de Serviço" },
];

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

const origens: Opcao<Origem>[] = [
  { value: "sistema", label: "Sistema" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telefone", label: "Telefone" },
  { value: "tecnico", label: "Técnico" },
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

function obterLabel<T extends string>(opcoes: Opcao<T>[], value: T) {
  return opcoes.find((opcao) => opcao.value === value)?.label ?? value;
}

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find")
  );
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

function montarUsuariosOperacionais(perfis: Perfil[]) {
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

function useNovoChamadoDados(supabase: SupabaseClient) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregamento, setErroCarregamento] = useState("");

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      const [clientesResposta, lojasResposta, perfisResposta] =
        await Promise.all([
          supabase
            .from("clientes")
            .select("id, nome_fantasia")
            .eq("ativo", true)
            .order("nome_fantasia"),

          supabase
            .from("lojas")
            .select("id, cliente_id, nome_loja")
            .eq("ativo", true)
            .order("nome_loja"),

          supabase
            .from("perfis")
            .select("id, nome_completo, papel")
            .eq("ativo", true)
            .order("nome_completo"),
        ]);

      if (!ativo) {
        return;
      }

      if (clientesResposta.error) {
        setErroCarregamento(clientesResposta.error.message);
      } else if (lojasResposta.error) {
        setErroCarregamento(lojasResposta.error.message);
      } else if (perfisResposta.error) {
        setErroCarregamento(perfisResposta.error.message);
      } else {
        setClientes((clientesResposta.data as Cliente[]) ?? []);
        setLojas((lojasResposta.data as Loja[]) ?? []);
        setPerfis((perfisResposta.data as Perfil[]) ?? []);
      }

      setCarregando(false);
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, [supabase]);

  return { clientes, lojas, perfis, carregando, erroCarregamento };
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
    adicionarEvidencias,
    selecionarEvidencias,
    removerEvidencia,
    receberArquivosArrastados,
  };
}

type NovoChamadoFormProps = {
  perfilAtual: PerfilAutenticado;
};

export function NovoChamadoForm({ perfilAtual }: NovoChamadoFormProps) {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const { clientes, lojas, perfis, carregando, erroCarregamento } =
    useNovoChamadoDados(supabase);

  const [clienteId, setClienteId] = useState("");
  const [lojaId, setLojaId] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [tipoChamado, setTipoChamado] = useState<TipoChamado>("incidente");
  const [impacto, setImpacto] = useState<Impacto>("medio");
  const [urgencia, setUrgencia] = useState<Urgencia>("media");
  const [origem, setOrigem] = useState<Origem>("sistema");
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
  const {
    evidencias,
    arrastando,
    setArrastando,
    selecionarEvidencias,
    removerEvidencia,
    receberArquivosArrastados,
  } = useEvidenciasChamado(setErro);

  const usuariosOperacionais = useMemo(
    () => montarUsuariosOperacionais(perfis),
    [perfis]
  );
  const usuarioAtual: UsuarioOperacional = {
    id: perfilAtual.id,
    nome: perfilAtual.nome_completo,
    papel: perfilAtual.papel,
  };
  const papelAtual = usuarioAtual.papel;
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
    () => lojas.filter((loja) => loja.cliente_id === clienteId),
    [clienteId, lojas]
  );
  const tipoSelecionado = obterLabel(tiposChamado, tipoChamado);
  const categoriaSelecionada = categoria
    ? obterLabel(categoriaChamadoOpcoes, categoria)
    : "";
  const ativosDisponiveis = useMemo(
    () => (categoria ? ativosPorCategoria[categoria] : []),
    [categoria]
  );
  const podeAtribuir = podeAtribuirResponsaveis(papelAtual);
  const tecnicoBloqueado =
    !podeAtribuir || origem === "tecnico";
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
      : origem === "tecnico" && podeAtribuir
        ? tecnicoResponsavelId || tecnicos[0]?.id || ""
      : !podeAtribuir
        ? ""
        : tecnicoResponsavelId;
  const mensagemErro = erro || erroCarregamento;

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

  async function salvarChamado(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (origem === "tecnico" && papelAtual !== "tecnico" && !tecnicoResponsavelEfetivo) {
      setErro("Cadastre ou selecione um técnico responsável para origem técnico.");
      return;
    }

    if (
      !clienteId ||
      !lojaId ||
      !solicitante.trim() ||
      !categoria ||
      !ativoTipo ||
      !descricao.trim()
    ) {
      setErro(
        "Preencha cliente, loja/unidade, solicitante, categoria, ativo e descrição."
      );
      return;
    }

    setErro("");
    setSalvando(true);

    const usuarioId = usuarioAtual.id;
    const descricaoProblema = [
      `Solicitante: ${solicitante.trim()}`,
      `Tipo do chamado: ${tipoSelecionado}`,
      `Impacto: ${obterLabel(impactos, impacto)}`,
      `Urgência: ${obterLabel(urgencias, urgencia)}`,
      `Origem: ${obterLabel(origens, origem)}`,
      `Categoria: ${categoriaSelecionada}`,
      `Ativo: ${ativoTipo}`,
      `Complemento do ativo: ${ativoDescricao.trim() || "Não informado"}`,
      `Marca: ${marca.trim() || "Não informada"}`,
      `Modelo: ${modelo.trim() || "Não informado"}`,
      `Usuário: ${usuarioAtual.nome}`,
      `Papel: ${papelAtual}`,
      "",
      descricao.trim(),
    ].join("\n");

    const chamadoBase: ChamadoInsert = {
      cliente_id: clienteId,
      loja_id: lojaId,
      operador_id: usuarioId,
      tecnico_id: tecnicoResponsavelEfetivo || null,
      titulo: `${tipoSelecionado} - ${categoriaSelecionada}`,
      descricao_problema: descricaoProblema,
      status: "pendente_agendamento",
      prioridade: prioridadeCalculada,
    };

    const chamadoComCamposNovos: ChamadoInsert = {
      ...chamadoBase,
      analista_responsavel_id: analistaResponsavelEfetivo || null,
      tecnico_responsavel_id: tecnicoResponsavelEfetivo || null,
      tipo_chamado: tipoChamado,
      impacto,
      urgencia,
      origem,
      ativo_afetado: ativoTipo,
      categoria,
      ativo_tipo: ativoTipo,
      ativo_descricao: ativoDescricao.trim() || null,
      marca: marca.trim() || null,
      modelo: modelo.trim() || null,
    };

    let respostaChamado = await supabase
      .from("chamados")
      .insert(chamadoComCamposNovos)
      .select("id, numero")
      .single();

    if (isSchemaCacheError(respostaChamado.error?.message)) {
      respostaChamado = await supabase
        .from("chamados")
        .insert(chamadoBase)
        .select("id, numero")
        .single();
    }

    if (respostaChamado.error || !respostaChamado.data) {
      setErro(respostaChamado.error?.message ?? "Erro ao criar chamado.");
      setSalvando(false);
      return;
    }

    const chamadoCriado = respostaChamado.data;

    try {
      await enviarEvidencias(chamadoCriado.id, usuarioId);
    } catch (error) {
      setErro(
        `Chamado #${chamadoCriado.numero} criado, mas houve erro nas evidências. ${
          error instanceof Error ? error.message : "Tente enviar novamente."
        }`
      );
      setSalvando(false);
      return;
    }

    const { error: erroHistorico } = await supabase
      .from("historico_status")
      .insert({
        chamado_id: chamadoCriado.id,
        usuario_id: usuarioId,
        status_anterior: null,
        status_novo: "pendente_agendamento",
        observacao: "Chamado aberto pelo sistema.",
      });

    if (erroHistorico) {
      setErro(erroHistorico.message);
      setSalvando(false);
      return;
    }

    router.push(`/chamados/${chamadoCriado.numero}`);
  }

  if (carregando) {
    return (
      <p className="mt-6 text-sm text-gray-600">
        Carregando dados do Supabase...
      </p>
    );
  }

  return (
    <form onSubmit={salvarChamado} className="mt-6 space-y-5">
      {mensagemErro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {mensagemErro}
        </div>
      )}

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="grid gap-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-semibold">
              Usuário
            </label>
            <input
              value={`${usuarioAtual.nome} (${usuarioAtual.papel})`}
              readOnly
              className="w-full rounded-lg border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-700"
            />
          </div>

          <div className="md:col-span-2">
            <p className="text-sm font-semibold">Permissões aplicadas</p>
            <div className="mt-2 flex flex-col gap-2 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
              <p>
                O perfil autenticado define analista e técnico
                responsáveis.
              </p>
              <Link href="/faq/permissoes" className="font-semibold text-blue-600">
                Ver FAQ de permissões
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">Cliente</label>
          <select
            value={clienteId}
            onChange={(event) => {
              setClienteId(event.target.value);
              setLojaId("");
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">Selecione um cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nome_fantasia}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Loja/Unidade
          </label>
          <select
            value={lojaId}
            onChange={(event) => setLojaId(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            disabled={!clienteId}
          >
            <option value="">Selecione uma loja</option>
            {lojasFiltradas.map((loja) => (
              <option key={loja.id} value={loja.id}>
                {loja.nome_loja}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Solicitante
          </label>
          <input
            type="text"
            value={solicitante}
            onChange={(event) => setSolicitante(event.target.value)}
            placeholder="Nome de quem solicitou o atendimento"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Tipo do chamado
          </label>
          <select
            value={tipoChamado}
            onChange={(event) =>
              setTipoChamado(event.target.value as TipoChamado)
            }
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {tiposChamado.map((tipo) => (
              <option key={tipo.value} value={tipo.value}>
                {tipo.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Impacto</label>
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
          <label className="mb-2 block text-sm font-semibold">Urgência</label>
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
          <label className="mb-2 block text-sm font-semibold">Origem</label>
          <select
            value={origem}
            onChange={(event) => setOrigem(event.target.value as Origem)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {origens.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Categoria</label>
          <select
            value={categoria}
            onChange={(event) => {
              setCategoria(event.target.value as CategoriaChamado | "");
              setAtivoTipo("");
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
            required
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
            Prioridade calculada
          </label>
          <div className="flex min-h-10 items-center rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
            <span className={getPrioridadeClass(prioridadeCalculada)}>
              {getPrioridadeLabel(prioridadeCalculada)}
            </span>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Analista responsável
          </label>
          <select
            value={analistaResponsavelEfetivo}
            onChange={(event) => setAnalistaResponsavelId(event.target.value)}
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
            onChange={(event) => setTecnicoResponsavelId(event.target.value)}
            disabled={tecnicoBloqueado}
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

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Ativo
          </label>
          <select
            value={ativoTipo}
            onChange={(event) => setAtivoTipo(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
            disabled={!categoria}
            required
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

      <div>
        <label className="mb-2 block text-sm font-semibold">Descrição</label>
        <textarea
          value={descricao}
          onChange={(event) => setDescricao(event.target.value)}
          rows={5}
          placeholder="Descreva a necessidade, impacto e contexto informado pela loja."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
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
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/"
          className="rounded-lg border border-gray-300 px-4 py-2 text-center text-sm font-semibold"
        >
          Cancelar
        </Link>

        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Abrir chamado"}
        </button>
      </div>
    </form>
  );
}
