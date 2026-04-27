import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { StatusUpdateForm } from "./StatusUpdateForm";
import { RegistroTecnicoForm } from "./RegistroTecnicoForm";
import {
  formatarCategoria,
  formatarStatus,
  getPrioridadeClass,
  getPrioridadeLabel,
  getStatusClass,
} from "../chamadoVisual";

type PageProps = {
  params: Promise<{
    numero: string;
  }>;
};

type ChamadoDetalhe = {
  id: string;
  numero: number;
  titulo: string;
  descricao_problema: string | null;
  tipo_chamado: string | null;
  impacto: string | null;
  urgencia: string | null;
  origem: string | null;
  ativo_afetado: string | null;
  categoria: string | null;
  ativo_tipo: string | null;
  ativo_descricao: string | null;
  marca: string | null;
  modelo: string | null;
  status: string;
  prioridade: string;
  analista_responsavel_id: string | null;
  tecnico_responsavel_id: string | null;
  aberto_em: string;
  atendimento_iniciado_em: string | null;
  finalizado_em: string | null;
  clientes: {
    nome_fantasia: string;
  } | null;
  lojas: {
    nome_loja: string;
    cidade: string | null;
    estado: string | null;
  } | null;
  tecnico: {
    nome_completo: string;
  } | null;
};

type RegistroTecnico = {
  id: string;
  problema_identificado: string | null;
  testes_feitos: string | null;
  solucao: string | null;
  observacoes_internas: string | null;
  registrado_em: string;
};

type Evidencia = {
  id: string;
  arquivo_url: string;
  tipo_arquivo: string | null;
  legenda: string | null;
  enviado_em: string;
};

type HistoricoStatus = {
  id: string;
  status_anterior: string | null;
  status_novo: string;
  observacao: string | null;
  alterado_em: string;
};

