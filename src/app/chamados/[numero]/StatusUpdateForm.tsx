"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import {
  formatarStatus,
  getStatusClass,
  statusChamadoOpcoes,
  type StatusChamado,
} from "../chamadoVisual";

type StatusUpdateFormProps = {
  chamadoId: string;
  statusAtual: string;
};

const USUARIO_SISTEMA_ID = "28a09667-d9f1-4567-af22-f2a3160adfa1";
type PapelStatus = "operador" | "analista" | "admin";
const papelAtual: PapelStatus = "operador";

function podeAlterarStatusFaturado(papel: PapelStatus) {
  return papel === "analista" || papel === "admin";
}

export function StatusUpdateForm({
  chamadoId,
  statusAtual,
}: StatusUpdateFormProps) {
  const router = useRouter();

  const [novoStatus, setNovoStatus] = useState<StatusChamado | "">("");
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

  const statusFaturadoBloqueado =
    statusAtual === "faturado" && !podeAlterarStatusFaturado(papelAtual);

  async function salvarStatus(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setErro("Configuração do Supabase não encontrada.");
      return;
    }

    if (!novoStatus) {
      setErro("Selecione o novo status.");
      return;
    }

    if (novoStatus === statusAtual) {
      setErro("O chamado já está com este status.");
      return;
    }

    if (statusFaturadoBloqueado) {
      setErro("Chamados faturados só poderão ser alterados por analista ou admin.");
      return;
    }

    setErro("");
    setSalvando(true);

    const atualizacao: Record<string, string> = {
      status: novoStatus,
    };

    if (novoStatus === "em_atendimento") {
      atualizacao.atendimento_iniciado_em = new Date().toISOString();
    }

    if (novoStatus === "resolvido") {
      atualizacao.finalizado_em = new Date().toISOString();
    }

    const { error: erroAtualizacao } = await supabase
      .from("chamados")
      .update(atualizacao)
      .eq("id", chamadoId);

    if (erroAtualizacao) {
      setErro(erroAtualizacao.message);
      setSalvando(false);
      return;
    }

    const { error: erroHistorico } = await supabase
      .from("historico_status")
      .insert({
        chamado_id: chamadoId,
        usuario_id: USUARIO_SISTEMA_ID,
        status_anterior: statusAtual,
        status_novo: novoStatus,
        observacao: "Status alterado na tela de detalhe do chamado.",
      });

    if (erroHistorico) {
      setErro(erroHistorico.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    setNovoStatus("");
    router.refresh();
  }

  return (
    <form onSubmit={salvarStatus} className="rounded-xl bg-white p-5 shadow">
      <h2 className="text-lg font-bold">Status do atendimento</h2>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-gray-600">Atual:</span>
        <span className={getStatusClass(statusAtual)}>
          {formatarStatus(statusAtual)}
        </span>
      </div>

      {erro && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <select
          value={novoStatus}
          onChange={(event) => setNovoStatus(event.target.value as StatusChamado)}
          disabled={statusFaturadoBloqueado || salvando}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Selecione o novo status</option>
          {statusChamadoOpcoes.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={statusFaturadoBloqueado || salvando}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {salvando ? "Salvando..." : "Salvar status"}
        </button>
      </div>

      {statusFaturadoBloqueado && (
        <p className="mt-3 text-sm text-gray-600">
          Chamado faturado bloqueado para alteração nesta etapa.
        </p>
      )}
    </form>
  );
}
