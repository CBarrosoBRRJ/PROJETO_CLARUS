import { clsx } from "clsx"

export function Badge({ children, intent = "default" }: { children: React.ReactNode; intent?: "default"|"success"|"warn"|"info" }) {
  const map:any = {
    default: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    success: "bg-lightseagreen/20 text-lightseagreen",
    warn: "bg-yellow/20 text-yellow",
    info: "bg-steel/20 text-steel",
  }
  return <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-xl text-xs font-medium", map[intent])}>{children}</span>
}