function formatarData(data: string | null) {
  if (!data) {
    return "Não informado";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function formatarTipoArquivo(tipo: string | null) {
  if (!tipo) {
    return "Arquivo";
  }

  const tipos: Record<string, string> = {
    imagem: "Imagem",
    audio: "Áudio",
    documento: "Documento",
  };

  return tipos[tipo] ?? tipo;
}

function isSchemaCacheError(message: string | undefined) {
  return Boolean(
    message?.includes("schema cache") || message?.includes("Could not find")
  );
}

export default async function DetalheChamado({ params }: PageProps) {
  const { numero } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">Configuração incompleta</h1>
        <p>Verifique o arquivo .env.local.</p>
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  let chamadoResposta = await supabase
    .from("chamados")
    .select(`
      id,
      numero,
      titulo,
      descricao_problema,
      tipo_chamado,
      impacto,
      urgencia,
      origem,
      ativo_afetado,
      categoria,
      ativo_tipo,
      ativo_descricao,
      marca,
      modelo,
      status,
      prioridade,
      analista_responsavel_id,
      tecnico_responsavel_id,
      aberto_em,
      atendimento_iniciado_em,
      finalizado_em,
      clientes (
        nome_fantasia
      ),
      lojas (
        nome_loja,
        cidade,
        estado
      ),
      tecnico:perfis!chamados_tecnico_id_fkey (
        nome_completo
      )
    `)
    .eq("numero", Number(numero))
    .single();

  if (isSchemaCacheError(chamadoResposta.error?.message)) {
    chamadoResposta = await supabase
      .from("chamados")
      .select(`
        id,
        numero,
        titulo,
        descricao_problema,
        status,
        prioridade,
        aberto_em,
        atendimento_iniciado_em,
        finalizado_em,
        clientes (
          nome_fantasia
        ),
        lojas (
          nome_loja,
          cidade,
          estado
        ),
        tecnico:perfis!chamados_tecnico_id_fkey (
          nome_completo
        )
      `)
      .eq("numero", Number(numero))
      .single();
  }

  const chamado = chamadoResposta.data;
  const chamadoError = chamadoResposta.error;

  if (chamadoError || !chamado) {
    return (
      <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
        <section className="mx-auto max-w-4xl">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            ← Voltar para chamados
          </Link>

          <div className="mt-6 rounded-xl bg-white p-6 shadow">
            <h1 className="text-2xl font-bold">Chamado não encontrado</h1>
            <p className="mt-2 text-gray-600">
              Não foi possível carregar o chamado solicitado.
            </p>

            {chamadoError?.message && (
              <pre className="mt-4 whitespace-pre-wrap rounded bg-gray-100 p-4 text-sm">
                {chamadoError.message}
              </pre>
            )}
          </div>
        </section>
      </main>
    );
  }

    const chamadoParcial = chamado as unknown as Partial<ChamadoDetalhe>;
    const chamadoDetalhe = {
      ...chamadoParcial,
      tipo_chamado: chamadoParcial.tipo_chamado ?? null,
      impacto: chamadoParcial.impacto ?? null,
      urgencia: chamadoParcial.urgencia ?? null,
      origem: chamadoParcial.origem ?? null,
      ativo_afetado: chamadoParcial.ativo_afetado ?? null,
      categoria: chamadoParcial.categoria ?? null,
      ativo_tipo: chamadoParcial.ativo_tipo ?? null,
      ativo_descricao: chamadoParcial.ativo_descricao ?? null,
      marca: chamadoParcial.marca ?? null,
      modelo: chamadoParcial.modelo ?? null,
      analista_responsavel_id:
        chamadoParcial.analista_responsavel_id ?? null,
      tecnico_responsavel_id: chamadoParcial.tecnico_responsavel_id ?? null,
    } as ChamadoDetalhe;

  const { data: registrosTecnicos } = await supabase
    .from("registros_tecnicos")
    .select(`
      id,
      problema_identificado,
      testes_feitos,
      solucao,
      observacoes_internas,
      registrado_em
    `)
    .eq("chamado_id", chamadoDetalhe.id)
    .order("registrado_em", { ascending: false });

  const { data: evidencias } = await supabase
    .from("evidencias_anexos")
    .select(`
      id,
      arquivo_url,
      tipo_arquivo,
      legenda,
      enviado_em
    `)
    .eq("chamado_id", chamadoDetalhe.id)
    .order("enviado_em", { ascending: false });

  const { data: historico } = await supabase
    .from("historico_status")
    .select(`
      id,
      status_anterior,
      status_novo,
      observacao,
      alterado_em
    `)
    .eq("chamado_id", chamadoDetalhe.id)
    .order("alterado_em", { ascending: true });

  const listaRegistros = (registrosTecnicos as RegistroTecnico[] | null) ?? [];
  const listaEvidencias = (evidencias as Evidencia[] | null) ?? [];
  const listaHistorico = (historico as HistoricoStatus[] | null) ?? [];

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <section className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            ← Voltar para chamados
          </Link>
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
                Chamado #{chamadoDetalhe.numero}
              </p>

              <h1 className="mt-2 text-2xl font-bold md:text-3xl">
                {chamadoDetalhe.titulo}
              </h1>

              <p className="mt-3 whitespace-pre-line text-gray-600">
                {chamadoDetalhe.descricao_problema}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className={getStatusClass(chamadoDetalhe.status)}>
                {formatarStatus(chamadoDetalhe.status)}
              </span>

              <span className={getPrioridadeClass(chamadoDetalhe.prioridade)}>
                {getPrioridadeLabel(chamadoDetalhe.prioridade)}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Tipo</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.tipo_chamado ?? "Não informado"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Impacto</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.impacto ?? "Não informado"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Urgência</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.urgencia ?? "Não informado"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Categoria</p>
            <p className="mt-2 font-semibold">
              {formatarCategoria(chamadoDetalhe.categoria)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Origem</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.origem ?? "Não informado"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Ativo afetado</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.ativo_tipo ??
                chamadoDetalhe.ativo_afetado ??
                "Não informado"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Complemento</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.ativo_descricao ?? "Não informado"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Marca</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.marca ?? "Não informado"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Modelo</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.modelo ?? "Não informado"}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Analista responsável
            </p>
            <p className="mt-2 break-all text-sm font-semibold">
              {chamadoDetalhe.analista_responsavel_id ?? "Não definido"}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Cliente</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.clientes?.nome_fantasia}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Loja</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.lojas?.nome_loja}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Técnico</p>
            <p className="mt-2 font-semibold">
              {chamadoDetalhe.tecnico?.nome_completo ??
                chamadoDetalhe.tecnico_responsavel_id ??
                "Não definido"}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Aberto em</p>
            <p className="mt-2 font-semibold">
              {formatarData(chamadoDetalhe.aberto_em)}
            </p>
          </div>

        <div className="mb-6">
          <StatusUpdateForm
            chamadoId={chamadoDetalhe.id}
            statusAtual={chamadoDetalhe.status}
          />
        </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">
              Atendimento iniciado
            </p>
            <p className="mt-2 font-semibold">
              {formatarData(chamadoDetalhe.atendimento_iniciado_em)}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow">
            <p className="text-sm font-medium text-gray-500">Finalizado em</p>
            <p className="mt-2 font-semibold">
              {formatarData(chamadoDetalhe.finalizado_em)}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Registro técnico</h2>
                  <RegistroTecnicoForm chamadoId={chamadoDetalhe.id} />

          <div className="mt-4 space-y-4">
            {listaRegistros.map((registro) => (
              <div key={registro.id} className="rounded-lg border p-4">
                <p className="text-sm text-gray-500">
                  Registrado em {formatarData(registro.registrado_em)}
                </p>

                <div className="mt-4 space-y-3 text-sm">
                  <p>
                    <span className="font-semibold">Problema identificado:</span>{" "}
                    {registro.problema_identificado}
                  </p>

                  <p>
                    <span className="font-semibold">Testes feitos:</span>{" "}
                    {registro.testes_feitos}
                  </p>

                  <p>
                    <span className="font-semibold">Solução:</span>{" "}
                    {registro.solucao}
                  </p>

                  <p>
                    <span className="font-semibold">Observações internas:</span>{" "}
                    {registro.observacoes_internas}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Evidências</h2>

          {listaEvidencias.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">
              Nenhuma evidência registrada para este chamado.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {listaEvidencias.map((evidencia) => (
                <div
                  key={evidencia.id}
                  className="rounded-lg border p-4 text-sm"
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-semibold">
                        {evidencia.legenda ?? "Evidência do chamado"}
                      </p>
                      <p className="mt-1 text-gray-500">
                        {formatarTipoArquivo(evidencia.tipo_arquivo)} enviado em{" "}
                        {formatarData(evidencia.enviado_em)}
                      </p>
                    </div>

                    <a
                      href={evidencia.arquivo_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-semibold text-blue-600"
                    >
                      Abrir arquivo
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Histórico de status</h2>

          <div className="mt-4 space-y-3">
            {listaHistorico.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <p className="font-semibold">
                  {formatarStatus(item.status_anterior) === "Não informado"
                    ? "Início"
                    : formatarStatus(item.status_anterior)}{" "}
                  → {formatarStatus(item.status_novo)}
                </p>
                <p className="mt-1 text-gray-600">{item.observacao}</p>
                <p className="mt-1 text-gray-500">
                  {formatarData(item.alterado_em)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
