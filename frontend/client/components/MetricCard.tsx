import type { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  accent: string;
}

export function MetricCard({ label, value, detail, icon, accent }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-[#0c1b2c] p-5 transition-colors hover:border-white/[0.14]">
      <div className="mb-6 flex items-start justify-between">
        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{label}</span>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${accent}`}>{icon}</span>
      </div>
      <div className="text-2xl font-bold tracking-tight text-white">{value}</div>
      <div className="mt-2 text-xs text-slate-500">{detail}</div>
    </div>
  );
}
