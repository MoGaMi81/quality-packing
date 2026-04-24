"use client";

type ActionCard = {
  title: string;
  description: string;
  badge?: string | number | null;
  onClick: () => void;
};

type Props = {
  title: string;
  subtitle: string;
  actions: ActionCard[];
  onLogout?: () => void;
};

export default function HomeDashboard({
  title,
  subtitle,
  actions,
  onLogout,
}: Props) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="fixed inset-0 z-0">
        <img
          src="/images/fondo.png"
          alt=""
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-white/45 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-8">
        <header className="mb-10 flex items-center justify-between">
          <img src="/logo.jpeg" alt="Quality Fish" className="w-32" />

          {onLogout && (
            <button
              onClick={onLogout}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700"
            >
              Cerrar sesión
            </button>
          )}
        </header>

        <section className="mb-8 rounded-3xl bg-white/85 backdrop-blur-md p-8 shadow-xl">
          <h1 className="text-4xl font-bold text-gray-900">{title}</h1>
          <p className="mt-2 text-lg text-gray-600">{subtitle}</p>
        </section>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {actions.map((action) => (
            <button
              key={action.title}
              onClick={action.onClick}
              className="group rounded-2xl bg-white/90 backdrop-blur-md p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {action.title}
                </h2>

                {action.badge !== undefined && action.badge !== null && (
                  <span className="rounded-full bg-black px-3 py-1 text-sm font-bold text-white">
                    {action.badge}
                  </span>
                )}
              </div>

              <p className="text-gray-600">{action.description}</p>

              <div className="mt-6 font-semibold text-gray-900 group-hover:underline">
                Entrar →
              </div>
            </button>
          ))}
        </section>
      </div>
    </main>
  );
}