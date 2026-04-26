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

type Tecnico = {
  id: string;
  nome_completo: string;
  papel: string;
};

const OPERADOR_ID = "b5793ad4-5ce5-4ccd-935a-f9b91f19037c";

export default function NovoChamado() {
  const router = useRouter();

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);

  const [clienteId, setClienteId] = useState("");
  const [lojaId, setLojaId] = useState("");
  const [tecnicoId, setTecnicoId] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [titulo, setTitulo] = useState("");
  const [descricaoProblema, setDescricaoProblema] = useState("");

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

  useEffect(() => {
    async function carregarDados() {
      if (!supabase) {
        setErro("Configuração do Supabase não encontrada.");
        setCarregando(false);
        return;
      }

      const [clientesResposta, lojasResposta, tecnicosResposta] =
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
            .eq("papel", "tecnico")
            .order("nome_completo"),
        ]);

      if (clientesResposta.error) {
        setErro(clientesResposta.error.message);
      } else if (lojasResposta.error) {
        setErro(lojasResposta.error.message);
      } else if (tecnicosResposta.error) {
        setErro(tecnicosResposta.error.message);
      } else {
        setClientes((clientesResposta.data as Cliente[]) ?? []);
        setLojas((lojasResposta.data as Loja[]) ?? []);
        setTecnicos((tecnicosResposta.data as Tecnico[]) ?? []);
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

    if (!clienteId || !lojaId || !tecnicoId || !titulo.trim()) {
      setErro("Preencha cliente, loja, técnico e título do chamado.");
      return;
    }

    setErro("");
    setSalvando(true);

    const { data: chamadoCriado, error: erroChamado } = await supabase
      .from("chamados")
      .insert({
        cliente_id: clienteId,
        loja_id: lojaId,
        operador_id: OPERADOR_ID,
        tecnico_id: tecnicoId,
        titulo: titulo.trim(),
        descricao_problema: descricaoProblema.trim(),
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

  return (
    <main className="min-h-screen bg-gray-100 p-6 text-gray-900 md:p-8">
      <section className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Link href="/" className="text-sm font-semibold text-blue-600">
            ← Voltar para chamados
          </Link>
        </div>

        <div className="rounded-xl bg-white p-6 shadow">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Novo chamado
          </p>

          <h1 className="mt-2 text-2xl font-bold">
            Abrir novo chamado técnico
          </h1>

          <p className="mt-3 text-gray-600">
            Preencha os dados iniciais para registrar um chamado técnico no
            sistema.
          </p>

          {carregando ? (
            <p className="mt-6 text-sm text-gray-600">
              Carregando dados do Supabase...
            </p>
          ) : (
            <form onSubmit={salvarChamado} className="mt-6 space-y-5">
              {erro && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  {erro}
                </div>
              )}

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Cliente
                  </label>
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
                    Técnico responsável
                  </label>
                  <select
                    value={tecnicoId}
                    onChange={(event) => setTecnicoId(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Selecione um técnico</option>
                    {tecnicos.map((tecnico) => (
                      <option key={tecnico.id} value={tecnico.id}>
                        {tecnico.nome_completo}
                      </option>
                    ))}
                  </select>
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
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="critica">Crítica</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Título do chamado
                </label>
                <input
                  type="text"
                  value={titulo}
                  onChange={(event) => setTitulo(event.target.value)}
                  placeholder="Ex.: PDV sem comunicação com impressora térmica"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold">
                  Descrição do problema
                </label>
                <textarea
                  value={descricaoProblema}
                  onChange={(event) =>
                    setDescricaoProblema(event.target.value)
                  }
                  rows={5}
                  placeholder="Descreva o problema relatado pela loja ou cliente."
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
                  {salvando ? "Salvando..." : "Salvar chamado"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}