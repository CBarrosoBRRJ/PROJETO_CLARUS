import React from "react";
type Props = React.PropsWithChildren<{ className?: string; title?: string; hint?: string }>;
export function GlassCard({ className="", title, hint, children }: Props) {
  return (
    <div className={"rounded-2xl shadow-md bg-white/60 dark:bg-slate-900/50 backdrop-blur p-4 border border-slate-200/40 dark:border-slate-700/40 "+className}>
      {(title || hint) && (
        <div className="mb-2 flex items-center justify-between">
          {title && <h3 className="text-slate-800 dark:text-slate-100 font-semibold">{title}</h3>}
          {hint && <span className="text-xs px-2 py-0.5 rounded-full" style={{background:"#B0E0E6"}}>{hint}</span>}
        </div>
      )}
      {children}
    </div>
  );
}
