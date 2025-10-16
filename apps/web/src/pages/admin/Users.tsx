import React from "react";

export default function Users(){
  const [rows, setRows] = React.useState<any[]>([]);
  React.useEffect(()=>{
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(({ tenant }) => {
        // placeholder: quando criarmos o endpoint /admin/users, listamos de fato
        setRows([]);
      });
  },[]);
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <p className="text-slate-500">CRUD virá na próxima sub-etapa.</p>
        <div className="mt-6 rounded-xl bg-white p-6 shadow ring-1 ring-black/5">
          <div className="text-sm text-slate-500">Nenhum dado ainda.</div>
        </div>
      </div>
    </div>
  )
}