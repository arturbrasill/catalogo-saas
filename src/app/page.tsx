export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md p-6 bg-white rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Catálogo Digital SaaS
        </h1>
        <p className="text-sm text-gray-600 mb-4">
          Base arquitetural e backend do Google Sheets inicializados com sucesso.
        </p>
        <span className="inline-block px-3 py-1 text-xs font-semibold text-emerald-800 bg-emerald-100 rounded-full">
          Módulo 1 Concluído
        </span>
      </div>
    </main>
  );
}
