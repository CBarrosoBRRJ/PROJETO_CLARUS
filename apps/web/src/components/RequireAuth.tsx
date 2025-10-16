import React from "react";
import { Navigate } from "react-router-dom";

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = React.useState(true);
  const [ok, setOk] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(() => setOk(true))
      .catch(() => setOk(false))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 text-slate-500">Carregando…</div>;
  if (!ok) return <Navigate to="/login" replace />;

  return <>{children}</>;
}