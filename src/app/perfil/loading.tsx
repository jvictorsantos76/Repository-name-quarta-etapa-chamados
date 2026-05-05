export default function PerfilLoading() {
  return (
    <main className="min-h-screen bg-gray-100 text-gray-900">
      <div className="mb-6 border-b border-gray-200 bg-white px-4 py-3 shadow-sm md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-11 w-56 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
      <section className="mx-auto max-w-6xl px-6 pb-10 md:px-8">
        <div className="mb-6 h-40 animate-pulse rounded-lg bg-white shadow-sm" />
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <div className="h-64 animate-pulse rounded-lg bg-white shadow-sm" />
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-lg bg-white shadow-sm" />
            <div className="h-40 animate-pulse rounded-lg bg-white shadow-sm" />
            <div className="h-64 animate-pulse rounded-lg bg-white shadow-sm" />
          </div>
        </div>
      </section>
    </main>
  );
}
