"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

type Cliente = {
  id: string;
  nome_fantasia: string;
};

type Loja = {
  id: string;
  cliente_id: string;
  nome_loja: string;
};

const OPERADOR_ID = "b5793ad4-5ce5-4ccd-935a-f9b91f19037c";

const tiposChamado = [
  { value: "incidente", label: "Incidente" },
  { value: "requisicao_servico", label: "Requisição de Serviço" },
];

const prioridades = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "critica", label: "Crítica" },
];

export function NovoChamadoForm() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [lojaId, setLojaId] = useState("");
  const [solicitante, setSolicitante] = useState("");
  const [tipoChamado, setTipoChamado] = useState("incidente");
  const [categoria, setCategoria] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [descricao, setDescricao] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    return createClient(supabaseUrl, supabaseKey);
  }, [supabaseUrl, supabaseKey]);

  const lojasFiltradas = lojas.filter((loja) => loja.cliente_id === clienteId);
  const tipoSelecionado =
    tiposChamado.find((tipo) => tipo.value === tipoChamado)?.label ??
    tipoChamado;

  useEffect(() => {
    async function carregarDados() {
      if (!supabase) {
        setErro("Configuração do Supabase não encontrada.");
        setCarregando(false);
        return;
      }

      const [clientesResposta, lojasResposta] = await Promise.all([
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
      ]);

      if (clientesResposta.error) {
        setErro(clientesResposta.error.message);
      } else if (lojasResposta.error) {
        setErro(lojasResposta.error.message);
      } else {
        setClientes((clientesResposta.data as Cliente[]) ?? []);
        setLojas((lojasResposta.data as Loja[]) ?? []);
      }

      setCarregando(false);
    }

    carregarDados();
  }, [supabase]);

  async function salvarChamado(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setErro("Configuração do Supabase não encontrada.");
      return;
    }

    if (
      !clienteId ||
      !lojaId ||
      !solicitante.trim() ||
      !categoria.trim() ||
      !descricao.trim()
    ) {
      setErro(
        "Preencha cliente, loja/unidade, solicitante, categoria e descrição."
      );
      return;
    }

    setErro("");
    setSalvando(true);

    const descricaoProblema = [
      `Solicitante: ${solicitante.trim()}`,
      `Tipo do chamado: ${tipoSelecionado}`,
      `Categoria: ${categoria.trim()}`,
      "",
      descricao.trim(),
    ].join("\n");

    const { data: chamadoCriado, error: erroChamado } = await supabase
      .from("chamados")
      .insert({
        cliente_id: clienteId,
        loja_id: lojaId,
        operador_id: OPERADOR_ID,
        titulo: `${tipoSelecionado} - ${categoria.trim()}`,
        descricao_problema: descricaoProblema,
        status: "aberto",
        prioridade,
      })
      .select("id, numero")
      .single();

    if (erroChamado || !chamadoCriado) {
      setErro(erroChamado?.message ?? "Erro ao criar chamado.");
      setSalvando(false);
      return;
    }

    const { error: erroHistorico } = await supabase
      .from("historico_status")
      .insert({
        chamado_id: chamadoCriado.id,
        usuario_id: OPERADOR_ID,
        status_anterior: null,
        status_novo: "aberto",
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
      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {erro}
        </div>
      )}

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
            onChange={(event) => setTipoChamado(event.target.value)}
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
          <label className="mb-2 block text-sm font-semibold">Categoria</label>
          <input
            type="text"
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            placeholder="Ex.: PDV, impressora, rede, acesso"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Prioridade
          </label>
          <select
            value={prioridade}
            onChange={(event) => setPrioridade(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {prioridades.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
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
