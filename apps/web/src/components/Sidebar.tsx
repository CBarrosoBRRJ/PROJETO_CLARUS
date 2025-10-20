import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const { pathname } = useLocation();
  const items = [
    { label: "Workspace", children: [{ label: "Controle", to: "/workspace/controle" }]},
    { label: "Admin Clarus", children: [{ label: "Dashboard", to: "/admin/dashboard" }]},
  ];
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-3">
      <div className="mb-4 px-2">
        <span className="text-xs rounded-full px-2 py-0.5" style={{background:"#20B2AA"}}>multi-tenant</span>
      </div>
      <nav className="space-y-4">
        {items.map((g) => (
          <div key={g.label}>
            <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{g.label}</div>
            <ul className="space-y-1">
              {g.children.map((c:any) => {
                const active = pathname === c.to;
                const base = "block rounded-lg px-3 py-2 ";
                const cls  = active ? "bg-[#B0E0E6] text-slate-900" : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800";
                return (
                  <li key={c.to}>
                    <Link to={c.to} className={base+cls}>{c.label}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
