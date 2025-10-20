<#
VITE-ONLY: RBAC + routing after login
- /admin/dashboard (Clarus staff)
- /workspace/controle (clients)
Windows PowerShell 5 compatible (no ternary, no interpolation in here-strings)
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Find-WebRoot {
  $here = $PSScriptRoot
  if ([string]::IsNullOrWhiteSpace($here)) { $here = (Get-Location).Path }
  while ($true) {
    if (Test-Path (Join-Path $here "package.json")) { return $here }
    $parent = Split-Path -Parent $here
    if ($parent -eq $here) { throw "package.json not found. Run inside apps\web\tools or below it." }
    $here = $parent
  }
}

$WEB = Find-WebRoot

# Vite sanity check
if (-not (Test-Path (Join-Path $WEB "vite.config.*")) -and -not (Test-Path (Join-Path $WEB "index.html"))) {
  throw "This script is Vite-only. vite.config.* or index.html not found."
}

# base folders
$compDir = Join-Path $WEB "src\components"
$utilDir = Join-Path $WEB "src\lib"
$routes  = Join-Path $WEB "src\routes"
New-Item -Force -ItemType Directory $compDir | Out-Null
New-Item -Force -ItemType Directory $utilDir | Out-Null
New-Item -Force -ItemType Directory (Join-Path $routes "admin") | Out-Null
New-Item -Force -ItemType Directory (Join-Path $routes "workspace") | Out-Null

# GlassCard.tsx
$glass = @'
import React from "react";
type Props = React.PropsWithChildren<{ className?: string; title?: string; hint?: string }>;
export function GlassCard({ className="", title, hint, children }: Props) {
  return (
    <div className={"rounded-2xl shadow-md bg-white/60 dark:bg-slate-900/50 backdrop-blur p-4 border border-slate-200/40 dark:border-slate-700/40 "+className}>
      {(title || hint) && (
        <div className="mb-2 flex items-center justify-between">
          {title && <h3 className="text-slate-800 dark:text-slate-100 font-semibold">{title}</h3>}
          {hint && <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"#B0E0E6"}}>{hint}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
'@
Set-Content -Encoding UTF8 -Path (Join-Path $compDir "GlassCard.tsx") -Value $glass

# rbac.ts
$rbac = @'
export type ClarusUser = any;
export function isStaff(user: ClarusUser | null | undefined): boolean {
  if (!user) return false;
  try {
    const am = (user as any).app_metadata || (user as any).appMetadata;
    if (am?.is_staff === true) return true;
    const claimStaff = (user as any)["https://clarus.app/is_staff"];
    if (claimStaff === true) return true;
    const roles = (user as any)["https://clarus.app/roles"] || am?.roles || (user as any).roles || [];
    if (Array.isArray(roles) && roles.some((r) => String(r).toUpperCase().includes("STAFF"))) return true;
    const org = (user as any)["https://clarus.app/org"] || am?.org || am?.organization;
    if (typeof org === "string" && org.toLowerCase().includes("clarus")) return true;
  } catch {}
  return false;
}
'@
Set-Content -Encoding UTF8 -Path (Join-Path $utilDir "rbac.ts") -Value $rbac

# Sidebar.tsx (React Router)
$sidebar = @'
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const { pathname } = useLocation();
  const items = [
    { label: "Workspace", children: [{ label: "Controle", to: "/workspace/controle" }]},
    { label: "Gestao",    children: [{ label: "Controle", to: "/workspace/controle" }]},
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
'@
Set-Content -Encoding UTF8 -Path (Join-Path $compDir "Sidebar.tsx") -Value $sidebar

# Admin page
$admin = @'
import React from "react";
import { GlassCard } from "../../components/GlassCard";

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{color:"#000080"}}>Clarus - Admin Dashboard</h1>
        <span className="text-xs rounded-full px-2 py-0.5" style={{background:"#20B2AA"}}>multi-tenant</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard title="Usuarios" hint="Staff"><div className="text-3xl font-bold">42</div></GlassCard>
        <GlassCard title="Clientes" hint="ativos"><div className="text-3xl font-bold">128</div></GlassCard>
        <GlassCard title="Convites" hint="pendentes"><div className="text-3xl font-bold">3</div></GlassCard>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard title="Acessos" hint="RBAC">OWNER 1 • ADMIN 2 • EDITOR 6 • VIEWER 12</GlassCard>
        <GlassCard title="Solicitacoes">Onboarding • Reset MFA • Suporte</GlassCard>
        <GlassCard title="Tenant atual">tenant_id: demonstracao</GlassCard>
      </div>
    </div>
  )
}
'@
Set-Content -Encoding UTF8 -Path (Join-Path $routes "admin\Dashboard.tsx") -Value $admin

# Client page
$client = @'
import React from "react";
import { GlassCard } from "../../components/GlassCard";

export default function Page() {
  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold" style={{color:"#000080"}}>Workspace - Controle</h1>
        <span className="text-xs rounded-full px-2 py-0.5" style={{background:"#FFFF00"}}>online</span>
        <span className="text-xs rounded-full px-2 py-0.5" style={{background:"#B0E0E6"}}>layout aprovado</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard title="Ordens abertas" hint="Hoje"><div className="text-3xl font-bold">12</div></GlassCard>
        <GlassCard title="Clientes ativos" hint="Mes"><div className="text-3xl font-bold">0</div></GlassCard>
        <GlassCard title="Fornecedores" hint="Base"><div className="text-3xl font-bold">15</div></GlassCard>
      </div>
    </div>
  )
}
'@
Set-Content -Encoding UTF8 -Path (Join-Path $routes "workspace\Controle.tsx") -Value $client

# AppShell
$appShell = @'
import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
export function AppShell(){ return(<div className="flex min-h-screen"><Sidebar/><main className="flex-1"><Outlet/></main></div>)}
'@
Set-Content -Encoding UTF8 -Path (Join-Path $routes "AppShell.tsx") -Value $appShell

# Landing (decide para onde ir apos login)
$landing = @'
import React from "react";
import { Navigate } from "react-router-dom";
import { isStaff } from "../lib/rbac";
let user:any=null;
try { user = (require("@auth0/auth0-react") as any).useAuth0?.().user || (window as any).__clarus_user || null } catch {}
export default function Landing(){ return <Navigate to={isStaff(user)?"/admin/dashboard":"/workspace/controle"} replace/> }
'@
Set-Content -Encoding UTF8 -Path (Join-Path $utilDir "landing.tsx") -Value $landing

# main.tsx/jsx
$mainPath = Join-Path $WEB "src\main.tsx"
if (-not (Test-Path $mainPath)) { $mainPath = Join-Path $WEB "src\main.jsx" }
if (-not (Test-Path $mainPath)) { throw "main.tsx/jsx not found." }

$main = @'
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./routes/AppShell";
import Landing from "./lib/landing";
import AdminDashboard from "./routes/admin/Dashboard";
import WorkspaceControle from "./routes/workspace/Controle";
import "./index.css";
const router = createBrowserRouter([
  { path: "/", element: <Landing/> },
  { path: "/", element: <AppShell/>, children: [
    { path: "/admin/dashboard", element: <AdminDashboard/> },
    { path: "/workspace/controle", element: <WorkspaceControle/> },
  ]}
]);
ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><RouterProvider router={router}/></React.StrictMode>);
'@
Set-Content -Encoding UTF8 -Path $mainPath -Value $main

Write-Host "Vite routing + RBAC pages created."
Write-Host "Open / after login: Staff -> /admin/dashboard | Client -> /workspace/controle"
