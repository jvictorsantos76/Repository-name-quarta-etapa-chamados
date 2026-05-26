"use client";

export type AccessStatusResponse = {
  kind: string;
  redirectTo: string;
  message?: string;
};

export type AccessStatusResult =
  | {
      ok: true;
      status: number;
      data: AccessStatusResponse;
    }
  | {
      ok: false;
      status: number;
      message: string;
    };

const mensagemFalhaValidacao =
  "Não foi possível validar seu acesso agora. Atualize a página e tente novamente.";

export async function fetchAccessStatus(): Promise<AccessStatusResult> {
  const resposta = await fetch("/auth/access-status", {
    method: "GET",
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  const contentType = resposta.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      status: resposta.status,
      message: mensagemFalhaValidacao,
    };
  }

  const acesso = (await resposta.json()) as AccessStatusResponse;

  if (!resposta.ok) {
    return {
      ok: false,
      status: resposta.status,
      message: acesso.message ?? mensagemFalhaValidacao,
    };
  }

  return {
    ok: true,
    status: resposta.status,
    data: acesso,
  };
}
