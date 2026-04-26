"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type RegistroTecnicoFormProps = {
  chamadoId: string;
};

const TECNICO_ID = "28a09667-d9f1-4567-af22-f2a3160adfa1";

export function RegistroTecnicoForm({ chamadoId }: RegistroTecnicoFormProps) {
  const router = useRouter();

  const [problemaIdentificado, setProblemaIdentificado] = useState("");
  const [testesFeitos, setTestesFeitos] = useState("");
  const [solucao, setSolucao] = useState("");
  const [observacoesInternas, setObservacoesInternas] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    return createClient(supabaseUrl, supabaseKey);
  }, [supabaseUrl, supabaseKey]);

  async function salvarRegistro(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setErro("Configuração do Supabase não encontrada.");
      return;
    }

    if (
      !problemaIdentificado.trim() ||
      !testesFeitos.trim() ||
      !solucao.trim()
    ) {
      setErro("Preencha problema identificado, testes feitos e solução.");
      return;
    }

    setErro("");
    setSucesso("");
    setSalvando(true);

    const { error } = await supabase.from("registros_tecnicos").insert({
      chamado_id: chamadoId,
      tecnico_id: TECNICO_ID,
      problema_identificado: problemaIdentificado.trim(),
      testes_feitos: testesFeitos.trim(),
      solucao: solucao.trim(),
      observacoes_internas: observacoesInternas.trim(),
    });

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setProblemaIdentificado("");
    setTestesFeitos("");
    setSolucao("");
    setObservacoesInternas("");
    setSucesso("Registro técnico salvo com sucesso.");
    setSalvando(false);

    router.refresh();
  }

  return (
    <div className="mb-6 rounded-xl bg-white p-6 shadow">
      <h2 className="text-xl font-bold">Adicionar registro técnico</h2>

      <p className="mt-2 text-sm text-gray-600">
        Registre o diagnóstico, os testes executados e a solução aplicada no
        atendimento.
      </p>

      <form onSubmit={salvarRegistro} className="mt-5 space-y-4">
        {erro && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
            {sucesso}
          </div>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Problema identificado
          </label>
          <textarea
            value={problemaIdentificado}
            onChange={(event) => setProblemaIdentificado(event.target.value)}
            rows={3}
            placeholder="Ex.: Scanner liga, porém não realiza leitura de código de barras."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Testes feitos
          </label>
          <textarea
            value={testesFeitos}
            onChange={(event) => setTestesFeitos(event.target.value)}
            rows={3}
            placeholder="Ex.: Realizados testes com códigos de barras físicos e digitais."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Solução</label>
          <textarea
            value={solucao}
            onChange={(event) => setSolucao(event.target.value)}
            rows={3}
            placeholder="Ex.: Equipamento validado após ajuste de conexão e novo teste no PDV."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">
            Observações internas
          </label>
          <textarea
            value={observacoesInternas}
            onChange={(event) => setObservacoesInternas(event.target.value)}
            rows={3}
            placeholder="Campo opcional para observações internas da operação."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={salvando}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {salvando ? "Salvando..." : "Salvar registro técnico"}
          </button>
        </div>
      </form>
    </div>
  );
}