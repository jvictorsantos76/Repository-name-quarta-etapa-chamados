import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

type Chamado = {
  numero: number;
  titulo: string;
  status: string;
  prioridade: string;
  clientes: {
    nome_fantasia: string;
  } | null;
  lojas: {
    nome_loja: string;
  } | null;
  tecnico: {
    nome_completo: string;
  } | null;
};

export default async function Home() {
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

  const { data: chamados, error } = await supabase
    .from("chamados")
    .select(`
    numero,
    titulo,
    status,
    prioridade,
    clientes (
      nome_fantasia
    ),
    lojas (
      nome_loja
    ),
    tecnico:perfis!chamados_tecnico_id_fkey (
      nome_completo
    )
  `)
    .order("numero", { ascending: true });

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Erro ao carregar chamados</h1>
        <pre className="mt-4 whitespace-pre-wrap rounded bg-gray-100 p-4 text-sm">
          {error.message}
        </pre>
      </main>
    );
  }

    const listaChamados = (chamados as unknown as Chamado[] | null) ?? [];

  const totalAbertos = listaChamados.filter(
    (chamado) => chamado.status === "aberto"
  ).length;

  const totalEmAtendimento = listaChamados.filter(
    (chamado) => chamado.status === "em_atendimento"
  ).length;

  const totalPendentes = listaChamados.filter(
    (chamado) => chamado.status === "pendente"
  ).length;

  const totalFinalizados = listaChamados.filter(
    (chamado) => chamado.status === "finalizado"
  ).length;

  return (
    <main className="min-h-screen bg-gray-100 p-8 text-gray-900">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Quarta Etapa
          </p>
          <h1 className="text-3xl font-bold">Gestão de Chamados</h1>
          <p className="mt-2 text-gray-600">
            Primeira listagem integrada ao Supabase.
          </p>
        </div>



        <div className="mb-6 space-y-4 md:hidden">
          {listaChamados.map((chamado) => (
            <div
              key={chamado.numero}
              className="rounded-xl bg-white p-5 shadow"
            >
              <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-500">
                    Chamado #{chamado.numero}
                  </p>
                                    <Link
                    href={`/chamados/${chamado.numero}`}
                    className="mt-1 block text-base font-bold hover:text-blue-600"
                  >
                    {chamado.titulo}
                  </Link>
                </div>

                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium">
                  {chamado.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <p>
                  <span className="font-semibold">Cliente:</span>{" "}
                  {chamado.clientes?.nome_fantasia}
                </p>

                <p>
                  <span className="font-semibold">Loja:</span>{" "}
                  {chamado.lojas?.nome_loja}
                </p>

                <p>
                  <span className="font-semibold">Prioridade:</span>{" "}
                  {chamado.prioridade}
                </p>

                <p>
                  <span className="font-semibold">Técnico:</span>{" "}
                  {chamado.tecnico?.nome_completo}
                </p>
              </div>
            </div>
          ))}
        </div>

                <div className="hidden overflow-hidden rounded-xl bg-white shadow md:block">
                          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Chamados recentes</h2>
            <p className="text-sm text-gray-600">
              Acompanhamento inicial dos chamados técnicos cadastrados.
            </p>
          </div>

          <Link
            href="/chamados/novo"
            className="rounded-lg bg-gray-900 px-4 py-2 text-center text-sm font-semibold text-white shadow hover:bg-gray-800"
          >
            Novo chamado
          </Link>
        </div>
                  <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm font-medium text-gray-500">Abertos</p>
              <p className="mt-2 text-3xl font-bold">{totalAbertos}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm font-medium text-gray-500">Em atendimento</p>
              <p className="mt-2 text-3xl font-bold">{totalEmAtendimento}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm font-medium text-gray-500">Pendentes</p>
              <p className="mt-2 text-3xl font-bold">{totalPendentes}</p>
            </div>

            <div className="rounded-xl bg-white p-5 shadow">
              <p className="text-sm font-medium text-gray-500">Finalizados</p>
              <p className="mt-2 text-3xl font-bold">{totalFinalizados}</p>
            </div>
          </div>

          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-gray-900 text-white">
              <tr>
                <th className="px-4 py-3">Nº</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Loja</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Prioridade</th>
                <th className="px-4 py-3">Técnico</th>
              </tr>
            </thead>
            <tbody>
              {listaChamados.map((chamado) => (
                <tr key={chamado.numero} className="border-b last:border-b-0">
                  <td className="px-4 py-3 font-semibold">{chamado.numero}</td>
                                    <td className="px-4 py-3">
                    <Link
                      href={`/chamados/${chamado.numero}`}
                      className="font-medium hover:text-blue-600"
                    >
                      {chamado.titulo}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{chamado.clientes?.nome_fantasia}</td>
                  <td className="px-4 py-3">{chamado.lojas?.nome_loja}</td>
                  <td className="px-4 py-3">{chamado.status}</td>
                  <td className="px-4 py-3">{chamado.prioridade}</td>
                  <td className="px-4 py-3">{chamado.tecnico?.nome_completo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}