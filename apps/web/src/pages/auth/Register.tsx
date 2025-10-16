import React from "react";
import { Link } from "react-router-dom";

/** Botï¿½o Google no padrï¿½o Material (aproveita CSS do index.css) */
function GoogleButton({ onClick }: { onClick?: () => void }) {
  return (
    <button className="gsi-material-button w-full" onClick={onClick} type="button" aria-label="Entrar com Google">
      <div className="gsi-material-button-state"></div>
      <div className="gsi-material-button-content-wrapper">
        <div className="gsi-material-button-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            <path fill="none" d="M0 0h48v48H0z"/>
          </svg>
        </div>
        <span className="gsi-material-button-contents">Entrar com Google</span>
        <span style={{ display: "none" }}>Sign in with Google</span>
      </div>
    </button>
  );
}

export default function LoginPage() {
  const handleGoogle = () => alert("Google OAuth ï¿½ integrar depois");
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); };

  return (
    <div className="relative min-h-screen bg-[#f6f8fb] text-slate-900">
      {/* GRID split: esquerda 1.25fr, direita 1fr */}
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-[1.25fr_1fr]">
        {/* ESQUERDA ï¿½ bloco full-height com fundo escuro e glows */}
        <section className="relative flex flex-col justify-center bg-[#0f1a27] px-10 py-12 text-white rounded-none lg:rounded-l-2xl">
          <div className="pointer-events-none absolute -left-24 top-24 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl animate-pulse-slow" />
          <div className="pointer-events-none absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl animate-pulse-slower" />

          <div className="mb-8">
            <img src="/logo.svg" alt="Clarus" className="h-7" />
          </div>

          <h1 className="max-w-2xl text-4xl md:text-5xl font-extrabold leading-tight">
            Clarus ï¿½ decisï¿½es com dados claros.
          </h1>

          <p className="mt-5 max-w-2xl text-base md:text-lg text-white/90">
            O Clarus ï¿½ um sistema de inteligï¿½ncia operacional que conecta fontes,
            monitora KPIs e transforma dados dispersos em aï¿½ï¿½o. Reduza retrabalho,
            acelere anï¿½lises e compartilhe insights com governanï¿½a.
          </p>

          <p className="mt-8 italic text-cyan-200">ï¿½A clareza que sua gestï¿½o precisa.ï¿½</p>

          <p className="absolute inset-x-10 bottom-6 text-xs text-white/60">
            ï¿½ 2025 Clarus, Inc. Todos os direitos reservados. | <a href="#" className="underline">Privacidade</a>
          </p>
        </section>

        {/* DIREITA ï¿½ cartï¿½o + divisï¿½ria vertical no meio */}
        <section className="relative flex items-center justify-center p-8">
          <div className="absolute left-0 top-1/2 hidden h-3/4 -translate-y-1/2 lg:block w-px bg-slate-200/70" />
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5">
            <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 ring-1 ring-cyan-300/50">
              <div className="h-4 w-4 rounded-sm bg-cyan-500" />
            </div>
            <h2 className="text-xl font-semibold text-center">Acesse o seu painel</h2>
            <p className="mt-1 text-center text-sm text-slate-500">Use e-mail profissional.</p>

            <div className="mt-6">
              <GoogleButton onClick={handleGoogle} />
            </div>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-500">ou</span></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-slate-600">E-mail</label>
                <input className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="admin@clarus" />
              </div>
              <div>
                <label className="text-xs text-slate-600">Senha</label>
                <input type="password" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="clarus" />
              </div>
              <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700">
                Entrar
              </button>
            </form>

            <div className="mt-4 text-center text-sm text-slate-600">
              Nï¿½o tem conta? <Link to="/signup" className="text-indigo-600 hover:underline">Criar conta</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
