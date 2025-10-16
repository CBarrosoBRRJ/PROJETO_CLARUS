import React from "react";
import "../../styles/flip.css";
import { Link } from "react-router-dom";

// Fetch helper (JSON + trata erro .detail do FastAPI)
async function jfetch(url: string, init?: RequestInit) {
  const r = await fetch(url, { headers: { "Content-Type": "application/json" }, credentials: "include", ...init });
  if (!r.ok) {
    let msg = r.statusText;
    try { const j = await r.json(); if (j?.detail) msg = j.detail; } catch {}
    throw new Error(msg);
  }
  return r.json();
}

// Toast simples
function Toast({ msg, onDone }: { msg: string; onDone?: () => void }) {
  React.useEffect(() => {
    const t = setTimeout(() => onDone?.(), 2800);
    return () => clearTimeout(t);
  }, []);
  return (
    <div className="fixed top-6 right-6 z-[60] rounded-lg bg-slate-900 text-white px-4 py-3 shadow-lg ring-1 ring-white/10 animate-toast-in">
      {msg}
    </div>
  );
}

// Modal genérico
function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[520px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-black/5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-slate-500 hover:text-slate-700" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function LoginPage() {
  type Face = "login" | "request" | "activate";
  const [face, setFace] = React.useState<Face>("login");
  const [err, setErr] = React.useState<string>("");
  const [toast, setToast] = React.useState<string>("");

  // Modais
  const [forgotOpen, setForgotOpen] = React.useState(false);
  const [contactOpen, setContactOpen] = React.useState(false);

  // Flip: reaplica animação a cada troca
  function flipTo(next: Face) {
    setErr("");
    const card = document.querySelector("[data-flip='1']");
    card?.classList.remove("flip-once");
    // @ts-ignore reflow
    void (card as any)?.offsetWidth;
    card?.classList.add("flip-once");
    if (face === next) setFace("login"); else setFace(next);
  }

  // ===== Handlers =====
  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const remember = !!fd.get("remember");
    setErr("");
    try {
      await jfetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, remember }) });
      window.location.href = "/admin";
    } catch (ex: any) { setErr(ex.message || "Falha no login"); }
  }

  async function handleGoogle() {
    try {
      await jfetch("/api/auth/google", { method: "POST", body: JSON.stringify({ id_token: null }) });
      window.location.href = "/admin";
    } catch { setErr("Falha no Google Login"); }
  }

  async function handleRequestSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name  = String(fd.get("name")  || "").trim();
    const email = String(fd.get("email") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    setErr("");
    try {
      await jfetch("/api/access/request", { method: "POST", body: JSON.stringify({ name, email, phone }) });
      (e.target as HTMLFormElement).reset();
      setToast("Sua solicitação foi enviada.");
      setFace("login");
    } catch (ex:any) { setErr(ex.message || "Falha no envio"); }
  }

  async function handleActivateSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const token    = String(fd.get("token")    || "").trim();
    const password = String(fd.get("password") || "");
    const confirm  = String(fd.get("confirm")  || "");
    if (password !== confirm) { setErr("As senhas não coincidem"); return; }
    setErr("");
    try {
      await jfetch("/api/access/activate", { method: "POST", body: JSON.stringify({ token, password }) });
      (e.target as HTMLFormElement).reset();
      setToast("Token validado, verifique seu e-mail.");
      setFace("login");
    } catch (ex:any) { setErr(ex.message || "Falha na ativação"); }
  }

  async function handleForgotSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    try {
      await jfetch("/api/auth/forgot", { method: "POST", body: JSON.stringify({ email }) });
      setForgotOpen(false);
      setToast("Se existir, enviamos instruções para o e-mail informado.");
    } catch { setToast("Não foi possível processar agora."); }
  }

  async function handleContactSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name    = String(fd.get("name")    || "").trim();
    const email   = String(fd.get("email")   || "").trim();
    const phone   = String(fd.get("phone")   || "").trim();
    const message = String(fd.get("message") || "").trim();
    try {
      await jfetch("/api/contact", { method: "POST", body: JSON.stringify({ name, email, phone, message }) });
      setContactOpen(false);
      setToast("Mensagem enviada. Em breve entraremos em contato.");
    } catch { setToast("Não foi possível enviar agora."); }
  }

  // Critérios de senha (ativar)
  const [pwd, setPwd] = React.useState(""); const [conf, setConf] = React.useState("");
  const strength = {
    len: pwd.length >= 8,
    upper: /[A-Z]/.test(pwd),
    special: /[^A-Za-z0-9]/.test(pwd),
    match: pwd.length>0 && pwd === conf
  };
  const canActivate = strength.len && strength.upper && strength.special && strength.match;

  // UI: mostrar senha
  const [showPwdLogin, setShowPwdLogin] = React.useState(false);
  const [showPwdAct, setShowPwdAct] = React.useState(false);
  const [showPwdAct2, setShowPwdAct2] = React.useState(false);

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden text-slate-900">
      {/* camadas FIXAS 50/50 cobrindo o viewport inteiro */}
      <div className="fixed inset-y-0 left-0 w-[50vw] bg-[#0f1a27] z-0" aria-hidden />
      <div className="fixed inset-y-0 right-0 w-[50vw] bg-[#f6f8fb] z-0" aria-hidden />

      {/* conteúdo acima do fundo */}
      <div className="relative z-10 grid min-h-dvh w-full lg:grid-cols-[1.15fr_0.85fr]">
        {/* Lado esquerdo (hero) */}
        <section className="relative min-h-dvh flex flex-col justify-center text-white px-10 py-12 lg:px-16">
          <div className="mb-8"><img src="/logo.svg" alt="Clarus" className="h-7" /></div>
          <h1 className="max-w-2xl text-4xl md:text-5xl font-extrabold leading-tight">Clarus – decisões com dados claros.</h1>
          <p className="mt-5 max-w-2xl text-base md:text-lg text-white/90">
            O Clarus é um sistema de inteligência operacional que conecta fontes, monitora KPIs e transforma dados dispersos em ação.
            Reduza retrabalho, acelere análises e compartilhe insights com governança.
          </p>
          <p className="mt-8 italic text-cyan-200">A clareza que sua gestão precisa.</p>
          <p className="absolute inset-x-10 bottom-6 text-xs text-white/60">© 2025 Clarus, Inc. Todos os direitos reservados. | <a href="#" className="underline">Privacidade</a></p>
        </section>

        {/* Lado direito (card) */}
        <section className="relative flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl ring-1 ring-black/5 mb-8 min-h-[520px]" data-flip="1">
            {face === "login" && (
              <>
                <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 ring-1 ring-cyan-300/50">
                  <div className="h-4 w-4 rounded-sm bg-cyan-500" />
                </div>
                <h2 className="text-xl font-semibold text-center">Acesse o seu painel</h2>
                <p className="mt-1 text-center text-sm text-slate-500">Use e-mail profissional.</p>

                {err && <div className="mt-3 mb-2 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

                <form onSubmit={handleLoginSubmit} className="space-y-3 mt-4">
                  <div>
                    <label className="text-xs text-slate-600">E-mail</label>
                    <input name="email" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" defaultValue="admin@clarus.com" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-600">Senha</label>
                      <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={()=>setForgotOpen(true)}>Esqueceu a sua senha?</button>
                    </div>
                    <div className="relative">
                      <input name="password" type={showPwdLogin ? "text" : "password"} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm pr-10" defaultValue="clarus" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700" onClick={()=>setShowPwdLogin(s=>!s)} aria-label="Mostrar senha">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>
                      </button>
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 text-sm text-slate-600 select-none">
                    <input name="remember" type="checkbox" className="rounded border-slate-300" defaultChecked /> Lembrar-me
                  </label>
                  <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700">Entrar</button>
                </form>
              </>
            )}

            {face === "request" && (
              <>
                <h2 className="text-xl font-semibold text-center">Solicitar acesso</h2>
                <p className="mt-1 text-center text-sm text-slate-500">Envie seus dados para revisão do administrador.</p>
                {err && <div className="mt-3 mb-2 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
                <form onSubmit={handleRequestSubmit} className="space-y-3 mt-4">
                  <div><label className="text-xs text-slate-600">Nome completo</label><input name="name" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs text-slate-600">E-mail profissional</label><input name="email" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></div>
                  <div><label className="text-xs text-slate-600">Telefone</label><input name="phone" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></div>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={()=>setFace("login")} className="text-sm text-slate-600 hover:underline">Voltar</button>
                    <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700">Enviar</button>
                  </div>
                </form>
              </>
            )}

            {face === "activate" && (
              <>
                <h2 className="text-xl font-semibold text-center">Ativar conta</h2>
                <p className="mt-1 text-center text-sm text-slate-500">Recebeu um convite? Ative com o token.</p>
                {err && <div className="mt-3 mb-2 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
                <form onSubmit={handleActivateSubmit} className="space-y-3 mt-4">
                  <div><label className="text-xs text-slate-600">Token (12 caracteres)</label><input name="token" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm uppercase" maxLength={12} /></div>
                  <div>
                    <label className="text-xs text-slate-600">Defina uma senha</label>
                    <div className="relative">
                      <input name="password" type={showPwdAct ? "text" : "password"} onChange={e=>setPwd(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm pr-10" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" onClick={()=>setShowPwdAct(s=>!s)} aria-label="Mostrar senha">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-600">Confirmar senha</label>
                    <div className="relative">
                      <input name="confirm" type={showPwdAct2 ? "text" : "password"} onChange={e=>setConf(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm pr-10" />
                      <button type="button" className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500" onClick={()=>setShowPwdAct2(s=>!s)} aria-label="Mostrar senha">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>
                      </button>
                    </div>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-1">
                    <li className={strength.len?"text-emerald-600":"text-slate-500"}>• mínimo 8 caracteres</li>
                    <li className={strength.upper?"text-emerald-600":"text-slate-500"}>• ao menos 1 maiúscula</li>
                    <li className={strength.special?"text-emerald-600":"text-slate-500"}>• ao menos 1 especial</li>
                    <li className={strength.match?"text-emerald-600":"text-slate-500"}>• confirmação igual</li>
                  </ul>

                  <div className="flex items-center justify-between">
                    <button type="button" onClick={()=>setFace("login")} className="text-sm text-slate-600 hover:underline">Voltar</button>
                    <button type="submit" disabled={!canActivate} className={`rounded-lg px-4 py-2 text-white ${canActivate?'bg-indigo-600 hover:bg-indigo-700':'bg-slate-300 cursor-not-allowed'}`}>Ativar</button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* links abaixo do card */}
          <div className="mt-5 flex gap-10 text-sm text-slate-600">
            <div className="text-center">
              <button className="text-indigo-600 hover:underline" onClick={()=>flipTo("request")}>Solicitar acesso</button>
              <p className="text-xs text-slate-500">Envie seus dados para revisão do administrador.</p>
            </div>
            <div className="text-center">
              <button className="text-indigo-600 hover:underline" onClick={()=>flipTo("activate")}>Ativar conta</button>
              <p className="text-xs text-slate-500">Recebeu um convite? Ative com o token.</p>
            </div>
          </div>

          <p className="mt-6 text-sm text-slate-500">
            Precisa de ajuda? <button className="text-indigo-600 hover:underline" onClick={()=>setContactOpen(true)}>Fale conosco.</button>
          </p>
        </section>
      </div>

      {toast && <Toast msg={toast} onDone={()=>setToast("")} />}

      {/* Modais */}
      <Modal open={forgotOpen} title="Esqueceu a sua senha?" onClose={()=>setForgotOpen(false)}>
        <p className="text-sm text-slate-600 mb-3">Informe o e-mail da sua conta para enviarmos as instruções de recuperação.</p>
        <form onSubmit={handleForgotSubmit} className="space-y-3">
          <div><label className="text-xs text-slate-600">E-mail</label><input name="email" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>setForgotOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Enviar</button>
          </div>
        </form>
      </Modal>

      <Modal open={contactOpen} title="Fale conosco" onClose={()=>setContactOpen(false)}>
        <p className="text-sm text-slate-600 mb-3">Deixe seu contato e retornaremos em breve.</p>
        <form onSubmit={handleContactSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-xs text-slate-600">Nome</label><input name="name" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></div>
            <div><label className="text-xs text-slate-600">Telefone</label><input name="phone" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></div>
          </div>
          <div><label className="text-xs text-slate-600">E-mail</label><input name="email" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></div>
          <div><label className="text-xs text-slate-600">Mensagem</label><textarea name="message" rows={4} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"></textarea></div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>setContactOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Enviar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
