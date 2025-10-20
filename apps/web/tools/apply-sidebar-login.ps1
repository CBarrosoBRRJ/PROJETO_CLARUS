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
  throw "This patch is Vite-only. vite.config.* or index.html not found."
}

# Base folders
$compDir = Join-Path $WEB "src\components"
$utilDir = Join-Path $WEB "src\lib"
$routes  = Join-Path $WEB "src\routes"
New-Item -Force -ItemType Directory $compDir | Out-Null
New-Item -Force -ItemType Directory $utilDir | Out-Null
New-Item -Force -ItemType Directory $routes  | Out-Null
New-Item -Force -ItemType Directory (Join-Path $routes "admin") | Out-Null
New-Item -Force -ItemType Directory (Join-Path $routes "workspace") | Out-Null

# 1) Sidebar.tsx (somente Workspace e Admin Clarus)
$sidebar = @'
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
'@
Set-Content -Encoding UTF8 -Path (Join-Path $compDir "Sidebar.tsx") -Value $sidebar

# 2) Login.tsx (mock para escolher perfil)
$login = @'
import React from "react";
import { useNavigate } from "react-router-dom";

export default function Login(){
  const nav = useNavigate();
  const asStaff = () => { (window as any).__clarus_user = { app_metadata: { is_staff: true } }; nav("/"); };
  const asClient = () => { (window as any).__clarus_user = { app_metadata: { is_staff: false } }; nav("/"); };
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4 rounded-2xl border border-slate-200 p-6 bg-white">
        <h1 className="text-xl font-semibold">Login (mock)</h1>
        <p className="text-slate-600 text-sm">Selecione o perfil para testar o redirecionamento pos-login.</p>
        <div className="flex flex-col gap-3">
          <button onClick={asStaff} className="rounded-lg px-4 py-2 border bg-slate-900 text-white">Entrar como Staff Clarus</button>
          <button onClick={asClient} className="rounded-lg px-4 py-2 border">Entrar como Cliente</button>
        </div>
        <p className="text-xs text-slate-500">Depois de escolher, voce sera redirecionado para o dashboard correto.</p>
      </div>
    </div>
  );
}
'@
Set-Content -Encoding UTF8 -Path (Join-Path $routes "Login.tsx") -Value $login

# 3) Garantir landing.tsx (fallback simples se nao existir)
$landingPath = Join-Path $utilDir "landing.tsx"
if (-not (Test-Path $landingPath)) {
  $landing = @'
import React from "react";
import { Navigate } from "react-router-dom";
function isStaff(user:any){ try{
  const am = (user && (user.app_metadata||user.appMetadata)) || {};
  if (am.is_staff===true) return true;
  const roles = (user && (user["https://clarus.app/roles"]||user.roles||[])) || [];
  if (Array.isArray(roles) && roles.some(r=>String(r).toUpperCase().includes("STAFF"))) return true;
  const org = (user && (user["https://clarus.app/org"]||am.org||am.organization));
  if (typeof org==="string" && org.toLowerCase().includes("clarus")) return true;
} catch(e){} return false; }
let user:any = (window as any).__clarus_user || null;
export default function Landing(){ return <Navigate to={isStaff(user)?"/admin/dashboard":"/workspace/controle"} replace/> }
'@
  Set-Content -Encoding UTF8 -Path $landingPath -Value $landing
}

# 4) Garantir AppShell.tsx (se nao existir)
$appShellPath = Join-Path $routes "AppShell.tsx"
if (-not (Test-Path $appShellPath)) {
  $appShell = @'
import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/Sidebar";
export function AppShell(){ return(<div className="flex min-h-screen"><Sidebar/><main className="flex-1"><Outlet/></main></div>)}
'@
  Set-Content -Encoding UTF8 -Path $appShellPath -Value $appShell
}

# 5) Regravar main.tsx/jsx com rota /login
$mainTs  = Join-Path $WEB "src\main.tsx"
$mainJs  = Join-Path $WEB "src\main.jsx"
$useTsx  = $false
if (Test-Path $mainTs) { $useTsx = $true }
elseif (Test-Path $mainJs) { $useTsx = $false }
else { $useTsx = $true } # se nenhum existir, criaremos TSX

$mainTSX = @'
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./routes/AppShell";
import Landing from "./lib/landing";
import AdminDashboard from "./routes/admin/Dashboard";
import WorkspaceControle from "./routes/workspace/Controle";
import Login from "./routes/Login";
import "./index.css";

const router = createBrowserRouter([
  { path: "/login", element: <Login/> },
  { path: "/", element: <Landing/> },
  { path: "/", element: <AppShell/>, children: [
    { path: "/admin/dashboard", element: <AdminDashboard/> },
    { path: "/workspace/controle", element: <WorkspaceControle/> },
  ]}
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);
'@

$mainJSX = @'
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./routes/AppShell";
import Landing from "./lib/landing";
import AdminDashboard from "./routes/admin/Dashboard";
import WorkspaceControle from "./routes/workspace/Controle";
import Login from "./routes/Login";
import "./index.css";

const router = createBrowserRouter([
  { path: "/login", element: <Login/> },
  { path: "/", element: <Landing/> },
  { path: "/", element: <AppShell/>, children: [
    { path: "/admin/dashboard", element: <AdminDashboard/> },
    { path: "/workspace/controle", element: <WorkspaceControle/> },
  ]}
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router}/>
  </React.StrictMode>
);
'@

if ($useTsx) {
  Set-Content -Encoding UTF8 -Path $mainTs -Value $mainTSX
} else {
  Set-Content -Encoding UTF8 -Path $mainJs -Value $mainJSX
}

Write-Host "OK: Sidebar (Workspace + Admin Clarus) e /login criados/ajustados."
Write-Host "Acesse http://localhost:5175/login para escolher Staff/Cliente."
