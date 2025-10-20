import React from "react";
import "../../styles/login.css";
import { useNavigate } from "react-router-dom";

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

// Modal com animação “macOS”
function Modal({ open, title, children, onClose }: { open: boolean; title: string; children: React.ReactNode; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 modal-backdrop" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[520px] max-w-[95vw] -translate-x-1/2 -translate-y-1/2 modal-panel">
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
  const [staffOpen, setStaffOpen]   = React.useState(false);

  // UI: mostrar senha
  const [showPwdLogin, setShowPwdLogin]   = React.useState(false);
  const [showPwdAct, setShowPwdAct]       = React.useState(false);
  const [showPwdAct2, setShowPwdAct2]     = React.useState(false);
  const [showPwdStaff, setShowPwdStaff]   = React.useState(false);

  // Efeito “carteado”: reaplica animação a cada troca de formulário
  function dealTo(next: Face) {
    setErr("");
    const card = document.querySelector("[data-deal='1']");
    card?.classList.remove("clarus-deal");
    // @ts-ignore reflow
    void (card as any)?.offsetWidth;
    card?.classList.add("clarus-deal");
    if (face === next) setFace("login"); else setFace(next);
  }

  const nav = useNavigate();

  // ===== Handlers =====
  // Cliente (usa o formulário principal)
  async function handleLoginSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const remember = !!fd.get("remember");
    setErr("");
    try {
      await jfetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, remember }) });
      (window as any).__clarus_user = { app_metadata: { is_staff: false } };
      nav("/workspace/dashboard");
    } catch (ex:any) { setErr(ex.message || "Falha no login"); }
  }

  // Staff (via modal)
  async function handleStaffSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "");
    const remember = !!fd.get("remember");
    try {
      await jfetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password, remember }) });
      (window as any).__clarus_user = { app_metadata: { is_staff: true } };
      setStaffOpen(false);
      nav("/admin/dashboard");
    } catch (ex:any) { setToast(ex.message || "Falha no login (staff)"); }
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
  const strength = { len: pwd.length >= 8, upper: /[A-Z]/.test(pwd), special: /[^A-Za-z0-9]/.test(pwd), match: pwd.length>0 && pwd === conf };
  const canActivate = strength.len && strength.upper && strength.special && strength.match;

  return (
    <div className="relative min-h-dvh w-full overflow-x-hidden text-slate-900">
      {/* fundo 50/50 */}
      <div className="fixed inset-y-0 left-0 w-[50vw] bg-[#0f1a27] z-0" aria-hidden />
      <div className="fixed inset-y-0 right-0 w-[50vw] bg-[#f6f8fb] z-0" aria-hidden />

      {/* conteúdo */}
      <div className="relative z-10 grid min-h-dvh w-full lg:grid-cols-[1.15fr_0.85fr]">
        {/* Hero */}
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

        {/* Card */}
        <section className="clarus-right-col">
          <div className="w-full max-w-md clarus-card login-card-fixed mb-8" data-deal="1">
            {face === "login" && (
              <>
                <div className="mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 ring-1 ring-cyan-300/50">
                  <div className="h-4 w-4 rounded-sm bg-cyan-500" />
                </div>
                <h2 className="text-xl font-semibold text-center">Acesse o seu painel</h2>
                <p className="mt-1 text-center text-sm text-slate-500">Use e-mail profissional.</p>

                {err && <div className="mt-3 mb-2 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}

                <form onSubmit={handleLoginSubmit} className="space-y-3 mt-4">
                  <div className="fl-group">
                    <input name="email" placeholder=" " className="fl-input" defaultValue="admin@clarus.com" />
                    <label className="fl-label">E-mail</label>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-slate-600"></label>
                      <button type="button" className="text-xs text-indigo-600 hover:underline" onClick={()=>setForgotOpen(true)}>Esqueceu a sua senha?</button>
                    </div>
                    <div className="relative fl-group mt-1">
                      <input name="password" placeholder=" " type={showPwdLogin ? "text" : "password"} className="fl-input pr-10" defaultValue="clarus" />
                      <label className="fl-label">Senha</label>
                      <button type="button" className="clarus-eye-btn" onClick={()=>setShowPwdLogin(s=>!s)} aria-label="Mostrar senha">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>
                      </button>
                    </div>
                  </div>

                  <label className="inline-flex items-center gap-2 text-sm text-slate-600 select-none">
                    <input name="remember" type="checkbox" className="rounded border-slate-300" defaultChecked /> Lembrar-me
                  </label>

                  {/* Botão principal (cliente) */}
                  <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium text-white hover:bg-indigo-700">
                    Entrar
                  </button>

                  {/* Divisor + botão Staff (elegante) */}
                  <div className="clarus-or"><span>ou</span></div>
                  <button type="button" onClick={()=>setStaffOpen(true)} className="btn-staff">
                    <span className="btn-chip"><img src="/logo.svg" alt="" /></span>
                    Entrar como <b>Staff Clarus</b>
                  </button>
                </form>
              </>
            )}

            {face === "request" && (
              <>
                <h2 className="text-xl font-semibold text-center">Solicitar acesso</h2>
                <p className="mt-1 text-center text-sm text-slate-500">Envie seus dados para revisão do administrador.</p>
                {err && <div className="mt-3 mb-2 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{err}</div>}
                <form onSubmit={handleRequestSubmit} className="space-y-3 mt-4">
                  <div className="fl-group"><input name="name" placeholder=" " className="fl-input" /><label className="fl-label">Nome completo</label></div>
                  <div className="fl-group"><input name="email" placeholder=" " className="fl-input" /><label className="fl-label">E-mail profissional</label></div>
                  <div className="fl-group"><input name="phone" placeholder=" " className="fl-input" /><label className="fl-label">Telefone</label></div>
                  <div className="flex items-center justify-between">
                    <button type="button" onClick={()=>dealTo("login")} className="text-sm text-slate-600 hover:underline">Voltar</button>
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
                  <div className="fl-group"><input name="token" placeholder=" " className="fl-input uppercase" maxLength={12} /><label className="fl-label">Token (12 caracteres)</label></div>

                  <div className="fl-group">
                    <input name="password" placeholder=" " type={showPwdAct ? "text" : "password"} onChange={e=>setPwd(e.target.value)} className="fl-input pr-10" />
                    <label className="fl-label">Defina uma senha</label>
                    <button type="button" className="clarus-eye-btn" onClick={()=>setShowPwdAct(s=>!s)} aria-label="Mostrar senha">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>
                    </button>
                  </div>

                  <div className="fl-group">
                    <input name="confirm" placeholder=" " type={showPwdAct2 ? "text" : "password"} onChange={e=>setConf(e.target.value)} className="fl-input pr-10" />
                    <label className="fl-label">Confirmar senha</label>
                    <button type="button" className="clarus-eye-btn" onClick={()=>setShowPwdAct2(s=>!s)} aria-label="Mostrar senha">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>
                    </button>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-1">
                    <li className={strength.len?"text-emerald-600":"text-slate-500"}>• mínimo 8 caracteres</li>
                    <li className={strength.upper?"text-emerald-600":"text-slate-500"}>• ao menos 1 maiúscula</li>
                    <li className={strength.special?"text-emerald-600":"text-slate-500"}>• ao menos 1 especial</li>
                    <li className={strength.match?"text-emerald-600":"text-slate-500"}>• confirmação igual</li>
                  </ul>

                  <div className="flex items-center justify-between">
                    <button type="button" onClick={()=>dealTo("login")} className="text-sm text-slate-600 hover:underline">Voltar</button>
                    <button type="submit" disabled={!canActivate} className={`rounded-lg px-4 py-2 text-white ${canActivate?'bg-indigo-600 hover:bg-indigo-700':'bg-slate-300 cursor-not-allowed'}`}>Ativar</button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* CTAs abaixo do card */}
          <div className="mt-5 flex gap-10 text-sm text-slate-600">
            <div className="text-center">
              <button className="clarus-cta-title" onClick={()=>dealTo("request")}>Solicitar acesso</button>
              <p className="clarus-cta-desc">Envie seus dados para revisão do administrador.</p>
            </div>
            <div className="text-center">
              <button className="clarus-cta-title" onClick={()=>dealTo("activate")}>Ativar conta</button>
              <p className="clarus-cta-desc">Recebeu um convite? Ative com o token.</p>
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
          <div className="fl-group"><input name="email" placeholder=" " className="fl-input" /><label className="fl-label">E-mail</label></div>
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
            <div className="fl-group"><input name="name" placeholder=" " className="fl-input" /><label className="fl-label">Nome</label></div>
            <div className="fl-group"><input name="phone" placeholder=" " className="fl-input" /><label className="fl-label">Telefone</label></div>
          </div>
          <div className="fl-group"><input name="email" placeholder=" " className="fl-input" /><label className="fl-label">E-mail</label></div>
          <div className="fl-group"><textarea name="message" rows={4} placeholder=" " className="fl-input fl-textarea"></textarea><label className="fl-label">Mensagem</label></div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>setContactOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Enviar</button>
          </div>
        </form>
      </Modal>

      {/* Modal Staff */}
      <Modal open={staffOpen} title="Entrar como Staff Clarus" onClose={()=>setStaffOpen(false)}>
        <form onSubmit={handleStaffSubmit} className="space-y-3">
          <div className="fl-group">
            <input name="email" placeholder=" " className="fl-input" defaultValue="staff@clarus.com" />
            <label className="fl-label">E-mail</label>
          </div>
          <div className="relative fl-group">
            <input name="password" placeholder=" " type={showPwdStaff ? "text" : "password"} className="fl-input pr-10" defaultValue="clarus" />
            <label className="fl-label">Senha</label>
            <button type="button" className="clarus-eye-btn" onClick={()=>setShowPwdStaff(s=>!s)} aria-label="Mostrar senha">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 5C5 5 2 12 2 12s3 7 10 7 10-7 10-7-3-7-10-7Z" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg>
            </button>
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-slate-600 select-none">
            <input name="remember" type="checkbox" className="rounded border-slate-300" defaultChecked /> Lembrar-me
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={()=>setStaffOpen(false)} className="px-4 py-2 rounded-lg border">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-lg bg-indigo-600 text-white">Entrar</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
