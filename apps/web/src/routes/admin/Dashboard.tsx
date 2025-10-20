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
