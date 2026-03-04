export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex">

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6">

        <h1 className="text-2xl font-bold text-slate-800 mb-8">
          Fluxa
        </h1>

        <nav className="flex flex-col gap-4 text-slate-600">

          <button className="text-left hover:text-slate-900">
            Dashboard
          </button>

          <button className="text-left hover:text-slate-900">
            Transações
          </button>

          <button className="text-left hover:text-slate-900">
            Categorias
          </button>

        </nav>

      </aside>


      {/* CONTENT */}
      <section className="flex-1 p-10">

        <h2 className="text-3xl font-bold text-slate-800 mb-6">
          Dashboard
        </h2>


        {/* CARDS */}
        <div className="grid grid-cols-3 gap-6">

          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-slate-500">
              Saldo total
            </p>

            <h3 className="text-2xl font-bold text-slate-800">
              R$ 0,00
            </h3>
          </div>


          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-slate-500">
              Receitas
            </p>

            <h3 className="text-2xl font-bold text-green-600">
              R$ 0,00
            </h3>
          </div>


          <div className="bg-white p-6 rounded-xl shadow-sm">
            <p className="text-slate-500">
              Despesas
            </p>

            <h3 className="text-2xl font-bold text-red-600">
              R$ 0,00
            </h3>
          </div>


        </div>


      </section>

    </main>
  )
}