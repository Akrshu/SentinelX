import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
  Target,
} from "lucide-react";

import { Link } from "react-router-dom";

import { AppShell } from "@/components/AppShell";

import { useDashboard } from "@/hooks/useDashboard";

import type { RecentIncident } from "@/types/dashboard";

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function severityClass(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return "border-red-400/20 bg-red-400/10 text-red-300";

    case "high":
      return "border-orange-400/20 bg-orange-400/10 text-orange-300";

    case "medium":
      return "border-yellow-400/20 bg-yellow-400/10 text-yellow-300";

    default:
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-300";
  }
}

function statusClass(status: string) {
  switch (status.toLowerCase()) {
    case "open":
      return "text-red-300";

    case "investigating":
      return "text-yellow-300";

    case "contained":
      return "text-cyan-300";

    case "resolved":
      return "text-emerald-300";

    case "closed":
      return "text-slate-400";

    default:
      return "text-slate-400";
  }
}

function postureClass(label: string) {
  switch (label.toLowerCase()) {
    case "critical":
      return "text-red-300";

    case "high":
      return "text-orange-300";

    case "medium":
      return "text-yellow-300";

    case "low":
      return "text-cyan-300";

    default:
      return "text-emerald-300";
  }
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone = "cyan",
}: {
  label: string;
  value: string | number;
  description: string;
  icon: typeof ShieldAlert;
  tone?: "cyan" | "red" | "orange" | "yellow";
}) {
  const tones = {
    cyan: "border-cyan-300/10 bg-cyan-300/[0.04] text-cyan-300",
    red: "border-red-400/10 bg-red-400/[0.04] text-red-300",
    orange: "border-orange-400/10 bg-orange-400/[0.04] text-orange-300",
    yellow: "border-yellow-400/10 bg-yellow-400/[0.04] text-yellow-300",
  };

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-[#091524] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
            {label}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>

          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <span
          className={`flex h-9 w-9 items-center justify-center rounded-xl border ${tones[tone]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({
          length: 4,
        }).map((_, index) => (
          <div
            key={index}
            className="h-[145px] animate-pulse rounded-2xl bg-white/[0.04]"
          />
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="h-[330px] animate-pulse rounded-2xl bg-white/[0.04]" />

        <div className="h-[330px] animate-pulse rounded-2xl bg-white/[0.04]" />
      </div>
    </div>
  );
}

function RecentIncidentCard({ incident }: { incident: RecentIncident }) {
  return (
    <Link
      to={`/incidents/${incident.id}`}
      className="group block rounded-xl border border-white/[0.07] bg-white/[0.015] p-4 transition hover:border-cyan-300/20 hover:bg-white/[0.03]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] text-slate-600">
              {incident.id}
            </span>

            <span
              className={`rounded-md border px-2 py-1 text-[9px] font-bold uppercase tracking-wide ${severityClass(
                incident.severity,
              )}`}
            >
              {incident.severity}
            </span>

            <span
              className={`text-[10px] font-semibold ${statusClass(
                incident.status,
              )}`}
            >
              {incident.status}
            </span>
          </div>

          <h3 className="mt-2 truncate text-sm font-semibold text-slate-200 group-hover:text-cyan-200">
            {incident.title}
          </h3>

          <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-slate-600">
            <span>Risk {incident.risk_score}</span>

            <span>{incident.findings_count} findings</span>

            <span>{incident.ioc_count} IOCs</span>

            <span>{formatDate(incident.created_at)}</span>
          </div>
        </div>

        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-700 transition group-hover:translate-x-1 group-hover:text-cyan-300" />
      </div>
    </Link>
  );
}

export default function Index() {
  const { dashboard, isLoading, error, reload } = useDashboard();

  const summary = dashboard.summary;

  const posture = dashboard.threatPosture;

  return (
    <AppShell>
      <div className="mx-auto max-w-[1320px]">
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]" />
              Security operations / overview
            </div>

            <h1 className="text-3xl font-bold tracking-[-0.03em] text-white sm:text-4xl">
              Operations overview
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Monitor SentinelX security posture, active incidents, recent
              activity, and investigation system health.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void reload()}
            disabled={isLoading}
            className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/[0.09] px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCcw
              className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ================================================== */}
        {/* ERROR */}
        {/* ================================================== */}

        {error && (
          <div className="mb-5 flex flex-col gap-3 rounded-xl border border-red-400/20 bg-red-400/[0.05] px-4 py-4 text-xs text-red-300 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold">
                Dashboard data could not be loaded.
              </div>

              <div className="mt-1 text-red-300/70">{error}</div>
            </div>

            <button
              type="button"
              onClick={() => void reload()}
              className="w-fit rounded-lg border border-red-400/20 px-3 py-2 font-semibold hover:bg-red-400/10"
            >
              Retry
            </button>
          </div>
        )}

        {/* ================================================== */}
        {/* LOADING */}
        {/* ================================================== */}

        {isLoading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* ============================================== */}
            {/* SUMMARY CARDS */}
            {/* ============================================== */}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total incidents"
                value={summary.totalIncidents}
                description="All persisted security cases"
                icon={ShieldAlert}
                tone="cyan"
              />

              <StatCard
                label="Active incidents"
                value={summary.activeIncidents}
                description="Open, investigating or contained"
                icon={Activity}
                tone={summary.activeIncidents > 0 ? "orange" : "cyan"}
              />

              <StatCard
                label="Critical incidents"
                value={summary.criticalIncidents}
                description="Incidents classified as critical"
                icon={AlertTriangle}
                tone={summary.criticalIncidents > 0 ? "red" : "cyan"}
              />

              <StatCard
                label="Average risk"
                value={`${summary.averageRisk}/100`}
                description="Across persisted incidents"
                icon={Target}
                tone={
                  summary.averageRisk >= 80
                    ? "red"
                    : summary.averageRisk >= 60
                      ? "orange"
                      : summary.averageRisk >= 30
                        ? "yellow"
                        : "cyan"
                }
              />
            </div>

            {/* ============================================== */}
            {/* THREAT POSTURE + RECENT INCIDENTS */}
            {/* ============================================== */}

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.8fr_1.4fr]">
              {/* THREAT POSTURE */}

              <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-300" />
                  Current security posture
                </div>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  Threat posture
                </h2>

                <div className="mt-7 flex items-center justify-center">
                  <div className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/[0.08] bg-[#07111f]">
                    <div
                      className="absolute inset-2 rounded-full"
                      style={{
                        background: `conic-gradient(#67e8f9 ${posture.value}%, rgba(255,255,255,0.06) 0)`,
                        maskImage:
                          "radial-gradient(circle, transparent 58%, black 60%)",
                        WebkitMaskImage:
                          "radial-gradient(circle, transparent 58%, black 60%)",
                      }}
                    />

                    <div className="text-center">
                      <div className="text-4xl font-bold text-white">
                        {posture.value}
                      </div>

                      <div
                        className={`mt-1 text-xs font-bold uppercase tracking-[0.14em] ${postureClass(
                          posture.label,
                        )}`}
                      >
                        {posture.label}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-2">
                  {posture.reasons && posture.reasons.length > 0 ? (
                    posture.reasons.map((reason) => (
                      <div
                        key={reason}
                        className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs text-slate-400"
                      >
                        <CircleDot className="h-3 w-3 text-cyan-300" />

                        {reason}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-3 text-xs text-slate-500">
                      No active risk indicators.
                    </div>
                  )}
                </div>
              </section>

              {/* RECENT INCIDENTS */}

              <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                      Needs attention
                    </div>

                    <h2 className="mt-2 text-lg font-semibold text-white">
                      Recent incidents
                    </h2>
                  </div>

                  <Link
                    to="/incidents"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-300 hover:text-cyan-200"
                  >
                    View all
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                <div className="mt-5 space-y-3">
                  {dashboard.recentIncidents.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/[0.1] px-5 py-10 text-center">
                      <ShieldCheck className="mx-auto h-6 w-6 text-slate-700" />

                      <div className="mt-3 text-sm font-semibold text-slate-400">
                        No incidents yet
                      </div>

                      <div className="mt-1 text-xs text-slate-600">
                        Persisted security incidents will appear here.
                      </div>
                    </div>
                  ) : (
                    dashboard.recentIncidents.map((incident) => (
                      <RecentIncidentCard
                        key={incident.id}
                        incident={incident}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* ============================================== */}
            {/* ACTIVITY + SYSTEM */}
            {/* ============================================== */}

            <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
              {/* ACTIVITY */}

              <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-300" />
                  Workspace activity
                </div>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  Recent activity
                </h2>

                <div className="mt-5">
                  {dashboard.activity.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/[0.1] px-5 py-10 text-center text-xs text-slate-600">
                      No activity recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {dashboard.activity.slice(0, 8).map((item) => (
                        <Link
                          key={`${item.type}-${item.incidentId}-${item.timestamp}`}
                          to={`/incidents/${item.incidentId}`}
                          className="group flex gap-3"
                        >
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02]">
                            {item.type === "analyst_note" ? (
                              <Target className="h-3.5 w-3.5 text-cyan-300" />
                            ) : item.type === "incident_created" ? (
                              <ShieldAlert className="h-3.5 w-3.5 text-orange-300" />
                            ) : (
                              <Activity className="h-3.5 w-3.5 text-emerald-300" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-semibold text-slate-300 group-hover:text-cyan-200">
                              {item.title}
                            </div>

                            <div className="mt-1 truncate text-[11px] text-slate-600">
                              {item.incidentId} · {item.description}
                            </div>
                          </div>

                          <div className="shrink-0 text-[10px] text-slate-700">
                            {formatDate(item.timestamp)}
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* SYSTEM STATUS */}

              <section className="rounded-2xl border border-white/[0.07] bg-[#091524] p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  <Activity className="h-3.5 w-3.5 text-emerald-300" />
                  SentinelX services
                </div>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  System status
                </h2>

                <div className="mt-5 space-y-3">
                  {[
                    ["Backend API", dashboard.system.backend],
                    ["Incident store", dashboard.system.incidentStore],
                    [
                      "Investigation engine",
                      dashboard.system.investigationEngine,
                    ],
                    ["SOC Copilot", dashboard.system.copilot],
                  ].map(([label, status]) => {
                    const online =
                      status === "online" ||
                      status === "available" ||
                      status === "ready";

                    return (
                      <div
                        key={label}
                        className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3"
                      >
                        <span className="text-xs font-medium text-slate-400">
                          {label}
                        </span>

                        <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              online
                                ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]"
                                : "bg-red-400"
                            }`}
                          />

                          <span
                            className={
                              online ? "text-emerald-300" : "text-red-300"
                            }
                          >
                            {status}
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-5 rounded-xl border border-cyan-300/10 bg-cyan-300/[0.03] p-4">
                  <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-600">
                    Last updated
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    {formatDate(dashboard.updatedAt)}
                  </div>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
