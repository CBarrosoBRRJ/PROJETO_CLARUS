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
