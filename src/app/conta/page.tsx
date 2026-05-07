import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { ContaAcoesRapidas } from "@/components/ContaAcoesRapidas";
import { CONTA_PAGE_VERSION } from "@/config/version";
import { LABEL_PAPEL_USUARIO } from "@/lib/auth/permissions";
import { requirePerfilAutenticado } from "@/lib/supabase/server";

const cards = [
  {
    href: "/conta/aparencia",
    icon: "AA",
    title: "Aparência e Acessibilidade",
    description: "Tema, cor de destaque e tamanho da fonte com auto save.",
  },
  {
    href: "/conta/permissoes",
    icon: "PR",
    title: "Permissões",
    description: "Nível operacional e ações disponíveis por área do sistema.",
  },
];

function getIniciais(nome: string) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return iniciais || "QE";
}

export default async function ContaPage() {
  const perfilAtual = await requirePerfilAutenticado();

  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <AppHeader perfil={perfilAtual} />
      <section className="mx-auto max-w-6xl px-6 pb-14 pt-4 md:px-8 md:pt-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <nav
              aria-label="Navegação da conta"
              className="flex items-center gap-2 text-sm font-semibold text-gray-600"
            >
              <Link href="/" className="hover:text-gray-950">
                Chamados
              </Link>
              <span aria-hidden="true" className="text-gray-400">
                &gt;
              </span>
              <span className="text-gray-950">Conta</span>
            </nav>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">
              Conta - Quarta Etapa
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-gray-600">
              Central de configurações pessoais e consulta de permissões do
              usuário autenticado.
            </p>
          </div>
          <span className="w-fit rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
            Tela v{CONTA_PAGE_VERSION.replace(/^v/, "")}
          </span>
        </div>

        <section className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-950 text-xl font-bold text-white ring-4 ring-gray-100">
                {perfilAtual.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={perfilAtual.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getIniciais(perfilAtual.nome_completo)
                )}
              </span>
              <div className="min-w-0">
                <h2 className="break-words text-xl font-bold text-gray-950">
                  {perfilAtual.nome_completo}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {perfilAtual.cargo || LABEL_PAPEL_USUARIO[perfilAtual.papel]}
                </p>
                <p className="mt-1 truncate text-sm text-gray-500">
                  {perfilAtual.email ?? "E-mail não informado"}
                </p>
              </div>
            </div>
            <Link
              href="/conta/perfil"
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Ver perfil
            </Link>
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-sm font-bold text-blue-700">
                {card.icon}
              </span>
              <h2 className="mt-5 text-lg font-bold text-gray-950">
                {card.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {card.description}
              </p>
            </Link>
          ))}
        </div>

        <ContaAcoesRapidas variant="footer" />
      </section>
    </main>
  );
}
