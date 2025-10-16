import React from "react";
import { ensureAuth } from "../../../lib/auth";

export default function DashboardPage() {
  React.useEffect(() => { ensureAuth(); }, []);

  return (
    <div className="min-h-screen grid lg:grid-cols-[240px_1fr] bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden lg:block bg-white border-r">
        <div className="h-16 flex items-center px-4 border-b">
          <img src="/logo.svg" alt="Clarus" className="h-6" />
        </div>
        <nav className="p-3 space-y-1">
          <a className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100 font-medium">Visão geral</a>
          <a className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">Relatórios</a>
          <a className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">Conectores</a>
          <a className="block rounded-lg px-3 py-2 text-sm hover:bg-slate-100">Administração</a>
        </nav>
      </aside>

      {/* Conteúdo */}
      <main>
        <div className="h-16 bg-white border-b flex items-center justify-between px-4">
          <div className="font-semibold">Workspace</div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Olá!</span>
            <button
              className="text-sm px-3 py-1.5 rounded-lg border hover:bg-slate-100"
              onClick={() => { document.cookie = "session=; Max-Age=0; path=/"; window.location.replace("/login"); }}
            >
              Sair
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-white p-4 border">
              <h3 className="font-semibold mb-1">Bem-vindo ao Clarus</h3>
              <p className="text-sm text-slate-600">
                Esta é a sua página inicial do workspace. Em breve colocamos KPIs, cards e atalhos aqui.
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 border">
              <h3 className="font-semibold mb-1">Próximos passos</h3>
              <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1">
                <li>Conectar fontes de dados</li>
                <li>Configurar métricas e dashboards</li>
                <li>Gerenciar usuários e permissões</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
