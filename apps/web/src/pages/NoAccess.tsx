import React from "react";
import Logo from "../components/Logo";

export default function NoAccess() {
  return (
    <div className="no-access">
      <header><Logo /></header>
      <div className="card">
        <h2>Vocï¿½ nï¿½o tem acesso ao Clarus</h2>
        <p>
          Este espaï¿½o ï¿½ restrito. Solicite convite usando seu e-mail profissional
          ou entre com Google em uma conta autorizada.
        </p>
        <a className="btn primary" href="/login">Voltar ao login</a>
      </div>
      <footer>ï¿½© 2025 Clarus, Inc.</footer>
    </div>
  );
}