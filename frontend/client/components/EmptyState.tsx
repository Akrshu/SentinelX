import { Database } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  compact?: boolean;
}

export function EmptyState({ title, description, compact = false }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? "px-4 py-10" : "px-6 py-16"}`}>
      <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-slate-500">
        <Database className="h-4 w-4" />
      </span>
      <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}
