"use client";

import { useState } from "react";
import { alterarSenhaAutenticada } from "./actions";

export function AlterarSenhaForm() {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  async function alterarSenha(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setEnviando(true);

    const resultado = await alterarSenhaAutenticada(senha, confirmacao);
    setEnviando(false);

    if (!resultado.ok) {
      setErro(resultado.mensagem);
      return;
    }

    setSenha("");
    setConfirmacao("");
    setSucesso(resultado.mensagem);
  }

  return (
    <form onSubmit={alterarSenha} className="mt-6 space-y-4">
      {erro && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {erro}
        </div>
      )}
      {sucesso && (
        <div className="space-y-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          <p>{sucesso}</p>
          <a href="/login" className="font-semibold text-green-800 underline">
            Ir para o login
          </a>
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
