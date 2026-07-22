"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PASSWORD_POLICY_HINT } from "@/lib/auth/password-policy";
import {
  clearInvalidSupabaseBrowserSession,
  useSupabaseBrowserClient,
} from "@/lib/supabase/client";
import { alterarSenhaAutenticada } from "./actions";

export function AlterarSenhaForm() {
  const router = useRouter();
  const supabase = useSupabaseBrowserClient();
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function alterarSenha(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setEnviando(true);

    const resultado = await alterarSenhaAutenticada(senha, confirmacao);
    if (!resultado.ok) {
      setEnviando(false);
      setErro(resultado.mensagem);
      return;
    }

    await clearInvalidSupabaseBrowserSession(supabase);
    router.replace("/login");
    router.refresh();
  }

  return (
    <form onSubmit={alterarSenha} className="mt-6 space-y-4">
      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}
      <div>
        <label className="mb-2 block text-sm font-semibold">Nova senha</label>
        <input
          type="password"
          value={senha}
          onChange={(event) => setSenha(event.target.value)}
          className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          autoComplete="new-password"
          required
        />
        <p className="mt-2 text-xs text-gray-500">{PASSWORD_POLICY_HINT}</p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">
          Confirmar nova senha
        </label>
        <input
          type="password"
          value={confirmacao}
          onChange={(event) => setConfirmacao(event.target.value)}
          className="min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          autoComplete="new-password"
          required
        />
      </div>

      <button
        type="submit"
        disabled={enviando}
        className="min-h-11 w-full rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Alterando..." : "Alterar senha"}
      </button>
    </form>
  );
}
