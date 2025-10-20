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
