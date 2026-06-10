import Link from "next/link";
import {
  LABEL_SITUACAO_PARCEIRO,
  LABEL_TIPO_PARCEIRO,
} from "../parceiros/types";
import type { UnidadeOrganizacao } from "./types";

type Props = {
  unidades: UnidadeOrganizacao[];
};

function textoConsulta(valor: string | null | undefined) {
  const texto = String(valor ?? "").trim();
  return texto || "-";
}

export function OrganizacaoFiliaisSection({ unidades }: Props) {
  const totalUnidades = unidades.length;

  return (
    <section className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col gap-1 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-950">
            Filiais vinculadas
          </h2>
          <p className="text-sm text-gray-600">
            Consulta dos clientes e unidades operacionais vinculados a esta organização.
          </p>
        </div>
        <span className="inline-flex w-fit rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700">
          {totalUnidades} {totalUnidades === 1 ? "unidade" : "unidades"}
        </span>
      </div>

      {totalUnidades === 0 ? (
        <div className="px-4 py-5 text-sm text-gray-600">
          Nenhuma unidade operacional está vinculada a esta organização.
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="min-w-[1040px] w-full border-collapse text-left text-sm">
              <thead className="bg-gray-900 text-white">
                <tr>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Endereço</th>
                  <th className="px-4 py-3">Contato</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Tipo</th>
                  <th className="px-4 py-3">Observações</th>
                  <th className="px-4 py-3">Ação</th>
                </tr>
              </thead>
              <tbody>
                {unidades.map((unidade) => (
                  <tr
                    key={unidade.id}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <td className="px-4 py-3 align-top">
                      <p className="font-semibold text-gray-950">
                        {unidade.nome_exibicao}
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      {textoConsulta(unidade.codigo_interno)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {textoConsulta(unidade.endereco_resumido)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {textoConsulta(unidade.contato_resumido)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-800">
                        {LABEL_SITUACAO_PARCEIRO[unidade.situacao]}
                      </span>
                      {!unidade.ativo ? (
                        <span className="ml-2 inline-flex rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                          Inativo
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {LABEL_TIPO_PARCEIRO[unidade.tipo]}
                    </td>
                    <td className="px-4 py-3 align-top">
                      {textoConsulta(unidade.observacoes_resumidas)}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/cadastros/parceiros/${unidade.id}`}
                        className="text-sm font-semibold text-blue-700 underline-offset-2 hover:underline"
                      >
                        Abrir cadastro
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-gray-100 md:hidden">
            {unidades.map((unidade) => (
              <article key={unidade.id} className="space-y-3 px-4 py-4">
                <div>
                  <h3 className="text-sm font-bold text-gray-950">
                    {unidade.nome_exibicao}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-gray-500">
                    {textoConsulta(unidade.codigo_interno)}
                  </p>
                </div>
                <div className="grid gap-2 text-sm text-gray-700">
                  <p>{textoConsulta(unidade.endereco_resumido)}</p>
                  <p>{LABEL_SITUACAO_PARCEIRO[unidade.situacao]}</p>
                  <p>{LABEL_TIPO_PARCEIRO[unidade.tipo]}</p>
                </div>
                <Link
                  href={`/cadastros/parceiros/${unidade.id}`}
                  className="inline-flex min-h-9 items-center rounded-md border border-gray-300 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                >
                  Abrir cadastro
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
