import React from "react";

export default function LogoutPage() {
  React.useEffect(() => {
    (async () => {
      try { await fetch("/api/auth/logout", { method: "POST", credentials: "include" }); } catch {}
      window.location.replace("/login");
    })();
  }, []);
  return <div style={{padding:24,fontFamily:"system-ui"}}>Saindo…</div>;
}
