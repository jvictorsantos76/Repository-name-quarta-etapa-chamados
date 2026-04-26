"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type StatusActionsProps = {
  chamadoId: string;
  statusAtual: string;
};

const OPERADOR_ID = "b5793ad4-5ce5-4ccd-935a-f9b91f19037c";
const TECNICO_ID = "28a09667-d9f1-4567-af22-f2a3160adfa1";

export function StatusActions({ chamadoId, statusAtual }: StatusActionsProps) {
  const router = useRouter();

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = useMemo(() => {
    if (!supabaseUrl || !supabaseKey) {
      return null;
    }

    return createClient(supabaseUrl, supabaseKey);
  }, [supabaseUrl, supabaseKey]);

  const podeIniciar =
    statusAtual === "aberto" || statusAtual === "atribuido";

  async function iniciarAtendimento() {
    if (!supabase) {
      setErro("Configuração do Supabase não encontrada.");
      return;
    }

    setErro("");
    setCarregando(true);

    const { error: erroAtualizacao } = await supabase
      .from("chamados")
      .update({
        status: "em_atendimento",
        atendimento_iniciado_em: new Date().toISOString(),
      })
      .eq("id", chamadoId);

    if (erroAtualizacao) {
      setErro(erroAtualizacao.message);
      setCarregando(false);
      return;
    }

    const { error: erroHistorico } = await supabase
      .from("historico_status")
      .insert({
        chamado_id: chamadoId,
        usuario_id: TECNICO_ID,
        status_anterior: statusAtual,
        status_novo: "em_atendimento",
        observacao: "Atendimento iniciado pelo técnico.",
      });

    if (erroHistorico) {
      setErro(erroHistorico.message);
      setCarregando(false);
      return;
    }

    setCarregando(false);
    router.refresh();
  }

  if (!podeIniciar) {
    return null;
  }

  return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
      <h2 className="text-lg font-bold">Ações do chamado</h2>

      <p className="mt-1 text-sm text-gray-600">
        Atualize o andamento operacional deste atendimento.
      </p>

      {erro && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="mt-4">
        <button
          type="button"
          onClick={iniciarAtendimento}
          disabled={carregando}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {carregando ? "Iniciando..." : "Iniciar atendimento"}
        </button>
      </div>
    </div>
  );
}